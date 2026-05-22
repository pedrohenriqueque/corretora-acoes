const express = require('express');
const router = express.Router();
const mercadoController = require('../controllers/MercadoController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/AvancaTempo', authMiddleware, mercadoController.avancaTempo);
router.get('/PegaTempo', authMiddleware, mercadoController.pegaTempo);
router.get('/ListaAcoesInteresse', authMiddleware, mercadoController.listaAcoesInteresse);
router.post('/AdicionaAcaoInteresse', authMiddleware, mercadoController.adicionaAcaoInteresse);
router.delete('/RemoveAcaoInteresse', authMiddleware, mercadoController.removeAcaoInteresse);
router.get('/acoes-disponiveis', authMiddleware, mercadoController.listarAcoesDisponiveis);
router.get('/acoes/:codigo', authMiddleware, mercadoController.exibirAcao);

module.exports = router;