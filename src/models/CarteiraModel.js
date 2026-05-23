const db = require('../config/database');

const CarteiraModel = {
  criarCarteira: async (id_usuario, connection = null) => {
    const executor = connection || db;
    const query = 'INSERT INTO carteira (id_usuario) VALUES (?)';
    const [result] = await executor.execute(query, [id_usuario]);
    return result.insertId;
  },

  buscarIdPorUsuario: async (id_usuario, connection = null) => {
    const executor = connection || db;
    const query = 'SELECT id_carteira FROM carteira WHERE id_usuario = ?';
    const [rows] = await executor.execute(query, [id_usuario]);

    if (!rows[0]) {
      throw new Error('Carteira não encontrada para o usuário.');
    }

    return rows[0].id_carteira;
  },
};

module.exports = CarteiraModel;
