import { NextRequest, NextResponse } from 'next/server';

// Integração com BigData Corp API
// Documentação: https://api.bigdatacorp.com.br

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cnpj = searchParams.get('cnpj');
  const tipo = searchParams.get('tipo'); // 'completo', 'qsa', 'enderecos', 'telefones', 'emails', 'processos'

  if (!cnpj) {
    return NextResponse.json({ error: 'CNPJ não fornecido' }, { status: 400 });
  }

  const accessToken = process.env.BIGDATA_ACCESS_TOKEN || '';
  const tokenId = process.env.BIGDATA_TOKEN_ID || '';

  if (!accessToken || !tokenId) {
    console.warn('BigData API não configurada - usando dados mock');
    return NextResponse.json({
      mock: true,
      message: 'API não configurada - retornando dados de exemplo',
      data: getMockData(tipo || 'completo')
    });
  }

  try {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    
    // Se for para buscar QSA, usa endpoint específico
    if (tipo === 'qsa') {
      const qsaData = await fetchBigDataQSA(cnpjLimpo, accessToken, tokenId);
      
      if (!qsaData) {
        throw new Error('Dados QSA não encontrados');
      }

      const converted = convertQSAToOurFormat(qsaData);
      return NextResponse.json(converted);
    }
    
    // Para outros dados, busca registration_data
    const registrationData = await fetchBigDataRegistration(cnpjLimpo, accessToken, tokenId);
    
    if (!registrationData) {
      throw new Error('Dados não encontrados');
    }

    // Converte o formato da BigData para nosso formato
    const converted = convertBigDataToOurFormat(registrationData, tipo);
    
    return NextResponse.json(converted);
    
  } catch (error) {
    console.error('Erro ao buscar dados da BigData:', error);
    
    // Em caso de erro, retorna dados mock
    return NextResponse.json({
      mock: true,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      data: getMockData(tipo || 'completo')
    });
  }
}

