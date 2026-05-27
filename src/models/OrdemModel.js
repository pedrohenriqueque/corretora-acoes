const db = require('../config/database');

const OrdemModel = {
  criarOrdem: async (
    id_usuario,
    cod_acao,
    preco_ordem,
    preco_execucao,
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
      'INSERT INTO ordens (id_usuario, cod_acao, preco_ordem, preco_execucao, tipo_transacao, tipo_ordem, quantidade, status, hora_lancamento, hora_execucao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await executor.execute(query, [
      id_usuario,
      cod_acao,
      preco_ordem,
      preco_execucao,
      tipo_transacao,
      tipo_ordem,
      quantidade,
      status,
      hora_lancamento,
      hora_execucao,
    ]);
    return result.insertId;
  },

  atualizarStatusOrdem: async (
    id_ordem,
    status,
    hora_execucao,
    preco_execucao = null,
    connection = null
  ) => {
    const executor = connection || db;
    if (!hora_execucao) {
      throw new Error('hora_execucao é obrigatória para atualizar status da ordem.');
    }

    const campos = ['status = ?', 'hora_execucao = ?'];
    const valores = [status, hora_execucao];

    if (preco_execucao !== null && preco_execucao !== undefined) {
      campos.push('preco_execucao = ?');
      valores.push(preco_execucao);
    }

    valores.push(id_ordem);

    const query = `UPDATE ordens SET ${campos.join(', ')} WHERE id_ordem = ?`;
    await executor.execute(query, valores);
  
    return true;
  },

  buscarOrdensPorStatus: async (status) => {
    const query = 'SELECT * FROM ordens WHERE status = ?';
    const [rows] = await db.execute(query, [status]);
    return rows;
  },

  buscarOrdensPorUsuario: async (id_usuario) => {
    const query = 'SELECT * FROM ordens WHERE id_usuario = ? ORDER BY id_ordem DESC';
    const [rows] = await db.execute(query, [id_usuario]);
    return rows;
  },

  buscarOrdemPendenteUsuario: async (id_ordem, id_usuario) => {
    const query = 'SELECT * FROM ordens WHERE id_ordem = ? AND id_usuario = ? AND status = ?';
    const [rows] = await db.execute(query, [id_ordem, id_usuario, 'PENDENTE']);
    return rows[0] || null;
  },
};

module.exports = OrdemModel;
