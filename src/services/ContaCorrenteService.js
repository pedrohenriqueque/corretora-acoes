const ContaCorrenteModel = require('../models/ContaCorrenteModel');
const ExtratoContaModel = require('../models/ExtratoContaModel');
const { SaldoInsuficienteError } = require('../errors/ordemErrors');

const isConnection = (value) => value && typeof value.execute === 'function';

const prefixarHistoricoComHora = (historico, horaSistema) => {
  if (!horaSistema) {
    return historico;
  }

  return `${horaSistema} - ${historico}`;
};

const normalizarHistorico = (historico, horaSistema, prefixarHistorico = true) => {
  if (!prefixarHistorico) {
    return historico;
  }

  return prefixarHistoricoComHora(historico, horaSistema);
};

const ContaCorrenteService = {
  obterSaldoConta: async (idUsuario) => {
    if (!idUsuario) {
      throw new Error('ID do usuário é inválido ou não foi fornecido.');
    }

    return ContaCorrenteModel.buscarSaldoUsuario(idUsuario);
  },

  registrarRetirada: async (
    idUsuario,
    valor,
    historico,
    horaSistema = null,
    connection = null,
    opcoes = {}
  ) => {
    if (isConnection(horaSistema)) {
      connection = horaSistema;
      horaSistema = null;
    }

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
      normalizarHistorico(historico, horaSistema, opcoes.prefixarHistorico !== false),
      horaSistema,
      connection
    );

    return conta.id_conta;
  },

  registrarDeposito: async (
    idUsuario,
    valor,
    historico,
    horaSistema = null,
    connection = null,
    opcoes = {}
  ) => {
    if (isConnection(horaSistema)) {
      connection = horaSistema;
      horaSistema = null;
    }

    if (!valor || valor <= 0) {
      throw new Error('Valor inválido ou não fornecido.');
    }

    const conta = await ContaCorrenteModel.buscarContaPorUsuario(idUsuario, connection);

    await ContaCorrenteModel.creditar(conta.id_conta, valor, connection);
    await ExtratoContaModel.criarLancamento(
      conta.id_conta,
      'DEPOSITO',
      valor,
      normalizarHistorico(historico, horaSistema, opcoes.prefixarHistorico !== false),
      horaSistema,
      connection
    );

    return conta.id_conta;
  },

  listarExtratoConta: async (idUsuario) => {
    if (!idUsuario) {
      throw new Error('ID do usuário é inválido ou não foi fornecido.');
    }

    const conta = await ContaCorrenteModel.buscarContaPorUsuario(idUsuario);
    const lancamentos = await ExtratoContaModel.listarLancamentosPorConta(conta.id_conta);

    if (!lancamentos.length) {
      return [];
    }

    const totalDelta = lancamentos.reduce((acc, lancamento) => {
      const valor = Number(lancamento.valor);
      if (lancamento.tipo_transacao === 'DEPOSITO') {
        return acc + valor;
      }
      if (lancamento.tipo_transacao === 'RETIRADA') {
        return acc - valor;
      }
      return acc;
    }, 0);

    let saldoCorrente = Number((conta.saldo - totalDelta).toFixed(2));

    return lancamentos.map((lancamento) => {
      const valor = Number(lancamento.valor);
      if (lancamento.tipo_transacao === 'DEPOSITO') {
        saldoCorrente = Number((saldoCorrente + valor).toFixed(2));
      } else if (lancamento.tipo_transacao === 'RETIRADA') {
        saldoCorrente = Number((saldoCorrente - valor).toFixed(2));
      }

      const idLancamento =
        lancamento.id_extrato ??
        lancamento.id ??
        lancamento.id_lancamento ??
        null;

      return {
        id: idLancamento,
        data_hora: lancamento.data_hora,
        descricao: lancamento.historico,
        tipo: lancamento.tipo_transacao.toLowerCase(),
        valor,
        saldo_resultante: saldoCorrente,
      };
    });
  },
};

module.exports = ContaCorrenteService;
