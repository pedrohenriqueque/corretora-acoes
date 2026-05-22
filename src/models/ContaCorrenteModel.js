const db = require('../config/database');

const ContaCorrenteModel = {

    criarConta: async (id_usuario, saldo) => {
        const query = 'INSERT INTO conta_corrente (id_usuario, saldo) VALUES (?,?)';
        const result = await db.execute(query, [id_usuario, saldo]);
        return result.insertId;
    },

    buscarSaldoUsuario: async (id_usuario) => {
        const query = 'SELECT saldo FROM conta_corrente WHERE id_usuario = ?';
        const [rows] = await db.execute(query, [id_usuario]);
        return Number(rows[0].saldo);
    },

    alterar: async(valor, id_usuario) => {
        const query = 'UPDATE conta_corrente SET saldo = ? WHERE id_usuario = ?';
        await db.execute(query, [valor, id_usuario]);
        return true;
    }



};

module.exports = ContaCorrenteModel;