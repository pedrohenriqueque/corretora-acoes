const OrdemService = require('../services/OrdemService');
const MercadoController = require('./MercadoController');
const MercadoService = require('../services/MercadoService'); 

const OrdemController = {
    comprarAcao: async(req, res) => {
        try {
            if (!req.body) {
                return res.status(400).json({ error: 'O corpo da requisição (body) não foi enviado.' });
            }

            const idUsuario = req.usuarioId; // Pegando o ID injetado pelo seu authMiddleware
            let { codigo, quantidade, tipoOrdem, precoOrdem } = req.body;

            if (!codigo || !quantidade || !tipoOrdem) {
                return res.status(400).json({ error: 'Código da ação, quantidade e tipo de ordem são obrigatórios.' });
            }

            const minutosAtuais = MercadoController.obterMinutosAtuais();

            if (tipoOrdem === 'MERCADO') {
                const precoAtualMercado = await MercadoService.retornarPrecoAtualAcao(codigo, minutosAtuais);
                
                if (!precoAtualMercado) {
                    return res.status(404).json({ error: 'Ação não encontrada para o minuto atual do sistema.' });
                }
                
                precoOrdem = precoAtualMercado; 
            } else if (tipoOrdem === 'PROGRAMADA') {
                if (!precoOrdem) {
                    return res.status(400).json({ error: 'Para ordens programadas, você precisa definir um preço alvo.' });
                }
            } else {
                return res.status(400).json({ error: 'Tipo de ordem inválido. Use MERCADO ou PROGRAMADA.' });
            }

            const resultado = await OrdemService.processarSolicitacaoCompra(
                idUsuario, 
                codigo, 
                quantidade, 
                'COMPRA', 
                tipoOrdem, 
                precoOrdem, 
                minutosAtuais
            );

            return res.status(201).json(resultado);
    
        } catch(error) {
            console.error(error);
            if (error.message && (error.message.includes('obrigatórios') || error.message.includes('maior que zero') || error.message.includes('inválido') || error.message.includes('Insuficiente'))) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Erro interno ao tentar criar uma ordem de compra.' });
        } 
    }
};

module.exports = OrdemController;