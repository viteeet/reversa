/**
 * Validações críticas do sistema
 */

/**
 * Valida CPF
 * @param cpf - CPF com ou sem formatação
 * @returns true se válido, false caso contrário
 */
export function validarCPF(cpf: string): boolean {
  const cpfLimpo = cpf.replace(/\D+/g, '');
  
  // Verifica se tem 11 dígitos
  if (cpfLimpo.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;
  
  // Valida primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
  }
  let digito = 11 - (soma % 11);
  if (digito >= 10) digito = 0;
  if (digito !== parseInt(cpfLimpo.charAt(9))) return false;
  
  // Valida segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
  }
  digito = 11 - (soma % 11);
  if (digito >= 10) digito = 0;
  if (digito !== parseInt(cpfLimpo.charAt(10))) return false;
  
  return true;
}

/**
 * Valida CNPJ
 * @param cnpj - CNPJ com ou sem formatação
 * @returns true se válido, false caso contrário
 */
export function validarCNPJ(cnpj: string): boolean {
  const cnpjLimpo = cnpj.replace(/\D+/g, '');
  
  // Verifica se tem 14 dígitos
  if (cnpjLimpo.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais (CNPJ inválido)
  if (/^(\d)\1{13}$/.test(cnpjLimpo)) return false;
  
  // Valida primeiro dígito verificador
  let tamanho = cnpjLimpo.length - 2;
  let numeros = cnpjLimpo.substring(0, tamanho);
  const digitos = cnpjLimpo.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;
  
  // Valida segundo dígito verificador
  tamanho = tamanho + 1;
  numeros = cnpjLimpo.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) return false;
  
  return true;
}

/**
 * Valida email
 * @param email - Email a validar
 * @returns true se válido, false caso contrário
 */
export function validarEmail(email: string): boolean {
  if (!email || !email.trim()) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Valida se cedente_id está presente (obrigatório para sacados)
 * @param cedenteId - ID do cedente
 * @returns true se válido, false caso contrário
 */
export function validarCedenteId(cedenteId: string | null | undefined): boolean {
  return !!cedenteId && cedenteId.trim() !== '';
}

/**
 * Valida se CNPJ é único (verificação básica de formato)
 * @param cnpj - CNPJ a validar
 * @returns true se formato válido, false caso contrário
 */
export function validarCNPJUnico(cnpj: string): boolean {
  return validarCNPJ(cnpj);
}

/**
 * Valida se CPF é único (verificação básica de formato)
 * @param cpf - CPF a validar
 * @returns true se formato válido, false caso contrário
 */
export function validarCPFUnico(cpf: string): boolean {
  return validarCPF(cpf);
}

