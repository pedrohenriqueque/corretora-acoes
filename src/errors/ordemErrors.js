class SaldoInsuficienteError extends Error {
  constructor(message = 'Saldo insuficiente para concluir a compra.') {
    super(message);
    this.name = 'SaldoInsuficienteError';
  }
}

module.exports = { SaldoInsuficienteError };
