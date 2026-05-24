class SaldoInsuficienteError extends Error {
  constructor(message = 'Saldo insuficiente para concluir a compra.') {
    super(message);
    this.name = 'SaldoInsuficienteError';
  }
}

class QuantidadeInsuficienteError extends Error {
  constructor(message = 'Quantidade insuficiente de ações para a venda.') {
    super(message);
    this.name = 'QuantidadeInsuficienteError';
  }
}

module.exports = { SaldoInsuficienteError, QuantidadeInsuficienteError };
