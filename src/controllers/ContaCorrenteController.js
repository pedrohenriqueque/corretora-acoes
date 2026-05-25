const ContaCorrenteService = require('../services/ContaCorrenteService');
const MercadoController = require('./MercadoController');
const { SaldoInsuficienteError } = require('../errors/ordemErrors');

const ContaCorrenteController = {
  listarExtrato: async (req, res) => {
    try {
      const idUsuario = req.usuarioId;
      const extrato = await ContaCorrenteService.listarExtratoConta(idUsuario);
      return res.status(200).json(extrato);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno ao listar extrato da conta corrente.' });
    }
  },

  registrarDeposito: async (req, res) => {
    try {
      if (!req.body) {
        return res.status(400).json({ error: 'O corpo da requisição (body) não foi enviado.' });
      }

      const idUsuario = req.usuarioId;
      const { descricao, valor } = req.body;

      if (!descricao || descricao.trim().length === 0) {
        return res.status(400).json({ error: 'Descrição é obrigatória.' });
      }

      const valorNumerico = Number(valor);
      if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
        return res.status(400).json({ error: 'Valor inválido ou não fornecido.' });
      }

      const minutosAtuais = MercadoController.obterMinutosAtuais();
      const horaSistema = `14:${minutosAtuais.toString().padStart(2, '0')}`;

      await ContaCorrenteService.registrarDeposito(
        idUsuario,
        valorNumerico,
        descricao.trim(),
        horaSistema,
        null,
        { prefixarHistorico: false }
      );

      const saldoAtual = await ContaCorrenteService.obterSaldoConta(idUsuario);

      return res.status(201).json({
        data_hora: horaSistema,
        descricao: descricao.trim(),
        tipo: 'deposito',
        valor: valorNumerico,
        saldo_resultante: saldoAtual,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno ao registrar depósito.' });
    }
  },

  registrarRetirada: async (req, res) => {
    try {
      if (!req.body) {
        return res.status(400).json({ error: 'O corpo da requisição (body) não foi enviado.' });
      }

      const idUsuario = req.usuarioId;
      const { descricao, valor } = req.body;

      if (!descricao || descricao.trim().length === 0) {
        return res.status(400).json({ error: 'Descrição é obrigatória.' });
      }

      const valorNumerico = Number(valor);
      if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
        return res.status(400).json({ error: 'Valor inválido ou não fornecido.' });
      }

      const minutosAtuais = MercadoController.obterMinutosAtuais();
      const horaSistema = `14:${minutosAtuais.toString().padStart(2, '0')}`;

      await ContaCorrenteService.registrarRetirada(
        idUsuario,
        valorNumerico,
        descricao.trim(),
        horaSistema,
        null,
        { prefixarHistorico: false }
      );

      const saldoAtual = await ContaCorrenteService.obterSaldoConta(idUsuario);

      return res.status(201).json({
        data_hora: horaSistema,
        descricao: descricao.trim(),
        tipo: 'retirada',
        valor: valorNumerico,
        saldo_resultante: saldoAtual,
      });
    } catch (error) {
      console.error(error);

      if (error instanceof SaldoInsuficienteError) {
        return res.status(400).json({ error: error.message });
      }

      if (error.message && error.message.includes('Valor inválido')) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(500).json({ error: 'Erro interno ao registrar retirada.' });
    }
  },
};

module.exports = ContaCorrenteController;
