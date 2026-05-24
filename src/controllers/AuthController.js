const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/UsuarioModel');
const ContaCorrenteModel = require('../models/ContaCorrenteModel');
const CarteiraModel = require('../models/CarteiraModel');
const validador = require('../utils/authValidators');
const emailTransporter = require('../config/email');

const AuthController = {
  // Lógica de Cadastro
  register: async (req, res) => {
    const { nome, email, senha, senhaRepetida } = req.body;

    // 1. Validações básicas de presença
    if (!nome || !email || !senha || !senhaRepetida) {
      return res.status(400).json({ error: 'Nome, e-mail, senha e confirmação são obrigatórios.' });
    }

    if (nome.trim().length === 0) {
      return res.status(400).json({ error: 'O nome do usuário não pode ser vazio.' });
    }

    // 2. Validações de formato via utils
    if (!validador.verificaEmailValido(email)) {
      return res.status(400).json({ error: 'O e-mail do usuário não está em um formato adequado.' });
    }

    if (!validador.verificaSenhaValida(senha)) {
      return res.status(400).json({ error: 'A senha deve conter ao menos 8 caracteres, incluindo letras e números.' });
    }

    if (senha !== senhaRepetida) {
      return res.status(400).json({ error: 'A confirmação de senha está diferente da senha.' });
    }

    try {
      const emailTratado = email.trim().toLowerCase();

      const salt = await bcrypt.genSalt(10);
      const senhaCriptografada = await bcrypt.hash(senha, salt);

      const idUsuario = await UsuarioModel.criar(nome, emailTratado, senhaCriptografada);

      // Cria a infraestrutura do investidor
      await ContaCorrenteModel.criarConta(idUsuario, 50000000.00);
      await CarteiraModel.criarCarteira(idUsuario);

      // Sorteio de ações favoritas iniciais
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

  // Lógica de Login
  login: async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    try {
      const emailTratado = email.trim().toLowerCase();
      const usuario = await UsuarioModel.buscarPorEmail(emailTratado);

      // Mensagem genérica por segurança para evitar descoberta de contas válidas
      if (!usuario) {
        return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      }

      // Verifica se o usuário já está bloqueado
      if (usuario.bloqueado === 1 || usuario.bloqueado === true) {
        return res.status(403).json({
          error: 'Sua conta está bloqueada devido a múltiplas tentativas de login malsucedidas. Redefina sua senha para desbloqueá-la.'
        });
      }

      const senhaValida = await bcrypt.compare(senha, usuario.senha);
      if (!senhaValida) {
        const lockoutInfo = (await UsuarioModel.registrarTentativaFalha(usuario.id_usuario)) || {};
        
        if (lockoutInfo.bloqueado) {
          return res.status(403).json({
            error: 'Sua conta foi bloqueada devido a 3 tentativas de login malsucedidas. Redefina sua senha para desbloqueá-la.'
          });
        }
        
        return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      }

      // Login bem-sucedido - reseta contador de tentativas
      await UsuarioModel.resetarTentativas(usuario.id_usuario);

      // Gera o Token JWT contendo o ID do Usuário
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

  // Logout
  logout: async (req, res) => {
    return res.json({ message: 'Logout efetuado com sucesso.' });
  },

  recuperarSenha: async (req, res) => {
    try {
      const { email, codigo, novaSenha, senhaRepetida } = req.body;
      if (!email) return res.status(400).json({ error: 'O e-mail é obrigatório.' });

      const emailTratado = email.trim().toLowerCase();

      // Se qualquer um dos campos de redefinição for enviado, assume que é a Etapa 2: Redefinição
      if (codigo !== undefined || novaSenha !== undefined || senhaRepetida !== undefined) {
        if (!codigo || !novaSenha || !senhaRepetida) {
          return res.status(400).json({ error: 'Código, nova senha e confirmação de senha são obrigatórios.' });
        }

        if (novaSenha !== senhaRepetida) {
          return res.status(400).json({ error: 'A confirmação de senha está diferente da nova senha.' });
        }

        if (!validador.verificaSenhaValida(novaSenha)) {
          return res.status(400).json({ error: 'A nova senha deve conter ao menos 8 caracteres, incluindo letras e números.' });
        }

        const usuario = await UsuarioModel.buscarPorEmail(emailTratado);
        if (!usuario) {
          return res.status(400).json({ error: 'Código de verificação inválido ou expirado.' });
        }

        // Verifica o código de recuperação
        if (!usuario.codigo_recuperacao || usuario.codigo_recuperacao !== codigo) {
          return res.status(400).json({ error: 'Código de verificação inválido ou expirado.' });
        }

        // Verifica expiração do código
        const agora = new Date();
        const expiracao = new Date(usuario.expiracao_recuperacao);
        if (agora > expiracao) {
          return res.status(400).json({ error: 'Código de verificação inválido ou expirado.' });
        }

        // Criptografa e salva a nova senha
        const salt = await bcrypt.genSalt(10);
        const novaSenhaCriptografada = await bcrypt.hash(novaSenha, salt);

        await UsuarioModel.atualizarSenha(usuario.id_usuario, novaSenhaCriptografada);

        // Limpa o token e reseta o contador de falhas/bloqueio
        await UsuarioModel.limparTokenRecuperacao(usuario.id_usuario);

        return res.json({ message: 'Senha redefinida com sucesso!' });
      }

      // Caso contrário, assume que é a Etapa 1: Solicitação de Código
      const usuario = await UsuarioModel.buscarPorEmail(emailTratado);

      if (!usuario) {
        return res.json({ message: 'Se o e-mail constar em nossa base, o código de verificação foi enviado.' });
      }

      const codigoVerificacao = Math.floor(100000 + Math.random() * 900000).toString();
      const dataExpiracao = new Date(Date.now() + 15 * 60 * 1000); 

      await UsuarioModel.salvarTokenRecuperacao(usuario.id_usuario, codigoVerificacao, dataExpiracao);

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: emailTratado,
        subject: 'Código de Recuperação de Senha',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 500px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #2c3e50; text-align: center;">Recuperação de Senha</h2>
            <p>Olá, <strong>${usuario.nome || 'Usuário'}</strong>.</p>
            <p>Você solicitou a redefinição da sua senha de acesso. Use o código abaixo para prosseguir no sistema:</p>
            <div style="background: #f8f9fa; padding: 15px; font-size: 26px; font-weight: bold; letter-spacing: 5px; text-align: center; border-radius: 6px; border: 1px dashed #ccc; margin: 20px 0;">
              ${codigoVerificacao}
            </div>
            <p style="font-size: 12px; color: #7f8c8d;">Este código é válido por 15 minutos. Se você não solicitou esta alteração, ignore este e-mail.</p>
          </div>
        `
      };

      await emailTransporter.sendMail(mailOptions);

      return res.json({ message: 'Se o e-mail constar em nossa base, o código de verificação foi enviado.' });

    } catch (error) {
      console.error('Erro no fluxo de esqueciSenha:', error);
      return res.status(500).json({ error: 'Erro interno ao processar a recuperação de senha.' });
    }
  },


  // Trocar de Senha (Usuário Logado e Autenticado pelo Middleware)
  trocarSenha: async (req, res) => {
    try {
      const id_usuario = req.usuarioId; // Capturado direto do authMiddleware
      const { senhaAtual, novaSenha, novaSenhaRepetida } = req.body;

      if (!senhaAtual || !novaSenha || !novaSenhaRepetida) {
        return res.status(400).json({ error: 'Todos os campos de senha são obrigatórios.' });
      }

      if (!validador.verificaSenhaValida(novaSenha)) {
        return res.status(400).json({ error: 'A nova senha deve conter ao menos 8 caracteres, letras e números.' });
      }

      if (novaSenha !== novaSenhaRepetida) {
        return res.status(400).json({ error: 'A confirmação da nova senha não confere.' });
      }

      const usuario = await UsuarioModel.buscarPorId(id_usuario);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);
      if (!senhaValida) {
        return res.status(401).json({ error: 'A senha atual digitada está incorreta.' });
      }

      const salt = await bcrypt.genSalt(10);
      const novaSenhaCriptografada = await bcrypt.hash(novaSenha, salt);

      await UsuarioModel.atualizarSenha(id_usuario, novaSenhaCriptografada);

      return res.json({ message: 'Senha alterada com sucesso!' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao trocar a senha.' });
    }
  }
};

module.exports = AuthController;