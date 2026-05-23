const db = require('../config/database');

const AcaoModel = {
  existePorCodigo: async (cod_acao) => {
    const query = 'SELECT 1 FROM acao WHERE cod_acao = ? LIMIT 1';
    const [rows] = await db.execute(query, [cod_acao]);
    return rows.length > 0;
  },
};

module.exports = AcaoModel;
