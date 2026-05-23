const db = require('../config/database');
const OrdemModel = require('../models/OrdemModel');
const ContaCorrenteService = require('./ContaCorrenteService');
const CarteiraService = require('./CarteiraService');
const { SaldoInsuficienteError } = require('../errors/ordemErrors');
const { normalizarCodigo } = require('../utils/ordemValidators');

const OrdemService = {
  executarCompra: async ({
    idUsuario,
    codAcao,
    quantidade,
    precoExecucao,
    tipoOrdem,
    idOrdemExistente = null,
  }) => {
    const codigo = normalizarCodigo(codAcao);
    const preco = Number(precoExecucao);
    const qtd = Number(quantidade);
    const valorTotal = Number((preco * qtd).toFixed(2));
    const historico = `Compra de ${qtd} ${codigo} a R$ ${preco.toFixed(2)}`;

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      let idOrdem = idOrdemExistente;

      if (!idOrdem) {
        idOrdem = await OrdemModel.criarOrdem(
          idUsuario,
          codigo,
          preco,
          'COMPRA',
          tipoOrdem,
          qtd,
          'EXECUTADA',
          connection
        );
      } else {
        await OrdemModel.atualizarStatusOrdem(idOrdem, 'EXECUTADA', connection);
      }

      await ContaCorrenteService.registrarRetirada(idUsuario, valorTotal, historico, connection);
      await CarteiraService.adicionarAcaoComprada(
        idUsuario,
        codigo,
        qtd,
        preco,
        connection
      );

      await connection.commit();

      return {
        id_ordem: idOrdem,
        id_usuario: idUsuario,
        cod_acao: codigo,
        preco_execucao: preco,
        valor_total: valorTotal,
        quantidade: qtd,
        tipo_ordem: tipoOrdem,
        status: 'EXECUTADA',
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  processarSolicitacaoCompra: async (
    idUsuario,
    codigo,
    quantidade,
    tipoOrdem,
    precoOrdem,
    precoAtualMercado = null
  ) => {
    const codAcao = normalizarCodigo(codigo);

    if (tipoOrdem === 'MERCADO') {
      return OrdemService.executarCompra({
        idUsuario,
        codAcao,
        quantidade,
        precoExecucao: precoOrdem,
        tipoOrdem,
      });
    }

    if (tipoOrdem === 'PROGRAMADA') {
      const precoAtual = Number(precoAtualMercado);

      if (Number.isFinite(precoAtual) && precoOrdem >= precoAtual) {
        return OrdemService.executarCompra({
          idUsuario,
          codAcao,
          quantidade,
          precoExecucao: precoAtual,
          tipoOrdem,
        });
      }

      const idOrdem = await OrdemModel.criarOrdem(
        idUsuario,
        codAcao,
        precoOrdem,
        'COMPRA',
        tipoOrdem,
        quantidade,
        'PENDENTE'
      );

      return {
        id_ordem: idOrdem,
        id_usuario: idUsuario,
        cod_acao: codAcao,
        preco_ordem: precoOrdem,
        quantidade,
        tipo_ordem: tipoOrdem,
        status: 'PENDENTE',
      };
    }

    throw new Error('Tipo de ordem inválido. Use MERCADO ou PROGRAMADA.');
  },

  processarOrdensPendentes: async (precosMinuto) => {
    const ordens = await OrdemModel.buscarOrdensPorStatus('PENDENTE');

    for (const ordem of ordens) {
      try {
        const acao = precosMinuto.find((c) => c.ticker === ordem.cod_acao);
        if (!acao) continue;

        if (acao.preco > ordem.preco_ordem) continue;

        await OrdemService.executarCompra({
          idUsuario: ordem.id_usuario,
          codAcao: ordem.cod_acao,
          quantidade: ordem.quantidade,
          precoExecucao: acao.preco,
          tipoOrdem: ordem.tipo_ordem,
          idOrdemExistente: ordem.id_ordem,
        });
      } catch (error) {
        if (error instanceof SaldoInsuficienteError) {
          await OrdemModel.atualizarStatusOrdem(ordem.id_ordem, 'CANCELADA');
          continue;
        }

        console.error(`Erro ao processar ordem ${ordem.id_ordem}:`, error);
      }
    }
  },
};

module.exports = OrdemService;
