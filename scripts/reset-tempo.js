require('dotenv').config();
const MercadoController = require('../src/controllers/MercadoController');

const resetarTempo = async () => {
  await MercadoController.resetMinutoSistema();
  console.log('Tempo resetado para 14:00 no banco de dados.');
  console.log('O backend sincroniza a variavel em memoria com o banco na proxima requisicao.');
};

resetarTempo().catch((error) => {
  console.error('Falha ao resetar tempo:', error);
  process.exit(1);
});
