// src/controllers/mercadoController.js
const db = require('../config/database.js');
const UsuarioModel = require('../models/UsuarioModel.js');
const OrdemService = require('../services/OrdemService.js');
const MercadoService = require('../services/MercadoService.js'); // Importa o service

// O estado do tempo global continua aqui na memória do Node.js
let minutoSistemaGlobal = 0; 

const mercadoController = {

  // ========================================================
  // 1. POST AvancaTempo
  // ========================================================
  avancaTempo: async (req, res) => {
    try {
      const inc = parseInt(
        req.body.incrementoMinutos !== undefined ? req.body.incrementoMinutos : 1,
        10
      );
      if (isNaN(inc) || inc <= 0) {
        return res.status(400).json({ error: 'O incremento de minutos é inválido.' });
      }

      // Usa o service para buscar o fechamento
      const precosFechamento = await MercadoService.obterPrecosFechamento();
      let dadosMercadoFinais = [];

      for (let i = 1; i <= inc; i++) {
        if (minutoSistemaGlobal >= 59) {
          minutoSistemaGlobal = 59;
          break;
        }

        minutoSistemaGlobal += 1;

        try {
          // Coleta os preços e faz o mapeamento usando o Service
          const precosMinuto = await MercadoService.obterPrecosMinuto(minutoSistemaGlobal);


          const dadosMercado = MercadoService.mapearPrecosComVariacao(precosMinuto, precosFechamento);

          if (i === inc || minutoSistemaGlobal === 59) {
            dadosMercadoFinais = dadosMercado;
          }

          await OrdemService.processarOrdensPendentes(precosMinuto);
          

        } catch (error) {
          console.error(`Erro ao processar preços no minuto ${minutoSistemaGlobal}:`, error);
          if (i === inc) dadosMercadoFinais = [];
        }
      }

      const novaHoraNegociacao = `14:${minutoSistemaGlobal.toString().padStart(2, '0')}`;
      return res.json({ novaHoraNegociacao, acoes: dadosMercadoFinais });

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
      const id_usuario = req.usuarioId;
      const { codigo } = req.body;

      if (!codigo) return res.status(400).json({ error: 'Código da ação é obrigatório.' });

      await db.execute('INSERT INTO acoes_favoritadas (user_id, cod_acao) VALUES (?, ?)', [id_usuario, codigo.toUpperCase().trim()]);

      return mercadoController.listaAcoesInteresse(req, res);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return mercadoController.listaAcoesInteresse(req, res);
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
      const id_usuario = req.usuarioId;
      const { codigo } = req.body;

      if (!codigo) return res.status(400).json({ error: 'Código da ação é obrigatório.' });

      await db.execute('DELETE FROM acoes_favoritadas WHERE user_id = ? AND cod_acao = ?', [id_usuario, codigo.toUpperCase().trim()]);

      return mercadoController.listaAcoesInteresse(req, res);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao remover ação de interesse.' });
    }
  },

  listarAcoesDisponiveis: async (req, res) => {
    try{
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


    }catch(error){
       return res.status(500).json({error: 'Erro ao tenta listar ações que não estão na lista inicial do usuário' });
    }
  },

  exibirAcao: async(req, res) =>{
    try{
      const {codigo} = req.params;

      if(!codigo){
        return res.status(400).json({error: "O código da ação é obrigatório"})
      }

      const codigoAcao = codigo.toUpperCase().trim();
      
      const precoMinuto = await MercadoService.obterPrecosMinuto(minutoSistemaGlobal);

      const acaoEncontrada = precoMinuto.find(c => c.ticker === codigoAcao);

      if(!acaoEncontrada){
        return res.status(400).json({error: `O código (ticker) ${codigoAcao} não foi encontrado`});
      }


      return res.status(200).json({codigo: codigoAcao, preco_atual: acaoEncontrada.preco});
      

    }catch(error){
      console.error('Erro ao exibir ação na modal:', error);
      return res.status(500).json({error: 'Erro ao tentar exibir informações da ação'});
    }
  },

  
};

mercadoController.obterMinutosAtuais = () => {
  return minutoSistemaGlobal;
};


mercadoController.resetMinutoSistema = () => {
  minutoSistemaGlobal = 0;
};

module.exports = mercadoController;