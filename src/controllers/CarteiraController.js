const CarteiraService = require('../services/CarteiraService');
const MercadoController = require('./MercadoController');

const CarteiraController = {
  listarCarteira: async (req, res) => {
    try {
      const idUsuario = req.usuarioId;
      const minutoAtual = await MercadoController.obterMinutosAtuais();
      const horaNegociacao = `14:${minutoAtual.toString().padStart(2, '0')}`;

      const { acoes, ganhos_perdas_total } = await CarteiraService.obterCarteiraComPrecos(
        idUsuario,
        minutoAtual
      );

      return res.json({
        horaNegociacao,
        ganhos_perdas_total,
        acoes,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao listar a carteira do usuário.' });
    }
  },
};

module.exports = CarteiraController;
