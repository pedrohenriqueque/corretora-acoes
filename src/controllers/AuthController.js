const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/UsuarioModel');
const ContaCorrenteModel = require('../models/ContaCorrenteModel');
const CarteiraModel = require('../models/CarteiraModel');

const authController = {
  // Lógica de Cadastro
  register: async (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }

    try {
      const salt = await bcrypt.genSalt(10);
      const senhaCriptografada = await bcrypt.hash(senha, salt);

      const idUsuario = await UsuarioModel.criar(nome, email, senhaCriptografada);

      await ContaCorrenteModel.criarConta(idUsuario, 50000000.00);

      await CarteiraModel.criarCarteira(idUsuario);



      const todasAcoes = await UsuarioModel.listarTodasAcoes();
      const acoesIniciais = UsuarioModel.sortearAcoes(todasAcoes, 10);
      await UsuarioModel.adicionarAcoesFavoritas(idUsuario, acoesIniciais);


      return res.status(201).json({
        message: 'Usuário cadastrado com sucesso!',
        acoesIniciais,
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
      }
      console.error(error);
      return res.status(500).json({ error: 'Erro interno ao cadastrar usuário.' });
    }
  },

  // Lógica de Login (Requisito #1)
  login: async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    try {
      // Usa o Model para buscar o usuário
      const usuario = await UsuarioModel.buscarPorEmail(email);

      if (!usuario) {
        return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      }

      const senhaValida = await bcrypt.compare(senha, usuario.senha);
      
      if (!senhaValida) {
        return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      }

      // Gera o Token JWT
      const token = jwt.sign(
        { id_usuario: usuario.id_usuario },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
      );

      return res.json({
        message: 'Login bem-sucedido!',
        token: token,
        usuario: {
          id_usuario: usuario.id_usuario,
          nome: usuario.nome,
          email: usuario.email
        }
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno ao tentar fazer login.' });
    }
  },

  // 1. LOGOUT
  logout: async (req, res) => {
    return res.json({ message: 'Logout efetuado com sucesso.' });
  },

  // 2. RECUPERAR SENHA 
  recuperarSenha: async (req, res) => {
    try {
      let { email, novaSenha } = req.body;

      if (!email || !novaSenha) {
        return res.status(400).json({ error: 'E-mail e nova senha são obrigatórios.' });
      }

      email = email.trim().toLowerCase();
      const usuario = await UsuarioModel.buscarPorEmail(email);

      if (!usuario) {
        // Por segurança, fingimos que deu certo para evitar descoberta de e-mails válidos
        return res.json({ message: 'Se o e-mail existir, a senha foi redefinida com sucesso!' });
      }

      // Criptografa a nova senha
      const salt = await bcrypt.genSalt(10);
      const novaSenhaCriptografada = await bcrypt.hash(novaSenha, salt);

      // Salva no banco
      await UsuarioModel.atualizarSenha(usuario.id_usuario, novaSenhaCriptografada);

      return res.json({ message: 'Se o e-mail existir, a senha foi redefinida com sucesso!' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao recuperar senha.' });
    }
  },

  // 3. TROCAR DE SENHA 
  trocarSenha: async (req, res) => {
    try {
      const id_usuario = req.usuarioLogado.id_usuario; 
      const { senhaAtual, novaSenha } = req.body;

      if (!senhaAtual || !novaSenha) {
        return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias.' });
      }

      // Busca o usuário logado para validar a senha antiga
      const usuario = await UsuarioModel.buscarPorId(id_usuario);

      const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);
      if (!senhaValida) {
        return res.status(401).json({ error: 'A senha atual digitada está incorreta.' });
      }

      // Criptografa a nova senha
      const salt = await bcrypt.genSalt(10);
      const novaSenhaCriptografada = await bcrypt.hash(novaSenha, salt);

      // Atualiza no banco
      await UsuarioModel.atualizarSenha(id_usuario, novaSenhaCriptografada);

      return res.json({ message: 'Senha alterada com sucesso!' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao trocar a senha.' });
    }
  }
};


module.exports = authController;