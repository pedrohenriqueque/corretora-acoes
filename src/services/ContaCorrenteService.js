const ContaCorrenteModel = require('../models/ContaCorrenteModel');


const ContaCorrenteService = {
    obterSaldoConta: async(idUsuario) => {
        if (!idUsuario){
            throw new Error('ID do usuário é inválido ou não foi fornecido.');
        }

        const saldo = await ContaCorrenteModel.buscarSaldoUsuario(idUsuario);

        return saldo;

    },

    sacarValor: async(idUsuario, valor) => {
        if(!valor || valor <= 0){
            throw new Error('Valor inválido ou não fornecido');
        }

        const saldo = await ContaCorrenteService.obterSaldoConta(idUsuario);
        
        const saldoAtualizado = saldo - valor;

        await ContaCorrenteModel.alterar(saldoAtualizado, idUsuario);

    }

    
};

module.exports = ContaCorrenteService;
