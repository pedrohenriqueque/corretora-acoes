// src/controllers/mercadoController.js
const db = require('../config/database.js');
const UsuarioModel = require('../models/UsuarioModel.js');
const OrdemService = require('../services/OrdemService.js');
const MercadoService = require('../services/MercadoService.js'); // Importa o service
const TempoSistemaModel = require('../models/TempoSistemaModel');

// O estado do tempo global continua aqui na memória do Node.js
let minutoSistemaGlobal = null;

const garantirMinutoCarregado = async () => {
  if (minutoSistemaGlobal !== null) {
    return minutoSistemaGlobal;
  }

  const minutoPersistido = await TempoSistemaModel.obterMinuto();
  if (minutoPersistido === null || Number.isNaN(minutoPersistido)) {
    minutoSistemaGlobal = 0;
    await TempoSistemaModel.salvarMinuto(minutoSistemaGlobal);
    return minutoSistemaGlobal;
  }

  minutoSistemaGlobal = minutoPersistido;
  return minutoSistemaGlobal;
};

const mercadoController = {

  // ========================================================
  // 1. POST AvancaTempo
  // ========================================================
  avancaTempo: async (req, res) => {
    try {
      await garantirMinutoCarregado();
      const inc = parseInt(
        req.body.incrementoMinutos !== undefined ? req.body.incrementoMinutos : 1,
        10
      );
      if (isNaN(inc) || inc <= 0) {
        return res.status(400).json({ error: 'O incremento de minutos é inválido.' });
      }

      if (minutoSistemaGlobal >= 59) {
        return res.status(400).json({ error: 'O pregão já está encerrado (14:59). Não é possível avançar mais.' });
      }

      let incrementoReal = inc;
      let aviso = undefined;

      if (minutoSistemaGlobal + inc > 59) {
        incrementoReal = 59 - minutoSistemaGlobal;
        aviso = 'A simulação atingiu o final do dia de negociação (14:59). O tempo restante de avanço foi ajustado automaticamente.';
      }

      // Usa o service para buscar o fechamento
      const precosFechamento = await MercadoService.obterPrecosFechamento();
      let dadosMercadoFinais = [];

      for (let i = 1; i <= incrementoReal; i++) {
        if (minutoSistemaGlobal >= 59) {
          minutoSistemaGlobal = 59;
          break;
        }

        minutoSistemaGlobal += 1;

        try {
          // Coleta os preços e faz o mapeamento usando o Service
          const precosMinuto = await MercadoService.obterPrecosMinuto(minutoSistemaGlobal);


          const dadosMercado = MercadoService.mapearPrecosComVariacao(precosMinuto, precosFechamento);

          if (i === incrementoReal || minutoSistemaGlobal === 59) {
            dadosMercadoFinais = dadosMercado;
          }

          const horaExecucao = `14:${minutoSistemaGlobal.toString().padStart(2, '0')}`;
          await OrdemService.processarOrdensPendentes(precosMinuto, horaExecucao);


        } catch (error) {
          console.error(`Erro ao processar preços no minuto ${minutoSistemaGlobal}:`, error);
          if (i === incrementoReal) dadosMercadoFinais = [];
        }
      }

      await TempoSistemaModel.salvarMinuto(minutoSistemaGlobal);

      const novaHoraNegociacao = `14:${minutoSistemaGlobal.toString().padStart(2, '0')}`;
      const resposta = { novaHoraNegociacao, acoes: dadosMercadoFinais };
      if (aviso) {
        resposta.aviso = aviso;
      }
      return res.json(resposta);

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno ao avançar o tempo.' });
    }
  },

  // ========================================================
  // 2. GET PegaTempo
  // ========================================================
  pegaTempo: async (req, res) => {
    try {
      await garantirMinutoCarregado();
      const horaNegociacao = `14:${minutoSistemaGlobal.toString().padStart(2, '0')}`;
      return res.json({ horaNegociacao });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar o tempo.' });
    }
  },

  // ========================================================
  // 3. GET ListaAcoesInteresse
  // ========================================================
  listaAcoesInteresse: async (req, res) => {
    try {
      await garantirMinutoCarregado();
      const id_usuario = req.usuarioId;

      const [linhasFavoritas] = await db.execute('SELECT cod_acao FROM acoes_favoritadas WHERE user_id = ?', [id_usuario]);
      const minhasAcoes = linhasFavoritas.map(linha => linha.cod_acao);

      const precosFechamento = await MercadoService.obterPrecosFechamento();
      const precosMinuto = await MercadoService.obterPrecosMinuto(minutoSistemaGlobal);
      const mercadoCompleto = MercadoService.mapearPrecosComVariacao(precosMinuto, precosFechamento);

      const acoesResposta = mercadoCompleto.filter(m => minhasAcoes.includes(m.codigo));
      const horaNegociacao = `14:${minutoSistemaGlobal.toString().padStart(2, '0')}`;

      return res.json({ horaNegociacao, acoes: acoesResposta });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao listar ações de interesse.' });
    }
  },

  // ========================================================
  // 4. POST AdicionaAcaoInteresse
  // ========================================================
  adicionaAcaoInteresse: async (req, res) => {
    try {
      await garantirMinutoCarregado();
      const id_usuario = req.usuarioId;
      const { codigo } = req.body;

      if (!codigo) return res.status(400).json({ error: 'Código da ação é obrigatório.' });

      const codUpper = codigo.toUpperCase().trim();

      const [linhasFavoritas] = await db.execute('SELECT cod_acao FROM acoes_favoritadas WHERE user_id = ?', [id_usuario]);
      const jaFavoritada = linhasFavoritas.some(linha => linha.cod_acao === codUpper);

      if (jaFavoritada) {
        return res.status(400).json({ error: 'Ação já está na lista de interesse.' });
      }

      await db.execute('INSERT INTO acoes_favoritadas (user_id, cod_acao) VALUES (?, ?)', [id_usuario, codUpper]);

      return mercadoController.listaAcoesInteresse(req, res);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Ação já está na lista de interesse.' });
      }
      console.error(error);
      return res.status(500).json({ error: 'Erro ao adicionar ação de interesse.' });
    }
  },

  // ========================================================
  // 5. DELETE RemoveAcaoInteresse
  // ========================================================
  removeAcaoInteresse: async (req, res) => {
    try {
      await garantirMinutoCarregado();
      const id_usuario = req.usuarioId;
      const { codigo } = req.body;

      if (!codigo) return res.status(400).json({ error: 'Código da ação é obrigatório.' });

      const codUpper = codigo.toUpperCase().trim();

      const [linhasFavoritas] = await db.execute('SELECT cod_acao FROM acoes_favoritadas WHERE user_id = ?', [id_usuario]);
      const estaFavoritada = linhasFavoritas.some(linha => linha.cod_acao === codUpper);

      if (!estaFavoritada) {
        return res.status(400).json({ error: 'Ação não está na lista de interesse.' });
      }

      await db.execute('DELETE FROM acoes_favoritadas WHERE user_id = ? AND cod_acao = ?', [id_usuario, codUpper]);

      return mercadoController.listaAcoesInteresse(req, res);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao remover ação de interesse.' });
    }
  },

  listarAcoesDisponiveis: async (req, res) => {
    try {
      await garantirMinutoCarregado();
      const idUsuario = req.usuarioId;

      const [linhasFavoritas] = await db.execute('SELECT cod_acao FROM acoes_favoritadas WHERE user_id = ?', [idUsuario]);
      const minhasAcoes = linhasFavoritas.map(linha => linha.cod_acao);

      const todasAcoes = await MercadoService.obterPrecosFechamento();

      const acoesDisponiveis = todasAcoes
        .filter(acaoMercado => !minhasAcoes.includes(acaoMercado.ticker))
        .map(acaoMercado => ({
          codigo: acaoMercado.ticker,
          fechamento: acaoMercado.fechamento
        }));


      return res.status(200).json(acoesDisponiveis);


    } catch (error) {
      return res.status(500).json({ error: 'Erro ao tenta listar ações que não estão na lista inicial do usuário' });
    }
  },

  exibirAcao: async (req, res) => {
    try {
      await garantirMinutoCarregado();
      const { codigo } = req.params;

      if (!codigo) {
        return res.status(400).json({ error: "O código da ação é obrigatório" })
      }

      const codigoAcao = codigo.toUpperCase().trim();

      const precoMinuto = await MercadoService.obterPrecosMinuto(minutoSistemaGlobal);

      const acaoEncontrada = precoMinuto.find(c => c.ticker === codigoAcao);

      if (!acaoEncontrada) {
        return res.status(400).json({ error: `O código (ticker) ${codigoAcao} não foi encontrado` });
      }


      return res.status(200).json({ codigo: codigoAcao, preco_atual: acaoEncontrada.preco });


    } catch (error) {
      console.error('Erro ao exibir ação na modal:', error);
      return res.status(500).json({ error: 'Erro ao tentar exibir informações da ação' });
    }
  },


};

mercadoController.obterMinutosAtuais = async () => {
  return garantirMinutoCarregado();
};


mercadoController.resetMinutoSistema = async () => {
  minutoSistemaGlobal = 0;
  await TempoSistemaModel.salvarMinuto(minutoSistemaGlobal);
};

module.exports = mercadoController;