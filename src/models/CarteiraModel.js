const db = require('../config/database');


const CarteiraModel = {
    criarCarteira: async(id_usuario) => {
        const query = 'INSERT INTO carteira(id_usuario) VALUES (?)';
        const [result] = await db.execute(query, [id_usuario]);
        return result.insertId;
    }

};

module.exports = CarteiraModel;