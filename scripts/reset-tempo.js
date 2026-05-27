require('dotenv').config();
const MercadoController = require('../src/controllers/MercadoController');

const resetarTempo = async () => {
  await MercadoController.resetMinutoSistema();
  console.log('Tempo resetado para 14:00');
};

resetarTempo().catch((error) => {
  console.error('Falha ao resetar tempo:', error);
  process.exit(1);
});
