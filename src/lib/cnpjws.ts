/**
 * Utilitários para trabalhar com a API CNPJ.ws
 */

export interface CnpjWsResponse {
  razao_social?: string;
  estabelecimento?: {
    nome_fantasia?: string;
    situacao_cadastral?: string;
    tipo_logradouro?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cep?: string;
    ddd1?: string;
    telefone1?: string;
    ddd2?: string;
    telefone2?: string;
    email?: string;
    cidade?: {
      nome?: string;
    };
    estado?: {
      sigla?: string;
      nome?: string;
    };
  };
  porte?: {
    id?: string;
    descricao?: string;
  };
  natureza_juridica?: {
    id?: string;
    descricao?: string;
  };
  data_inicio_atividade?: string;
  capital_social?: string;
  atividade_principal?: Array<{
    id?: string;
    secao?: string;
    divisao?: string;
    grupo?: string;
    classe?: string;
    subclasse?: string;
    descricao?: string;
  }>;
  atividades_secundarias?: Array<{
    id?: string;
    secao?: string;
    divisao?: string;
    grupo?: string;
    classe?: string;
    subclasse?: string;
    descricao?: string;
  }>;
  simples?: {
    optante?: boolean;
    data_opcao?: string;
    data_exclusao?: string;
  };
}

/**
 * Normaliza a resposta da API CNPJ.ws para um formato padronizado
 */
export function normalizeCnpjWsResponse(data: CnpjWsResponse) {
  const estabelecimento = data?.estabelecimento || {};
  
  return {
    razao_social: data?.razao_social || '',
    nome_fantasia: estabelecimento?.nome_fantasia || '',
    situacao: estabelecimento?.situacao_cadastral || '',
    
    // Telefone formatado
    telefone: estabelecimento?.telefone1 
      ? `(${estabelecimento.ddd1}) ${estabelecimento.telefone1}`
      : '',
    
    // Email
    email: estabelecimento?.email || '',
    
    // Endereço completo
    endereco: [
      estabelecimento?.tipo_logradouro,
      estabelecimento?.logradouro,
      estabelecimento?.numero,
      estabelecimento?.complemento,
      estabelecimento?.bairro,
      estabelecimento?.cidade?.nome,
      estabelecimento?.estado?.sigla,
      estabelecimento?.cep,
    ].filter(Boolean).join(', '),
    
    // Campos individuais do endereço
    tipo_logradouro: estabelecimento?.tipo_logradouro || '',
    logradouro: estabelecimento?.logradouro || '',
    numero: estabelecimento?.numero || '',
    complemento: estabelecimento?.complemento || '',
    bairro: estabelecimento?.bairro || '',
    cep: estabelecimento?.cep || '',
    cidade: estabelecimento?.cidade?.nome || '',
    uf: estabelecimento?.estado?.sigla || '',
    
    // Outros dados
    porte: data?.porte?.descricao || '',
    natureza_juridica: data?.natureza_juridica?.descricao || '',
    data_abertura: data?.data_inicio_atividade || '',
    capital_social: data?.capital_social || '',
    
    // Atividades
    atividade_principal_codigo: data?.atividade_principal?.[0]?.id || '',
    atividade_principal_descricao: data?.atividade_principal?.[0]?.descricao || '',
    atividades_secundarias: data?.atividades_secundarias
      ?.map(a => `${a.id} - ${a.descricao}`)
      .join('; ') || '',
    
    // Simples Nacional
    simples_nacional: data?.simples?.optante || false,
  };
}

/**
 * Busca dados de um CNPJ via API
 */
export async function consultarCnpj(cnpj: string, timeoutMs = 30000) {
  const raw = cnpj.replace(/\D+/g, '');
  if (!raw || raw.length !== 14) {
    throw new Error('CNPJ inválido');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`/api/cnpjws?cnpj=${raw}`, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data?.error || `Erro HTTP ${res.status}`);
    }
    
    return normalizeCnpjWsResponse(data);
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Timeout: A consulta demorou muito tempo');
      }
      throw error;
    }
    
    throw new Error('Erro inesperado ao consultar CNPJ');
  }
}
