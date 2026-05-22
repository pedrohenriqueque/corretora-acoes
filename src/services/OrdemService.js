const OrdemModel = require('../models/OrdemModel');
const UsuarioModel = require('../models/UsuarioModel');
const ContaCorrenteService = require('./ContaCorrenteService');
const MercadoService = require('./MercadoService');

const ordemService = {
    processarSolicitacaoCompra: async(idUsuario, codigo, quantidade, tipoTransacao, tipoOrdem, precoOrdem, minutoAtual) => {
        if(quantidade <= 0){
            throw new Error('Quantidade de ações precisa ser maior que zero');
        }

        let idOrdem = null; 
        let statusFinal = '';

        const saldo = Number(await ContaCorrenteService.obterSaldoConta(idUsuario));

        
        const precoTotal = Number(precoOrdem) * Number(quantidade);

        console.log("Saldo (Número):", saldo);
        console.log("Preço Total (Número):", precoTotal);


        if(tipoOrdem === 'MERCADO'){
            if(precoTotal > saldo){
                throw new Error('Saldo Insuficiente para concluir a compra');
            }
            
            statusFinal = 'EXECUTADA';
            
            idOrdem = await OrdemModel.criarOrdem(idUsuario, codigo, precoOrdem, tipoTransacao, tipoOrdem, quantidade, statusFinal);
            
            await ContaCorrenteService.sacarValor(idUsuario, precoTotal);
            
            // Chamar o CarteiraService.adicionarAcaoaqui futuramente
        }
        else if(tipoOrdem === 'PROGRAMADA'){
            statusFinal = 'PENDENTE';
            
            idOrdem = await OrdemModel.criarOrdem(idUsuario, codigo, precoOrdem, tipoTransacao, tipoOrdem, quantidade, statusFinal);
        }

        return {
            id_ordem: idOrdem,
            id_usuario: idUsuario, 
            cod_acao: codigo,
            preco_ordem: precoOrdem, 
            tipo_transacao: tipoTransacao,
            tipo_ordem: tipoOrdem,
            quantidade: quantity = quantidade,
            status: statusFinal
        };
    },

    processarOrdensPendentes: async(precosMinutos) => {
        try{
            ordens = await OrdemModel.buscarOrdensPorStatus('PENDENTE');

            for (const ordem of ordens){
                try{
                    const acao = precosMinuto.find(c => c.ticker === ordem.cod_acao);

                    if(!acao) continue;

                    if(acao.preco <= ordem.preco_ordem){
                        const saldo = await ContaCorrenteService.obterSaldoConta(ordem.id_usuario);
                        const precoTotal = ordem.quantidade * acao.preco;
                        if(saldo < precoTotal){
                            console.error('Ordem cancelada por saldo insuficiente: Não é possível executar a ordem de compra');
                        }

                        await OrdemModel.atualizarStatusOrdem(ordem.id_ordem, 'EXECUTADA');
                        await ContaCorrenteService.sacarValor(idUsuario, precoTotal);

                        console.log('Ordem executada com sucesso!')

                    }
                }catch(error){
                    console.error('Erro ao processar ordem individual');
                }
                
            }
        }catch(error){
            console.error('Erro de processamento das ordens pendentes');
        }
        

    }

};

module.exports = ordemService;
