const express = require('express');
const router = express.Router();
const ContaCorrenteController = require('../controllers/ContaCorrenteController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, ContaCorrenteController.listarExtrato);
router.get('/saldo', authMiddleware, ContaCorrenteController.obterSaldo);
router.post('/deposito', authMiddleware, ContaCorrenteController.registrarDeposito);
router.post('/retirada', authMiddleware, ContaCorrenteController.registrarRetirada);

module.exports = router;
