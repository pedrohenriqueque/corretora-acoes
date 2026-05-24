const CarteiraModel = require('../models/CarteiraModel');
const CarteiraAcaoModel = require('../models/CarteiraAcaoModel');
const MercadoService = require('./MercadoService');
const { calcularPrecoMedio } = require('../utils/ordemValidators');

const CarteiraService = {
  obterCarteiraComPrecos: async (id_usuario, minutoSistema) => {
    const id_carteira = await CarteiraModel.buscarIdPorUsuario(id_usuario);
    const posicoes = await CarteiraAcaoModel.listarPosicoes(id_carteira);

    if (!posicoes.length) {
      return { acoes: [], ganhos_perdas_total: 0 };
    }

    const precosFechamento = await MercadoService.obterPrecosFechamento();
    const precosMinuto = await MercadoService.obterPrecosMinuto(minutoSistema);
    const mercadoCompleto = MercadoService.mapearPrecosComVariacao(precosMinuto, precosFechamento);
    const mapaPrecos = new Map(mercadoCompleto.map((acao) => [acao.codigo, acao]));

    let ganhosPerdasTotal = 0;
    const acoes = [];

    for (const posicao of posicoes) {
      const dadosMercado = mapaPrecos.get(posicao.cod_acao);
      if (!dadosMercado) continue;

      const ganhoPerda = Number(
        (posicao.quantidade * (dadosMercado.preco - posicao.preco_medio)).toFixed(2)
      );
      ganhosPerdasTotal += ganhoPerda;

      acoes.push({
        codigo: posicao.cod_acao,
        quantidade: posicao.quantidade,
        preco_medio: posicao.preco_medio,
        preco: dadosMercado.preco,
        variacao_nominal: dadosMercado.variacao_nominal,
        variacao_percentual: dadosMercado.variacao_percentual,
        ganho_perda: ganhoPerda,
      });
    }

    return {
      acoes,
      ganhos_perdas_total: Number(ganhosPerdasTotal.toFixed(2)),
    };
  },

  adicionarAcaoComprada: async (
    id_usuario,
    cod_acao,
    quantidade,
    preco_execucao,
    connection = null
  ) => {
    const id_carteira = await CarteiraModel.buscarIdPorUsuario(id_usuario, connection);
    const posicao = await CarteiraAcaoModel.buscarPosicao(id_carteira, cod_acao, connection);

    if (!posicao) {
      await CarteiraAcaoModel.inserirPosicao(
        id_carteira,
        cod_acao,
        quantidade,
        preco_execucao,
        connection
      );
      return;
    }

    const quantidadeFinal = Number(posicao.quantidade) + Number(quantidade);
    const precoMedioFinal = calcularPrecoMedio(
      Number(posicao.quantidade),
      Number(posicao.preco_medio),
      Number(quantidade),
      Number(preco_execucao)
    );

    await CarteiraAcaoModel.atualizarPosicao(
      id_carteira,
      cod_acao,
      quantidadeFinal,
      precoMedioFinal,
      connection
    );
  },

  removerAcaoVendida: async (
    id_usuario,
    cod_acao,
    quantidade,
    connection = null
  ) => {
    const id_carteira = await CarteiraModel.buscarIdPorUsuario(id_usuario, connection);
    const posicao = await CarteiraAcaoModel.buscarPosicao(id_carteira, cod_acao, connection);

    if (!posicao || Number(posicao.quantidade) < Number(quantidade)) {
      throw new Error('Quantidade insuficiente para venda.');
    }

    const quantidadeFinal = Number(posicao.quantidade) - Number(quantidade);

    // O preço médio de aquisição das cotas restantes não se altera na venda
    await CarteiraAcaoModel.atualizarPosicao(
      id_carteira,
      cod_acao,
      quantidadeFinal,
      Number(posicao.preco_medio),
      connection
    );
  },
};

module.exports = CarteiraService;
