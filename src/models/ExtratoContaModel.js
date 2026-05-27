const db = require('../config/database');

const ExtratoContaModel = {
  criarLancamento: async (id_conta, tipo_transacao, valor, historico, data_hora, connection = null) => {
    const executor = connection || db;
    const query =
      'INSERT INTO extrato_conta (id_conta, tipo_transacao, valor, historico, data_hora) VALUES (?, ?, ?, ?, ?)';
    const [result] = await executor.execute(query, [id_conta, tipo_transacao, valor, historico, data_hora]);
    return result.insertId;
  },

  listarLancamentosPorConta: async (id_conta) => {
    const query = 'SELECT * FROM extrato_conta WHERE id_conta = ? ORDER BY id_extrato ASC';
    const [rows] = await db.execute(query, [id_conta]);
    return rows;
  },
};

module.exports = ExtratoContaModel;
