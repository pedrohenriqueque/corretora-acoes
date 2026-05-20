const db = require('../config/database');

const UsuarioModel = {
  // Busca um usuário pelo e-mail 
  buscarPorEmail: async (email) => {
    const query = 'SELECT * FROM Usuario WHERE email = ?';
    const [rows] = await db.execute(query, [email]);
    return rows[0]; // Retorna o usuário encontrado ou undefined
  },

  // Cria um novo usuário 
  criar: async (nome, email, senhaCriptografada) => {
    const query = 'INSERT INTO Usuario (nome, email, senha) VALUES (?, ?, ?)';
    const [result] = await db.execute(query, [nome, email, senhaCriptografada]);
    return result.insertId; // Retorna o ID do usuário gerado
  },

  // Atualiza a senha do usuário
  atualizarSenha: async (id_usuario, novaSenhaCriptografada) => {
    const query = 'UPDATE Usuario SET senha = ? WHERE id_usuario = ?';
    await db.execute(query, [novaSenhaCriptografada, id_usuario]);
    return true;
  },

  // Busca um usuário pelo ID
  buscarPorId: async (id_usuario) => {
    const query = 'SELECT * FROM Usuario WHERE id_usuario = ?';
    const [rows] = await db.execute(query, [id_usuario]);
    return rows[0];
  },

  atualizarTentativas: async(id_usuario, tentativas_login_erradas, data_desbloqueio) =>{
    const query = 'UPDATE Usuario SET tentativas_login_erradas = ?, data_desbloqueio = ? WHERE id_usuario = ?';
    await db.execute(query, [tentativas_login_erradas, data_desbloqueio, id_usuario])
    return true;
  }

};

module.exports = UsuarioModel;