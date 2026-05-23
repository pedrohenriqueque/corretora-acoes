const db = require('../config/database');

const CarteiraAcaoModel = {
  buscarPosicao: async (id_carteira, cod_acao, connection = null) => {
    const executor = connection || db;
    const query =
      'SELECT quantidade, preco_medio FROM carteira_acao WHERE id_carteira = ? AND cod_acao = ?';
    const [rows] = await executor.execute(query, [id_carteira, cod_acao]);
    return rows[0];
  },

  inserirPosicao: async (id_carteira, cod_acao, quantidade, preco_medio, connection = null) => {
    const executor = connection || db;
    const query =
      'INSERT INTO carteira_acao (id_carteira, cod_acao, quantidade, preco_medio) VALUES (?, ?, ?, ?)';
    await executor.execute(query, [id_carteira, cod_acao, quantidade, preco_medio]);
  },

  atualizarPosicao: async (
    id_carteira,
    cod_acao,
    quantidade,
    preco_medio,
    connection = null
  ) => {
    const executor = connection || db;
    const query =
      'UPDATE carteira_acao SET quantidade = ?, preco_medio = ? WHERE id_carteira = ? AND cod_acao = ?';
    await executor.execute(query, [quantidade, preco_medio, id_carteira, cod_acao]);
  },
};

module.exports = CarteiraAcaoModel;
