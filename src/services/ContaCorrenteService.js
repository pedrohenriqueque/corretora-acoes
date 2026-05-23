const ContaCorrenteModel = require('../models/ContaCorrenteModel');
const ExtratoContaModel = require('../models/ExtratoContaModel');
const { SaldoInsuficienteError } = require('../errors/ordemErrors');

const ContaCorrenteService = {
  obterSaldoConta: async (idUsuario) => {
    if (!idUsuario) {
      throw new Error('ID do usuário é inválido ou não foi fornecido.');
    }

    return ContaCorrenteModel.buscarSaldoUsuario(idUsuario);
  },

  registrarRetirada: async (idUsuario, valor, historico, connection = null) => {
    if (!valor || valor <= 0) {
      throw new Error('Valor inválido ou não fornecido.');
    }

    const conta = await ContaCorrenteModel.buscarContaPorUsuario(idUsuario, connection);

    if (conta.saldo < valor) {
      throw new SaldoInsuficienteError();
    }

    await ContaCorrenteModel.debitar(conta.id_conta, valor, connection);
    await ExtratoContaModel.criarLancamento(
      conta.id_conta,
      'RETIRADA',
      valor,
      historico,
      connection
    );

    return conta.id_conta;
  },
};

module.exports = ContaCorrenteService;
