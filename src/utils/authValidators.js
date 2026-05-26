function verificaEmailValido(email) {
  if (!email) return false;
  return /^[A-Za-z0-9._%-]+@([A-Za-z0-9-].)+[A-Za-z]{2,4}$/.test(email);
}

function verificaSenhaValida(senha) {
  if (!senha) return false;
  if (senha.length < 8) return false;
  
  const temLetraMaiuscula = /[A-Z]/.test(senha);
  const temLetraMinuscula = /[a-z]/.test(senha);
  const temNumero = /[0-9]/.test(senha);
  const temEspecial = /[^A-Za-z0-9]/.test(senha);
  
  return temLetraMaiuscula && temLetraMinuscula && temNumero && temEspecial;
}

function validarEmail(email) {
  if (email === undefined || email === null || String(email).trim() === '') {
    return { valido: false, erro: 'E-mail é obrigatório.' };
  }

  const valor = String(email).trim().toLowerCase();

  if (!verificaEmailValido(valor)) {
    return { valido: false, erro: 'O e-mail do usuário não está em um formato adequado.' };
  }

  return { valido: true, valor };
}

function validarSenha(senha) {
  if (senha === undefined || senha === null || senha === '') {
    return { valido: false, erro: 'Senha é obrigatória.' };
  }

  if (!verificaSenhaValida(senha)) {
    return {
      valido: false,
      erro: 'A senha deve conter ao menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais.',
    };
  }

  return { valido: true, valor: senha };
}

module.exports = {
  verificaEmailValido,
  verificaSenhaValida,
  validarEmail,
  validarSenha,
};
