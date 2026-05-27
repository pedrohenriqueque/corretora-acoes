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
    precoOrdem = null,
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

      if (!idOrdem) {
        const precoOrdemFinal = precoOrdem ?? preco;
        idOrdem = await OrdemModel.criarOrdem(
          idUsuario,
          codigo,
          precoOrdemFinal,
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
        await OrdemModel.atualizarStatusOrdem(idOrdem, 'EXECUTADA', horaExecucao, preco, connection);
      }

      await connection.commit();

      return {
        id_ordem: idOrdem,
        id_usuario: idUsuario,
        cod_acao: codigo,
        preco_ordem: precoOrdem ?? preco,
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
        precoOrdem,
        tipoOrdem,
        horaLancamento: horaSistema,
        horaExecucao: horaSistema,
      });
    }

    if (tipoOrdem === 'PROGRAMADA') {
      const precoAtual = Number(precoAtualMercado);

      const precoAtingiu = Number.isFinite(precoAtual) && precoOrdem >= precoAtual;

      const idOrdem = await OrdemModel.criarOrdem(
        idUsuario,
        codAcao,
        precoOrdem,
        null,
        'COMPRA',
        tipoOrdem,
        quantidade,
        'PENDENTE',
        horaSistema,
        null
      );

      if (precoAtingiu) {
        try {
          return await OrdemService.executarCompra({
            idUsuario,
            codAcao,
            quantidade,
            precoExecucao: precoAtual,
            precoOrdem,
            tipoOrdem,
            idOrdemExistente: idOrdem,
            horaExecucao: horaSistema,
          });
        } catch (error) {
          if (error instanceof SaldoInsuficienteError) {
            await OrdemModel.atualizarStatusOrdem(idOrdem, 'CANCELADA', horaSistema, null);
            return {
              id_ordem: idOrdem,
              id_usuario: idUsuario,
              cod_acao: codAcao,
              preco_ordem: precoOrdem,
              preco_execucao: null,
              quantidade,
              tipo_ordem: tipoOrdem,
              status: 'CANCELADA',
              hora_lancamento: horaSistema,
              hora_execucao: horaSistema,
            };
          }
          throw error;
        }
      }

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
    precoOrdem = null,
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
        const precoOrdemFinal = precoOrdem ?? preco;
        idOrdem = await OrdemModel.criarOrdem(
          idUsuario,
          codigo,
          precoOrdemFinal,
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
        await OrdemModel.atualizarStatusOrdem(idOrdem, 'EXECUTADA', horaExecucao, preco, connection);
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
        preco_ordem: precoOrdem ?? preco,
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
        precoOrdem,
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
          precoOrdem,
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
        null,
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
            precoOrdem: ordem.preco_ordem,
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
            precoOrdem: ordem.preco_ordem,
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
          await OrdemModel.atualizarStatusOrdem(ordem.id_ordem, 'CANCELADA', horaExecucao, null);
          continue;
        }

        console.error(`Erro ao processar ordem ${ordem.id_ordem}:`, error);
      }
    }
  },

  listarOrdensUsuario: async (idUsuario) => {
    if (!idUsuario) {
      throw new Error('ID do usuário é inválido ou não foi fornecido.');
    }

    const ordens = await OrdemModel.buscarOrdensPorUsuario(idUsuario);
    return ordens.map(({ id_usuario, ...ordem }) => ordem);
  },

  cancelarOrdemPendente: async (idUsuario, idOrdem, horaExecucao) => {
    if (!idUsuario) {
      throw new Error('ID do usuário é inválido ou não foi fornecido.');
    }

    if (!idOrdem) {
      throw new Error('ID da ordem é inválido ou não foi fornecido.');
    }

    if (!horaExecucao) {
      throw new Error('hora_execucao é obrigatória para cancelar a ordem.');
    }

    const ordem = await OrdemModel.buscarOrdemPendenteUsuario(idOrdem, idUsuario);
    if (!ordem) {
      return null;
    }

    await OrdemModel.atualizarStatusOrdem(idOrdem, 'CANCELADA', horaExecucao, null);

    return {
      id_ordem: ordem.id_ordem,
      cod_acao: ordem.cod_acao,
      preco_ordem: ordem.preco_ordem,
      preco_execucao: null,
      quantidade: ordem.quantidade,
      tipo_ordem: ordem.tipo_ordem,
      status: 'CANCELADA',
      hora_lancamento: ordem.hora_lancamento,
      hora_execucao: horaExecucao,
    };
  },
};

module.exports = OrdemService;
