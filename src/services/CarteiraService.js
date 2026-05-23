const CarteiraModel = require('../models/CarteiraModel');
const CarteiraAcaoModel = require('../models/CarteiraAcaoModel');
const { calcularPrecoMedio } = require('../utils/ordemValidators');

const CarteiraService = {
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
};

module.exports = CarteiraService;
