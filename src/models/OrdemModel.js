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
    hora_lancamento,
    hora_execucao,
    connection = null
  ) => {
    const executor = connection || db;
    const query =
      'INSERT INTO ordens (id_usuario, cod_acao, preco_ordem, tipo_transacao, tipo_ordem, quantidade, status, hora_lancamento, hora_execucao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await executor.execute(query, [
      id_usuario,
      cod_acao,
      preco_ordem,
      tipo_transacao,
      tipo_ordem,
      quantidade,
      status,
      hora_lancamento,
      hora_execucao,
    ]);
    return result.insertId;
  },

  atualizarStatusOrdem: async (id_ordem, status, hora_execucao, connection = null) => {
    const executor = connection || db;
    if (!hora_execucao) {
      throw new Error('hora_execucao é obrigatória para atualizar status da ordem.');
    }

    const query = 'UPDATE ordens SET status = ?, hora_execucao = ? WHERE id_ordem = ?';
    await executor.execute(query, [status, hora_execucao, id_ordem]);
  
    return true;
  },

  buscarOrdensPorStatus: async (status) => {
    const query = 'SELECT * FROM ordens WHERE status = ?';
    const [rows] = await db.execute(query, [status]);
    return rows;
  },
};

module.exports = OrdemModel;
