const TIPOS_ORDEM_VALIDOS = ['MERCADO', 'PROGRAMADA'];

function normalizarCodigo(codigo) {
  return String(codigo).toUpperCase().trim();
}

function validarQuantidade(quantidade) {
  const qtd = Number(quantidade);

  if (!Number.isFinite(qtd) || !Number.isInteger(qtd) || qtd <= 0) {
    return { valido: false, erro: 'Quantidade deve ser um número inteiro maior que zero.' };
  }

  return { valido: true, valor: qtd };
}

function validarPrecoOrdem(precoOrdem) {
  const preco = Number(precoOrdem);

  if (!Number.isFinite(preco) || preco <= 0) {
    return { valido: false, erro: 'Preço da ordem deve ser um número maior que zero.' };
  }

  return { valido: true, valor: preco };
}

function validarTipoOrdem(tipoOrdem) {
  if (!TIPOS_ORDEM_VALIDOS.includes(tipoOrdem)) {
    return { valido: false, erro: 'Tipo de ordem inválido. Use MERCADO ou PROGRAMADA.' };
  }

  return { valido: true, valor: tipoOrdem };
}

function calcularPrecoMedio(quantidadeAtual, precoMedioAtual, quantidadeNova, precoNovo) {
  if (quantidadeAtual <= 0) {
    return Number(precoNovo);
  }

  const totalAtual = quantidadeAtual * precoMedioAtual;
  const totalNovo = quantidadeNova * precoNovo;
  const quantidadeFinal = quantidadeAtual + quantidadeNova;

  return Number(((totalAtual + totalNovo) / quantidadeFinal).toFixed(4));
}

module.exports = {
  TIPOS_ORDEM_VALIDOS,
  normalizarCodigo,
  validarQuantidade,
  validarPrecoOrdem,
  validarTipoOrdem,
  calcularPrecoMedio,
};
