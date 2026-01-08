export function onlyDigits(value: string): string {
  return (value || "").replace(/\D+/g, "");
}

export function formatCpf(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

export function formatCnpj(value: string): string {
  const d = onlyDigits(value).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}

export function formatCpfCnpj(value: string): string {
  const d = onlyDigits(value);
  if (d.length > 11) return formatCnpj(d);
  return formatCpf(d);
}

export function isValidEmail(value: string): boolean {
  if (!value) return false;
  // simples, suficiente para validação leve
  return /\S+@\S+\.\S+/.test(value);
}

// Formata valor monetário para exibição (R$ 1.234,56)
export function formatMoney(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.')) : value;
  if (isNaN(numValue)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numValue);
}

// Converte string formatada (R$ 1.234,56) para número
export function parseMoney(value: string): number {
  if (!value) return 0;
  // Remove tudo exceto dígitos, vírgula e ponto
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Formata valor monetário para input (mantém formato durante digitação)
export function formatMoneyInput(value: string): string {
  if (!value) return '';
  // Remove tudo exceto dígitos
  const digits = value.replace(/\D+/g, '');
  if (!digits) return '';
  
  // Converte para número e formata
  const numValue = parseFloat(digits) / 100; // Divide por 100 para considerar centavos
  // Formata sem o símbolo R$ para input (só números, vírgula e ponto)
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue);
}

// Converte valor formatado de input para número (para salvar no banco)
export function parseMoneyInput(value: string): number {
  if (!value) return 0;
  // Remove tudo exceto dígitos
  const digits = value.replace(/\D+/g, '');
  if (!digits) return 0;
  // Divide por 100 para converter centavos em reais
  return parseFloat(digits) / 100;
}


