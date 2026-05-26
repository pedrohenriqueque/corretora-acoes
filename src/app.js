const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const authController = require('./controllers/AuthController');
const protegerRota = require('./middleware/authMiddleware');
const mercadoRoutes = require('./routes/mercadoRoutes');
const ordemRoutes = require('./routes/ordemRoutes');
const carteiraRoutes = require('./routes/carteiraRoutes');
const contaCorrenteRoutes = require('./routes/contaCorrenteRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/mercado', mercadoRoutes);
app.use('/ordem', ordemRoutes);
app.use('/carteira', carteiraRoutes);
app.use('/conta-corrente', contaCorrenteRoutes);

app.post('/auth/register', authController.register);
app.post('/auth/login', authController.login);
app.post('/auth/recuperar-senha', authController.recuperarSenha);
app.post('/auth/trocar-senha', protegerRota, authController.trocarSenha);
app.post('/auth/logout', protegerRota, authController.logout);

app.get('/', (req, res) => {
  res.json({ mensagem: 'Backend Node.js rodando com sucesso!' });
});

module.exports = app;
