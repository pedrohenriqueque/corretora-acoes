const express = require('express');
const authController = require('./controllers/AuthController');
const protegerRota = require('./middleware/authMiddleware');
const mercadoRoutes = require('./routes/mercadoRoutes');
const ordemRoutes = require('./routes/ordemRoutes');
const mercadoController = require('./controllers/MercadoController');

const app = express();
app.use(express.json());

app.use('/mercado', mercadoRoutes);
app.use('/ordem', ordemRoutes);

app.post('/auth/register', authController.register);
app.post('/auth/login', authController.login);
app.post('/auth/recuperar-senha', authController.recuperarSenha);
app.post('/auth/trocar-senha', protegerRota, authController.trocarSenha);
app.post('/auth/logout', protegerRota, authController.logout);

app.get('/', (req, res) => {
  res.json({ mensagem: 'Backend Node.js rodando com sucesso!' });
});

module.exports = app;
