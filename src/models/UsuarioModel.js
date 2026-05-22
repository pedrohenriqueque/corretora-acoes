const db = require('../config/database');

const UsuarioModel = {
  buscarPorEmail: async (email) => {
    const query = 'SELECT * FROM usuario WHERE email = ?';
    const [rows] = await db.execute(query, [email]);
    return rows[0];
  },

  criar: async (nome, email, senhaCriptografada) => {
    const query = 'INSERT INTO usuario (nome, email, senha) VALUES (?, ?, ?)';
    const [result] = await db.execute(query, [nome, email, senhaCriptografada]);
    return result.insertId;
  },

  listarTodasAcoes: async () => {
    const [rows] = await db.execute('SELECT cod_acao FROM acao');
    return rows.map((row) => row.cod_acao);
  },

  sortearAcoes: (codigos, quantidade = 10) => {
    const unicos = [...new Set(codigos.map((c) => c.toUpperCase().trim()).filter(Boolean))];
    const quantidadeFinal = Math.min(quantidade, unicos.length);
    const pool = [...unicos];
    const sorteados = [];

    for (let i = 0; i < quantidadeFinal; i += 1) {
      const indice = Math.floor(Math.random() * pool.length);
      sorteados.push(pool.splice(indice, 1)[0]);
    }

    return sorteados;
  },

  adicionarAcoesFavoritas: async (id_usuario, codigos) => {
    if (!codigos.length) return;

    const placeholders = codigos.map(() => '(?, ?)').join(', ');
    const valores = codigos.flatMap((cod_acao) => [id_usuario, cod_acao]);

    await db.execute(
      `INSERT INTO acoes_favoritadas (user_id, cod_acao) VALUES ${placeholders}`,
      valores
    );
  },

  atualizarSenha: async (id_usuario, novaSenhaCriptografada) => {
    const query = 'UPDATE usuario SET senha = ? WHERE id_usuario = ?';
    await db.execute(query, [novaSenhaCriptografada, id_usuario]);
    return true;
  },

  buscarPorId: async (id_usuario) => {
    const query = 'SELECT * FROM usuario WHERE id_usuario = ?';
    const [rows] = await db.execute(query, [id_usuario]);
    return rows[0];
  },

  buscarAcoesDisponiveisParaAdicionar: async (id_usuario) => {
    const query = `
      SELECT cod_acao, nome
      FROM acao
      WHERE cod_acao NOT IN (
        SELECT cod_acao FROM acoes_favoritadas WHERE user_id = ?
      )
    `;
    const [rows] = await db.execute(query, [id_usuario]);
    return rows;
  },
};

module.exports = UsuarioModel;