async function fetchBigDataRegistration(cnpj: string, accessToken: string, tokenId: string) {
  const url = 'https://plataforma.bigdatacorp.com.br/empresas';
  
  const requestBody = {
    Datasets: 'registration_data',
    q: `doc{${cnpj}}`,
    Limit: 1
  };

  console.log('🔍 Buscando dados cadastrais do CNPJ:', cnpj);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'AccessToken': accessToken,
        'TokenId': tokenId
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📊 Resposta BigData (registration):', response.status);

    if (!response.ok) {
      console.error('❌ Erro HTTP:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.Status?.registration_data?.[0]?.Code === 0 && data.Result?.[0]) {
      console.log('✅ Dados cadastrais recebidos');
      return data.Result[0];
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erro ao chamar BigData:', error);
    return null;
  }
}

async function fetchBigDataQSA(cnpj: string, accessToken: string, tokenId: string) {
  const url = 'https://plataforma.bigdatacorp.com.br/empresas';
  
  const requestBody = {
    Datasets: 'dynamic_qsa_data',
    q: `doc{${cnpj}}`,
    Limit: 1
  };

  console.log('👥 Buscando QSA do CNPJ:', cnpj);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'AccessToken': accessToken,
        'TokenId': tokenId
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📊 Resposta BigData (QSA):', response.status);

    if (!response.ok) {
      console.error('❌ Erro HTTP:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.Status?.dynamic_qsa_data?.[0]?.Code === 0 && data.Result?.[0]) {
      console.log('✅ Dados QSA recebidos');
      return data.Result[0];
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erro ao chamar BigData QSA:', error);
    return null;
  }
}

function convertBigDataToOurFormat(bigDataResult: any, tipo: string) {
  const registrationData = bigDataResult.RegistrationData;
  const basicData = registrationData?.BasicData;
  
  // Extrai dados básicos
  const extracted = {
    qsa: extractQSA(basicData),
    enderecos: extractEnderecos(registrationData?.Addresses),
    telefones: extractTelefones(registrationData?.Phones),
    emails: extractEmails(registrationData?.Emails),
    pessoas_ligadas: [],
    empresas_relacionadas: [],
    processos: []
  };

  // Retorna apenas o tipo solicitado ou tudo
  if (tipo && tipo !== 'completo' && extracted[tipo as keyof typeof extracted]) {
    return extracted[tipo as keyof typeof extracted];
  }

  return extracted;
}

function extractQSA(basicData: any) {
  // QSA agora vem de endpoint separado (dynamic_qsa_data)
  // Esta função não é mais usada
  return [];
}

function convertQSAToOurFormat(qsaResult: any) {
  const qsaList = [];
  
  if (!qsaResult.DynamicQSAData?.Relationships?.CurrentRelationships) {
    return [];
  }

  const currentRelationships = qsaResult.DynamicQSAData.Relationships.CurrentRelationships;

  for (const relationship of currentRelationships) {
    // Filtra apenas relacionamentos tipo QSA (sócios/administradores)
    if (relationship.RelationshipType === 'QSA') {
      qsaList.push({
        cpf: relationship.RelatedEntityTaxIdNumber || '',
        nome: relationship.RelatedEntityName || '',
        qualificacao: relationship.RelationshipName || '',
        participacao: null, // BigData não retorna participação neste dataset
        data_entrada: relationship.RelationshipStartDate 
          ? new Date(relationship.RelationshipStartDate).toISOString().split('T')[0] 
          : null
      });
    }
  }

  console.log(`✅ ${qsaList.length} sócios encontrados no QSA`);
  
  return qsaList;
}

function extractEnderecos(addresses: any) {
  const enderecos = [];
  
  if (addresses?.Primary) {
    const addr = addresses.Primary;
    enderecos.push({
      endereco: `${addr.Typology || ''} ${addr.AddressMain || ''}, ${addr.Number || ''}, ${addr.Complement || ''}, ${addr.Neighborhood || ''}`.trim(),
      tipo: addr.Type === 'OFFICIAL REGISTRATION' ? 'comercial' : 'correspondencia',
      cep: addr.ZipCode?.replace(/(\d{5})(\d{3})/, '$1-$2') || '',
      cidade: addr.City || '',
      estado: addr.State || '',
      principal: true
    });
  }

  if (addresses?.Secondary) {
    const addr = addresses.Secondary;
    enderecos.push({
      endereco: `${addr.Typology || ''} ${addr.AddressMain || ''}, ${addr.Number || ''}, ${addr.Complement || ''}, ${addr.Neighborhood || ''}`.trim(),
      tipo: addr.Type === 'WORK' ? 'comercial' : 'residencial',
      cep: addr.ZipCode?.replace(/(\d{5})(\d{3})/, '$1-$2') || '',
      cidade: addr.City || '',
      estado: addr.State || '',
      principal: false
    });
  }

  return enderecos;
}

function extractTelefones(phones: any) {
  const telefones = [];

  if (phones?.Primary) {
    const phone = phones.Primary;
    telefones.push({
      telefone: `(${phone.AreaCode}) ${phone.Number}`,
      tipo: phone.Type === 'WORK' ? 'comercial' : 'fixo',
      nome_contato: '',
      principal: true
    });
  }

  if (phones?.Secondary) {
    const phone = phones.Secondary;
    telefones.push({
      telefone: `(${phone.AreaCode}) ${phone.Number}`,
      tipo: phone.Type === 'WORK' ? 'comercial' : 'fixo',
      nome_contato: '',
      principal: false
    });
  }

  return telefones;
}

function extractEmails(emails: any) {
  const emailList = [];

  if (emails?.Primary) {
    const email = emails.Primary;
    emailList.push({
      email: email.EmailAddress,
      tipo: email.Type === 'CORPORATE' ? 'comercial' : 'pessoal',
      nome_contato: '',
      principal: true
    });
  }

  if (emails?.Secondary) {
    const email = emails.Secondary;
    emailList.push({
      email: email.EmailAddress,
      tipo: email.Type === 'CORPORATE' ? 'comercial' : 'pessoal',
      nome_contato: '',
      principal: false
    });
  }

  return emailList;
}

// Função para retornar dados mock durante desenvolvimento
function getMockData(tipo: string) {
  const mockData: Record<string, any> = {
    qsa: [
      {
        cpf: '123.456.789-00',
        nome: 'João da Silva',
        qualificacao: 'Sócio Administrador',
        participacao: 50.0,
        data_entrada: '2020-01-15'
      },
      {
        cpf: '987.654.321-00',
        nome: 'Maria Santos',
        qualificacao: 'Sócio',
        participacao: 50.0,
        data_entrada: '2020-01-15'
      }
    ],
    enderecos: [
      {
        endereco: 'Rua das Flores, 123, Centro',
        tipo: 'comercial',
        cep: '12345-678',
        cidade: 'São Paulo',
        estado: 'SP',
        principal: true
      },
      {
        endereco: 'Av. Paulista, 1000, Bela Vista',
        tipo: 'correspondencia',
        cep: '01310-100',
        cidade: 'São Paulo',
        estado: 'SP',
        principal: false
      }
    ],
    telefones: [
      {
        telefone: '(11) 98888-7777',
        tipo: 'celular',
        nome_contato: 'João da Silva',
        principal: true
      },
      {
        telefone: '(11) 3333-4444',
        tipo: 'fixo',
        nome_contato: 'Recepção',
        principal: false
      }
    ],
    emails: [
      {
        email: 'contato@empresa.com.br',
        tipo: 'comercial',
        nome_contato: 'Comercial',
        principal: true
      },
      {
        email: 'financeiro@empresa.com.br',
        tipo: 'financeiro',
        nome_contato: 'Financeiro',
        principal: false
      }
    ],
    pessoas_ligadas: [
      {
        cpf: '111.222.333-44',
        nome: 'José Silva',
        tipo_relacionamento: 'pai',
        observacoes: 'Pai do sócio João da Silva'
      },
      {
        cpf: '555.666.777-88',
        nome: 'Ana Santos',
        tipo_relacionamento: 'conjuge',
        observacoes: 'Cônjuge da sócia Maria Santos'
      }
    ],
    empresas_relacionadas: [
      {
        cnpj: '11.222.333/0001-44',
        razao_social: 'EMPRESA RELACIONADA LTDA',
        tipo_relacionamento: 'grupo',
        participacao: 30.0,
        observacoes: 'Empresa do mesmo grupo econômico'
      }
    ],
    processos: [
      {
        numero_processo: '1000123-45.2023.8.26.0100',
        tipo: 'civel',
        tribunal: 'TJSP',
        vara: '1ª Vara Cível',
        data_distribuicao: '2023-03-15',
        status: 'em_andamento',
        valor: 50000.00,
        observacoes: 'Ação de cobrança'
      },
      {
        numero_processo: '2000456-78.2023.5.02.0001',
        tipo: 'trabalhista',
        tribunal: 'TRT-2',
        vara: '5ª Vara do Trabalho',
        data_distribuicao: '2023-06-20',
        status: 'julgado',
        valor: 15000.00,
        observacoes: 'Ação trabalhista - julgada procedente'
      }
    ],
    completo: {
      qsa: [
        {
          cpf: '123.456.789-00',
          nome: 'João da Silva',
          qualificacao: 'Sócio Administrador',
          participacao: 50.0,
          data_entrada: '2020-01-15'
        }
      ],
      enderecos: [
        {
          endereco: 'Rua das Flores, 123, Centro',
          tipo: 'comercial',
          cep: '12345-678',
          cidade: 'São Paulo',
          estado: 'SP',
          principal: true
        }
      ],
      telefones: [
        {
          telefone: '(11) 98888-7777',
          tipo: 'celular',
          nome_contato: 'João da Silva',
          principal: true
        }
      ],
      emails: [
        {
          email: 'contato@empresa.com.br',
          tipo: 'comercial',
          nome_contato: 'Comercial',
          principal: true
        }
      ],
      pessoas_ligadas: [],
      empresas_relacionadas: [],
      processos: []
    }
  };

  return mockData[tipo] || mockData.completo;
}

