const db = require('../config/database');

const ExtratoContaModel = {
  criarLancamento: async (id_conta, tipo_transacao, valor, historico, connection = null) => {
    const executor = connection || db;
    const query =
      'INSERT INTO extrato_conta (id_conta, tipo_transacao, valor, historico) VALUES (?, ?, ?, ?)';
    const [result] = await executor.execute(query, [id_conta, tipo_transacao, valor, historico]);
    return result.insertId;
  },
};

module.exports = ExtratoContaModel;
