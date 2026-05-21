const express = require('express');
const authController = require('./controllers/authController');
const protegerRota = require('./middleware/authMiddleware');
const mercadoRoutes = require('./routes/mercadoRoutes');
const mercadoController = require('./controllers/mercadoController');

const app = express();
app.use(express.json());

app.use('/mercado', mercadoRoutes);

app.post('/auth/register', authController.register);
app.post('/auth/login', authController.login);
app.post('/auth/recuperar-senha', authController.recuperarSenha);
app.post('/auth/trocar-senha', protegerRota, authController.trocarSenha);
app.post('/auth/logout', protegerRota, authController.logout);

app.get('/', (req, res) => {
  res.json({ mensagem: 'Backend Node.js rodando com sucesso!' });
});

module.exports = app;
