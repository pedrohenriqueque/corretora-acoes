const db = require('../config/database');

const OrdemModel = {
  criarOrdem: async (
    id_usuario,
    cod_acao,
    preco_ordem,
    tipo_transacao,
    tipo_ordem,
    quantidade,
    status,
    connection = null
  ) => {
    const executor = connection || db;
    const query =
      'INSERT INTO ordens (id_usuario, cod_acao, preco_ordem, tipo_transacao, tipo_ordem, quantidade, status) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const [result] = await executor.execute(query, [
      id_usuario,
      cod_acao,
      preco_ordem,
      tipo_transacao,
      tipo_ordem,
      quantidade,
      status,
    ]);
    return result.insertId;
  },

  atualizarStatusOrdem: async (id_ordem, status, connection = null) => {
    const executor = connection || db;
    const query = 'UPDATE ordens SET status = ? WHERE id_ordem = ?';
    await executor.execute(query, [status, id_ordem]);
    return true;
  },

  buscarOrdensPorStatus: async (status) => {
    const query = 'SELECT * FROM ordens WHERE status = ?';
    const [rows] = await db.execute(query, [status]);
    return rows;
  },
};

module.exports = OrdemModel;
