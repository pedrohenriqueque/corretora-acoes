
const axios = require('axios');

const mercadoService = {

  obterPrecosFechamento: async () => {
    const res = await axios.get('https://raw.githubusercontent.com/marciobarros/dsw-simulador-corretora/refs/heads/main/tickers.json');
    return res.data;
  },

  obterPrecosMinuto: async (minuto) => {
    const res = await axios.get(`https://raw.githubusercontent.com/marciobarros/dsw-simulador-corretora/refs/heads/main/${minuto}.json`);
    return res.data;
  },

  // Cruza os dados do minuto com o fechamento e calcula as variações 
  mapearPrecosComVariacao: (precosMinuto, precosFechamento) => {
    return precosMinuto.map(itemAtual => {
      const itemFechamento = precosFechamento.find(c => c.ticker === itemAtual.ticker);
      if (!itemFechamento) return null;

      const precoFechamento = itemFechamento.fechamento;
      const precoAtual = itemAtual.preco;
      const variacaoNominal = precoAtual - precoFechamento;
      const variacaoPercentual = (variacaoNominal / precoFechamento) * 100;

      return {
        codigo: itemAtual.ticker,
        preco: precoAtual,
        variacao_nominal: Number(variacaoNominal.toFixed(2)),
        variacao_percentual: Number(variacaoPercentual.toFixed(2))
      };
    }).filter(Boolean);
  },

  retornarPrecoAtualAcao: async (codigo, minuto) => {
      const precosMinuto = await mercadoService.obterPrecosMinuto(minuto);

      const acao = precosMinuto.find(c => c.ticker === codigo);
      if (!acao) return null;

      const precoAtual = acao.preco;

      return precoAtual;
  }

};

module.exports = mercadoService;