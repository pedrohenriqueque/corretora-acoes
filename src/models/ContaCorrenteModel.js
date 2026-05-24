const db = require('../config/database');

const ContaCorrenteModel = {
  criarConta: async (id_usuario, saldo, connection = null) => {
    const executor = connection || db;
    const query = 'INSERT INTO conta_corrente (id_usuario, saldo) VALUES (?, ?)';
    const [result] = await executor.execute(query, [id_usuario, saldo]);
    return result.insertId;
  },

  buscarContaPorUsuario: async (id_usuario, connection = null) => {
    const executor = connection || db;
    const query = 'SELECT id_conta, saldo FROM conta_corrente WHERE id_usuario = ?';
    const [rows] = await executor.execute(query, [id_usuario]);

    if (!rows[0]) {
      throw new Error('Conta corrente não encontrada para o usuário.');
    }

    return {
      id_conta: rows[0].id_conta,
      saldo: Number(rows[0].saldo),
    };
  },

  buscarSaldoUsuario: async (id_usuario) => {
    const conta = await ContaCorrenteModel.buscarContaPorUsuario(id_usuario);
    return conta.saldo;
  },

  debitar: async (id_conta, valor, connection = null) => {
    const executor = connection || db;
    const query = 'UPDATE conta_corrente SET saldo = saldo - ? WHERE id_conta = ?';
    await executor.execute(query, [valor, id_conta]);
  },

  creditar: async (id_conta, valor, connection = null) => {
    const executor = connection || db;
    const query = 'UPDATE conta_corrente SET saldo = saldo + ? WHERE id_conta = ?';
    await executor.execute(query, [valor, id_conta]);
  },

  alterar: async (valor, id_usuario) => {
    const query = 'UPDATE conta_corrente SET saldo = ? WHERE id_usuario = ?';
    await db.execute(query, [valor, id_usuario]);
    return true;
  },
};

module.exports = ContaCorrenteModel;
