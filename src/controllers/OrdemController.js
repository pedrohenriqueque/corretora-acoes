const OrdemService = require('../services/OrdemService');
const MercadoController = require('./MercadoController');
const MercadoService = require('../services/MercadoService');
const AcaoModel = require('../models/AcaoModel');
const { SaldoInsuficienteError } = require('../errors/ordemErrors');
const {
  normalizarCodigo,
  validarQuantidade,
  validarPrecoOrdem,
  validarTipoOrdem,
} = require('../utils/ordemValidators');

const OrdemController = {
  comprarAcao: async (req, res) => {
    try {
      if (!req.body) {
        return res.status(400).json({ error: 'O corpo da requisição (body) não foi enviado.' });
      }

      const idUsuario = req.usuarioId;
      const { codigo, quantidade, tipoOrdem, precoOrdem } = req.body;

      if (!codigo || quantidade === undefined || quantidade === null || !tipoOrdem) {
        return res.status(400).json({
          error: 'Código da ação, quantidade e tipo de ordem são obrigatórios.',
        });
      }

      const validacaoQtd = validarQuantidade(quantidade);
      if (!validacaoQtd.valido) {
        return res.status(400).json({ error: validacaoQtd.erro });
      }

      const validacaoTipo = validarTipoOrdem(tipoOrdem);
      if (!validacaoTipo.valido) {
        return res.status(400).json({ error: validacaoTipo.erro });
      }

      const codigoAcao = normalizarCodigo(codigo);
      let precoFinal = precoOrdem;
      const minutosAtuais = MercadoController.obterMinutosAtuais();

      const acaoCadastrada = await AcaoModel.existePorCodigo(codigoAcao);
      if (!acaoCadastrada) {
        return res.status(404).json({ error: 'Ação não cadastrada no sistema.' });
      }

      const precoAtualMercado = await MercadoService.retornarPrecoAtualAcao(
        codigoAcao,
        minutosAtuais
      );

      if (precoAtualMercado === null || precoAtualMercado === undefined) {
        return res.status(404).json({
          error: 'Ação não encontrada para o minuto atual do sistema.',
        });
      }

      if (tipoOrdem === 'MERCADO') {
        precoFinal = precoAtualMercado;
      } else {
        const validacaoPreco = validarPrecoOrdem(precoOrdem);
        if (!validacaoPreco.valido) {
          return res.status(400).json({ error: validacaoPreco.erro });
        }
        precoFinal = validacaoPreco.valor;
      }

      const resultado = await OrdemService.processarSolicitacaoCompra(
        idUsuario,
        codigoAcao,
        validacaoQtd.valor,
        tipoOrdem,
        precoFinal,
        precoAtualMercado
      );

      return res.status(201).json(resultado);
    } catch (error) {
      console.error(error);

      if (error instanceof SaldoInsuficienteError) {
        return res.status(400).json({ error: error.message });
      }

      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(404).json({ error: 'Ação não cadastrada no sistema.' });
      }

      if (
        error.message &&
        (error.message.includes('maior que zero') ||
          error.message.includes('inválido') ||
          error.message.includes('obrigatórios'))
      ) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(500).json({ error: 'Erro interno ao tentar criar uma ordem de compra.' });
    }
  },
};

module.exports = OrdemController;
