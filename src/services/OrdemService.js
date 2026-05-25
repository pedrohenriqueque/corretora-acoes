const db = require('../config/database');
const OrdemModel = require('../models/OrdemModel');
const ContaCorrenteService = require('./ContaCorrenteService');
const CarteiraService = require('./CarteiraService');
const { SaldoInsuficienteError, QuantidadeInsuficienteError } = require('../errors/ordemErrors');
const { normalizarCodigo } = require('../utils/ordemValidators');
const CarteiraModel = require('../models/CarteiraModel');
const CarteiraAcaoModel = require('../models/CarteiraAcaoModel');

const OrdemService = {
  executarCompra: async ({
    idUsuario,
    codAcao,
    quantidade,
    precoExecucao,
    tipoOrdem,
    idOrdemExistente = null,
    horaLancamento,
    horaExecucao,
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
          horaLancamento,
          horaExecucao,
          connection
        );
      } else {
        await OrdemModel.atualizarStatusOrdem(idOrdem, 'EXECUTADA', horaExecucao, connection);
      }

      await ContaCorrenteService.registrarRetirada(
        idUsuario,
        valorTotal,
        historico,
        horaExecucao,
        connection
      );
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
        hora_lancamento: horaLancamento,
        hora_execucao: horaExecucao,
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
    precoAtualMercado = null,
    horaSistema
  ) => {
    const codAcao = normalizarCodigo(codigo);

    if (tipoOrdem === 'MERCADO') {
      return OrdemService.executarCompra({
        idUsuario,
        codAcao,
        quantidade,
        precoExecucao: precoOrdem,
        tipoOrdem,
        horaLancamento: horaSistema,
        horaExecucao: horaSistema,
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
          horaLancamento: horaSistema,
          horaExecucao: horaSistema,
        });
      }

      const idOrdem = await OrdemModel.criarOrdem(
        idUsuario,
        codAcao,
        precoOrdem,
        'COMPRA',
        tipoOrdem,
        quantidade,
        'PENDENTE',
        horaSistema,
        null
      );

      return {
        id_ordem: idOrdem,
        id_usuario: idUsuario,
        cod_acao: codAcao,
        preco_ordem: precoOrdem,
        quantidade,
        tipo_ordem: tipoOrdem,
        status: 'PENDENTE',
        hora_lancamento: horaSistema,
        hora_execucao: null,
      };
    }

    throw new Error('Tipo de ordem inválido. Use MERCADO ou PROGRAMADA.');
  },

  executarVenda: async ({
    idUsuario,
    codAcao,
    quantidade,
    precoExecucao,
    tipoOrdem,
    idOrdemExistente = null,
    horaLancamento,
    horaExecucao,
  }) => {
    const codigo = normalizarCodigo(codAcao);
    const preco = Number(precoExecucao);
    const qtd = Number(quantidade);
    const valorTotal = Number((preco * qtd).toFixed(2));
    const historico = `Venda de ${qtd} ${codigo} a R$ ${preco.toFixed(2)}`;

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      let idOrdem = idOrdemExistente;

      if (!idOrdem) {
        idOrdem = await OrdemModel.criarOrdem(
          idUsuario,
          codigo,
          preco,
          'VENDA',
          tipoOrdem,
          qtd,
          'EXECUTADA',
          horaLancamento,
          horaExecucao,
          connection
        );
      } else {
        await OrdemModel.atualizarStatusOrdem(idOrdem, 'EXECUTADA', horaExecucao, connection);
      }

      await ContaCorrenteService.registrarDeposito(
        idUsuario,
        valorTotal,
        historico,
        horaExecucao,
        connection
      );
      await CarteiraService.removerAcaoVendida(
        idUsuario,
        codigo,
        qtd,
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
        hora_lancamento: horaLancamento,
        hora_execucao: horaExecucao,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  processarSolicitacaoVenda: async (
    idUsuario,
    codigo,
    quantidade,
    tipoOrdem,
    precoOrdem,
    precoAtualMercado = null,
    horaSistema
  ) => {
    const codAcao = normalizarCodigo(codigo);

    // Primeiro, verifica se o usuário possui a ação e a quantidade necessária antes de criar qualquer ordem
    const idCarteira = await CarteiraModel.buscarIdPorUsuario(idUsuario);
    const posicao = await CarteiraAcaoModel.buscarPosicao(idCarteira, codAcao);

    if (!posicao || Number(posicao.quantidade) < Number(quantidade)) {
      throw new QuantidadeInsuficienteError();
    }

    if (tipoOrdem === 'MERCADO') {
      return OrdemService.executarVenda({
        idUsuario,
        codAcao,
        quantidade,
        precoExecucao: precoOrdem,
        tipoOrdem,
        horaLancamento: horaSistema,
        horaExecucao: horaSistema,
      });
    }

    if (tipoOrdem === 'PROGRAMADA') {
      const precoAtual = Number(precoAtualMercado);

      // Na venda programada, executa na hora se o preço atual do mercado for maior ou igual ao preço solicitado pelo usuário
      if (Number.isFinite(precoAtual) && precoAtual >= precoOrdem) {
        return OrdemService.executarVenda({
          idUsuario,
          codAcao,
          quantidade,
          precoExecucao: precoAtual,
          tipoOrdem,
          horaLancamento: horaSistema,
          horaExecucao: horaSistema,
        });
      }

      // Senão, registra a ordem como PENDENTE
      const idOrdem = await OrdemModel.criarOrdem(
        idUsuario,
        codAcao,
        precoOrdem,
        'VENDA',
        tipoOrdem,
        quantidade,
        'PENDENTE',
        horaSistema,
        null
      );

      return {
        id_ordem: idOrdem,
        id_usuario: idUsuario,
        cod_acao: codAcao,
        preco_ordem: precoOrdem,
        quantidade,
        tipo_ordem: tipoOrdem,
        status: 'PENDENTE',
        hora_lancamento: horaSistema,
        hora_execucao: null,
      };
    }

    throw new Error('Tipo de ordem inválido. Use MERCADO ou PROGRAMADA.');
  },

  processarOrdensPendentes: async (precosMinuto, horaExecucao) => {
    const ordens = await OrdemModel.buscarOrdensPorStatus('PENDENTE');

    for (const ordem of ordens) {
      try {
        const acao = precosMinuto.find((c) => c.ticker === ordem.cod_acao);
        if (!acao) continue;

        if (ordem.tipo_transacao === 'COMPRA') {
          // Compra programada: executa se o preço de mercado cair ou igualar ao preço configurado
          if (acao.preco > ordem.preco_ordem) continue;

          await OrdemService.executarCompra({
            idUsuario: ordem.id_usuario,
            codAcao: ordem.cod_acao,
            quantidade: ordem.quantidade,
            precoExecucao: acao.preco,
            tipoOrdem: ordem.tipo_ordem,
            idOrdemExistente: ordem.id_ordem,
            horaExecucao,
          });
        } else if (ordem.tipo_transacao === 'VENDA') {
          // Venda programada: executa se o preço de mercado subir ou igualar ao preço solicitado pelo usuário
          if (acao.preco < ordem.preco_ordem) continue;

          await OrdemService.executarVenda({
            idUsuario: ordem.id_usuario,
            codAcao: ordem.cod_acao,
            quantidade: ordem.quantidade,
            precoExecucao: acao.preco,
            tipoOrdem: ordem.tipo_ordem,
            idOrdemExistente: ordem.id_ordem,
            horaExecucao,
          });
        }
      } catch (error) {
        if (
          error instanceof SaldoInsuficienteError ||
          error instanceof QuantidadeInsuficienteError ||
          error.name === 'QuantidadeInsuficienteError'
        ) {
          await OrdemModel.atualizarStatusOrdem(ordem.id_ordem, 'CANCELADA', horaExecucao);
          continue;
        }

        console.error(`Erro ao processar ordem ${ordem.id_ordem}:`, error);
      }
    }
  },
};

module.exports = OrdemService;
