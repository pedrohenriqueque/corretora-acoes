const db = require('../config/database');

const TempoSistemaModel = {
  obterMinuto: async () => {
    const query = 'SELECT minuto FROM tempo_sistema WHERE id = 1';
    const [rows] = await db.execute(query);

    if (!rows.length) {
      return null;
    }

    return Number(rows[0].minuto);
  },

  salvarMinuto: async (minuto, connection = null) => {
    const executor = connection || db;
    const query =
      'INSERT INTO tempo_sistema (id, minuto) VALUES (1, ?) ON DUPLICATE KEY UPDATE minuto = VALUES(minuto)';
    await executor.execute(query, [minuto]);
  },
};

module.exports = TempoSistemaModel;
