import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Integração com BigData Corp API
// Documentação: https://api.bigdatacorp.com.br

// Inicializa cliente Supabase para verificação de consultas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

/**
 * Verifica se já existe uma consulta recente (últimas 24h) para o documento e tipo
 */
async function verificarConsultaRecente(documento: string, tipo: string): Promise<{ podeConsultar: boolean; ultimaConsulta: string | null }> {
  if (!supabase) {
    // Se não tiver Supabase configurado, permite a consulta (modo de desenvolvimento)
    return { podeConsultar: true, ultimaConsulta: null };
  }

  try {
    const vinteQuatroHorasAtras = new Date();
    vinteQuatroHorasAtras.setHours(vinteQuatroHorasAtras.getHours() - 24);

    const { data, error } = await supabase
      .from('bigdata_consultas')
      .select('data_consulta')
      .eq('documento', documento)
      .eq('tipo', tipo)
      .gte('data_consulta', vinteQuatroHorasAtras.toISOString())
      .order('data_consulta', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      // Se for erro de tabela não existir, permite a consulta
      console.warn('Erro ao verificar consultas recentes:', error);
      return { podeConsultar: true, ultimaConsulta: null };
    }

    if (data) {
      return { 
        podeConsultar: false, 
        ultimaConsulta: data.data_consulta 
      };
    }

    return { podeConsultar: true, ultimaConsulta: null };
  } catch (error) {
    console.error('Erro ao verificar consulta recente:', error);
    // Em caso de erro, permite a consulta para não bloquear o sistema
    return { podeConsultar: true, ultimaConsulta: null };
  }
}

/**
 * Registra uma consulta no banco de dados
 */
async function registrarConsulta(documento: string, tipo: string, userId?: string) {
  if (!supabase) return;

  try {
    await supabase
      .from('bigdata_consultas')
      .insert({
        documento,
        tipo,
        user_id: userId || null,
        data_consulta: new Date().toISOString()
      });
  } catch (error) {
    // Não bloqueia a consulta se falhar ao registrar
    console.error('Erro ao registrar consulta:', error);
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cnpj = searchParams.get('cnpj');
  const cpf = searchParams.get('cpf'); // Para buscar processos por CPF ou dados de pessoa física
  const tipo = searchParams.get('tipo'); // 'completo', 'qsa', 'enderecos', 'telefones', 'emails', 'processos', 'pessoa_fisica'

  // Processos e pessoa_fisica precisam de CPF, outros dados precisam de CNPJ
  let documento: string;
  if (tipo === 'processos' || tipo === 'pessoa_fisica') {
    if (!cpf) {
      return NextResponse.json({ error: 'CPF não fornecido' }, { status: 400 });
    }
    documento = cpf.replace(/\D/g, '');
    // Validação básica de CPF
    if (documento.length !== 11) {
      return NextResponse.json({ error: 'CPF inválido. Deve ter 11 dígitos.' }, { status: 400 });
    }
  } else {
    if (!cnpj) {
      return NextResponse.json({ error: 'CNPJ não fornecido' }, { status: 400 });
    }
    documento = cnpj.replace(/\D/g, '');
    // Validação básica de CNPJ
    if (documento.length !== 14) {
      return NextResponse.json({ error: 'CNPJ inválido. Deve ter 14 dígitos.' }, { status: 400 });
    }
  }

  // Verifica se já foi consultado nas últimas 24h
  const { podeConsultar, ultimaConsulta } = await verificarConsultaRecente(documento, tipo);
  
  if (!podeConsultar && ultimaConsulta) {
    const dataUltimaConsulta = new Date(ultimaConsulta);
    const horasDesdeUltimaConsulta = Math.floor((Date.now() - dataUltimaConsulta.getTime()) / (1000 * 60 * 60));
    const minutosRestantes = 24 - horasDesdeUltimaConsulta;
    
    return NextResponse.json({
      error: `Este ${documento.length === 11 ? 'CPF' : 'CNPJ'} já foi consultado há ${horasDesdeUltimaConsulta} hora(s). Aguarde ${minutosRestantes} hora(s) antes de consultar novamente.`,
      ultima_consulta: ultimaConsulta,
      bloqueado: true
    }, { status: 429 }); // 429 = Too Many Requests
  }

  const accessToken = process.env.BIGDATA_ACCESS_TOKEN || '';
  const tokenId = process.env.BIGDATA_TOKEN_ID || '';

  if (!accessToken || !tokenId) {
    console.warn('BigData API não configurada');
    return NextResponse.json({
      error: 'API BigData não configurada. Configure BIGDATA_ACCESS_TOKEN e BIGDATA_TOKEN_ID nas variáveis de ambiente.',
      mock: false
    }, { status: 503 });
  }

  // Tenta obter o user_id do header (se disponível)
  // Nota: Em rotas de API, geralmente não temos acesso direto ao usuário autenticado
  // O user_id será null se não for possível obter
  let userId: string | undefined;

  try {
    // Busca dados de pessoa física por CPF
    if (tipo === 'pessoa_fisica') {
      const cpfLimpo = documento;
      const pessoaData = await fetchBigDataPessoaFisica(cpfLimpo, accessToken, tokenId);
      
      if (!pessoaData) {
        throw new Error('Dados da pessoa física não encontrados');
      }

      const converted = convertPessoaFisicaToOurFormat(pessoaData);
      
      // Registra a consulta após sucesso
      await registrarConsulta(documento, tipo, userId);
      
      return NextResponse.json(converted);
    }
    
    // Busca processos por CPF
    if (tipo === 'processos') {
      const cpfLimpo = documento;
      const processosData = await fetchBigDataProcessos(cpfLimpo, accessToken, tokenId);
      
      if (!processosData) {
        throw new Error('Dados de processos não encontrados');
      }

      const converted = convertProcessosToOurFormat(processosData);
      
      // Registra a consulta após sucesso
      await registrarConsulta(documento, tipo, userId);
      
      return NextResponse.json(converted);
    }
    
    const cnpjLimpo = documento;
    
    // Se for para buscar QSA, usa endpoint específico
    if (tipo === 'qsa') {
      const qsaData = await fetchBigDataQSA(cnpjLimpo, accessToken, tokenId);
      
      if (!qsaData) {
        throw new Error('Dados QSA não encontrados');
      }

      const converted = convertQSAToOurFormat(qsaData);
      
      // Registra a consulta após sucesso
      await registrarConsulta(documento, tipo, userId);
      
      return NextResponse.json(converted);
    }
    
    // Se for para buscar dados básicos (formato CNPJWS), retorna dados básicos
    if (tipo === 'basico' || tipo === 'completo_basico') {
      const registrationData = await fetchBigDataRegistration(cnpjLimpo, accessToken, tokenId);
      
      if (!registrationData) {
        throw new Error('Dados não encontrados');
      }

      const basicData = extractBasicDataFromBigData(registrationData);
      
      if (!basicData) {
        throw new Error('Dados básicos não encontrados');
      }

      // Registra a consulta após sucesso
      await registrarConsulta(documento, tipo, userId);

      return NextResponse.json(basicData);
    }
    
    // Para outros dados, busca registration_data
    const registrationData = await fetchBigDataRegistration(cnpjLimpo, accessToken, tokenId);
    
    if (!registrationData) {
      throw new Error('Dados não encontrados');
    }

    // Converte o formato da BigData para nosso formato
    const converted = convertBigDataToOurFormat(registrationData, tipo);
    
    // Registra a consulta após sucesso
    await registrarConsulta(documento, tipo, userId);
    
    return NextResponse.json(converted);
    
  } catch (error) {
    console.error('Erro ao buscar dados da BigData:', error);
    
    // Em caso de erro, retorna erro ao invés de dados mock
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar dados da API BigData',
      mock: false
    }, { status: 500 });
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

/**
 * Extrai dados básicos da BigData no mesmo formato que o CNPJWS retorna
 * Compatível com normalizeCnpjWsResponse()
 */
function extractBasicDataFromBigData(bigDataResult: any) {
  const registrationData = bigDataResult.RegistrationData;
  const basicData = registrationData?.BasicData;
  
  if (!basicData) {
    return null;
  }

  // Atividade principal (onde IsMain = true)
  const atividadePrincipal = basicData.Activities?.find((a: any) => a.IsMain === true);
  
  // Atividades secundárias (onde IsMain = false)
  const atividadesSecundarias = basicData.Activities?.filter((a: any) => a.IsMain === false) || [];

  // Endereço primário
  const enderecoPrimario = registrationData?.Addresses?.Primary;
  
  // Telefone primário
  const telefonePrimario = registrationData?.Phones?.Primary;
  
  // Email primário
  const emailPrimario = registrationData?.Emails?.Primary;

  // Monta endereço completo
  const enderecoCompleto = enderecoPrimario ? [
    enderecoPrimario.Typology,
    enderecoPrimario.AddressMain,
    enderecoPrimario.Number,
    enderecoPrimario.Complement,
    enderecoPrimario.Neighborhood,
    enderecoPrimario.City,
    enderecoPrimario.State,
    enderecoPrimario.ZipCode ? enderecoPrimario.ZipCode.replace(/(\d{5})(\d{3})/, '$1-$2') : ''
  ].filter(Boolean).join(', ') : '';

  // Formata telefone
  const telefoneFormatado = telefonePrimario 
    ? `(${telefonePrimario.AreaCode}) ${telefonePrimario.Number}`
    : '';

  // Capital social (mantém como string, como no CNPJWS)
  const capitalSocial = basicData.AdditionalOutputData?.CapitalRS || '';

  // Porte - não está disponível diretamente, mas pode ser inferido do capital
  // Vou deixar vazio por enquanto, mas poderia inferir:
  // - Micro: até 360.000
  // - Pequena: até 4.800.000
  // - Média: até 300.000.000
  // - Grande: acima
  let porte = '';
  if (basicData.AdditionalOutputData?.CapitalRS) {
    const capital = parseFloat(basicData.AdditionalOutputData.CapitalRS);
    if (capital <= 360000) porte = 'MICRO EMPRESA';
    else if (capital <= 4800000) porte = 'PEQUENO PORTE';
    else if (capital <= 300000000) porte = 'MEDIO PORTE';
    else porte = 'GRANDE PORTE';
  }

  // Formata data de abertura
  const dataAbertura = basicData.FoundedDate 
    ? new Date(basicData.FoundedDate).toISOString().split('T')[0]
    : '';

  return {
    razao_social: basicData.OfficialName || '',
    nome_fantasia: basicData.TradeName || '',
    situacao: basicData.TaxIdStatus || '',
    telefone: telefoneFormatado,
    email: emailPrimario?.EmailAddress || '',
    endereco: enderecoCompleto,
    // Campos individuais do endereço
    tipo_logradouro: enderecoPrimario?.Typology || '',
    logradouro: enderecoPrimario?.AddressMain || '',
    numero: enderecoPrimario?.Number || '',
    complemento: enderecoPrimario?.Complement || '',
    bairro: enderecoPrimario?.Neighborhood || '',
    cep: enderecoPrimario?.ZipCode ? enderecoPrimario.ZipCode.replace(/(\d{5})(\d{3})/, '$1-$2') : '',
    cidade: enderecoPrimario?.City || '',
    uf: enderecoPrimario?.State || '',
    // Outros dados
    porte: porte,
    natureza_juridica: basicData.LegalNature?.Activity || '',
    data_abertura: dataAbertura,
    capital_social: capitalSocial,
    // Atividades
    atividade_principal_codigo: atividadePrincipal?.Code || '',
    atividade_principal_descricao: atividadePrincipal?.Activity || '',
    atividades_secundarias: atividadesSecundarias
      .map((a: any) => `${a.Code} - ${a.Activity}`)
      .join('; ') || '',
    // Simples Nacional
    simples_nacional: basicData.TaxRegimes?.Simples || false,
  };
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

async function fetchBigDataProcessos(cpf: string, accessToken: string, tokenId: string) {
  const url = 'https://plataforma.bigdatacorp.com.br/pessoas';
  
  const requestBody = {
    Datasets: 'lawsuits_distribution_data',
    q: `doc{${cpf}}`,
    Limit: 1
  };

  console.log('⚖️ Buscando processos judiciais do CPF:', cpf);

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

    console.log('📊 Resposta BigData (processos):', response.status);

    if (!response.ok) {
      console.error('❌ Erro HTTP:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.Status?.lawsuits_distribution_data?.[0]?.Code === 0 && data.Result?.[0]) {
      console.log('✅ Dados de processos recebidos');
      return data.Result[0];
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erro ao chamar BigData Processos:', error);
    return null;
  }
}

async function fetchBigDataPessoaFisica(cpf: string, accessToken: string, tokenId: string) {
  const url = 'https://plataforma.bigdatacorp.com.br/pessoas';
  
  const requestBody = {
    Datasets: 'registration_data',
    q: `doc{${cpf}}`,
    Limit: 1
  };

  console.log('👤 Buscando dados da pessoa física (CPF):', cpf);

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

    console.log('📊 Resposta BigData (pessoa física):', response.status);

    if (!response.ok) {
      console.error('❌ Erro HTTP:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.Status?.registration_data?.[0]?.Code === 0 && data.Result?.[0]) {
      console.log('✅ Dados da pessoa física recebidos');
      return data.Result[0];
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erro ao chamar BigData Pessoa Física:', error);
    return null;
  }
}

function convertPessoaFisicaToOurFormat(pessoaResult: any) {
  const registrationData = pessoaResult.RegistrationData;
  const basicData = registrationData?.BasicData;
  
  if (!basicData) {
    return {
      dados_basicos: null,
      enderecos: [],
      telefones: [],
      emails: []
    };
  }

  // Extrai dados básicos
  const dadosBasicos = {
    nome: basicData.Name || '',
    nome_mae: basicData.MotherName || '',
    data_nascimento: basicData.BirthDate 
      ? new Date(basicData.BirthDate).toISOString().split('T')[0]
      : '',
    genero: basicData.Gender || '',
    cpf_status: basicData.TaxIdStatus || '',
    cpf_status_date: basicData.TaxIdStatusDate 
      ? new Date(basicData.TaxIdStatusDate).toISOString().split('T')[0]
      : ''
  };

  // Extrai endereços
  const enderecos = [];
  if (registrationData?.Addresses?.Primary) {
    const addr = registrationData.Addresses.Primary;
    enderecos.push({
      endereco: `${addr.Typology || ''} ${addr.AddressMain || ''}, ${addr.Number || ''}, ${addr.Complement || ''}, ${addr.Neighborhood || ''}`.trim().replace(/^,\s*/, ''),
      tipo: addr.Type === 'HOME' ? 'residencial' : 'comercial',
      cep: addr.ZipCode?.replace(/(\d{5})(\d{3})/, '$1-$2') || '',
      cidade: addr.City || '',
      estado: addr.State || '',
      principal: true
    });
  }

  if (registrationData?.Addresses?.Secondary) {
    const addr = registrationData.Addresses.Secondary;
    enderecos.push({
      endereco: `${addr.Typology || ''} ${addr.AddressMain || ''}, ${addr.Number || ''}, ${addr.Complement || ''}, ${addr.Neighborhood || ''}`.trim().replace(/^,\s*/, ''),
      tipo: addr.Type === 'HOME' ? 'residencial' : 'comercial',
      cep: addr.ZipCode?.replace(/(\d{5})(\d{3})/, '$1-$2') || '',
      cidade: addr.City || '',
      estado: addr.State || '',
      principal: false
    });
  }

  // Extrai telefones
  const telefones = [];
  if (registrationData?.Phones?.Primary && registrationData.Phones.Primary.AreaCode) {
    const phone = registrationData.Phones.Primary;
    telefones.push({
      telefone: `(${phone.AreaCode}) ${phone.Number}`,
      tipo: phone.Type === 'MOBILE' ? 'celular' : phone.Type === 'WORK' ? 'comercial' : 'fixo',
      nome_contato: '',
      principal: true
    });
  }

  if (registrationData?.Phones?.Secondary && registrationData.Phones.Secondary.AreaCode) {
    const phone = registrationData.Phones.Secondary;
    telefones.push({
      telefone: `(${phone.AreaCode}) ${phone.Number}`,
      tipo: phone.Type === 'MOBILE' ? 'celular' : phone.Type === 'WORK' ? 'comercial' : 'fixo',
      nome_contato: '',
      principal: false
    });
  }

  // Extrai emails
  const emails = [];
  if (registrationData?.Emails?.Primary?.EmailAddress) {
    const email = registrationData.Emails.Primary;
    emails.push({
      email: email.EmailAddress,
      tipo: email.Type === 'corporate' ? 'comercial' : 'pessoal',
      nome_contato: '',
      principal: true
    });
  }

  if (registrationData?.Emails?.Secondary?.EmailAddress) {
    const email = registrationData.Emails.Secondary;
    emails.push({
      email: email.EmailAddress,
      tipo: email.Type === 'corporate' ? 'comercial' : 'pessoal',
      nome_contato: '',
      principal: false
    });
  }

  return {
    dados_basicos: dadosBasicos,
    enderecos,
    telefones,
    emails
  };
}

function convertProcessosToOurFormat(processosResult: any) {
  const processos = [];
  
  if (!processosResult?.LawsuitsDistributionData) {
    return [];
  }

  const distData = processosResult.LawsuitsDistributionData;
  const totalProcessos = distData.TotalLawsuits || 0;

  // Se não houver processos, retorna array vazio
  if (totalProcessos === 0) {
    return [];
  }

  // Como a API retorna estatísticas agregadas e não processos individuais,
  // vamos criar um texto formatado com todas as informações disponíveis
  const observacoes = [];
  
  observacoes.push(`TOTAL DE PROCESSOS: ${totalProcessos}`);

  // Tipo de procedimento
  if (distData.TypeDistribution && Object.keys(distData.TypeDistribution).length > 0) {
    observacoes.push('\nTIPOS DE PROCEDIMENTO:');
    for (const [tipo, count] of Object.entries(distData.TypeDistribution)) {
      observacoes.push(`  - ${tipo}: ${count}`);
    }
  }

  // Tribunais
  if (distData.CourtNameDistribution && Object.keys(distData.CourtNameDistribution).length > 0) {
    observacoes.push('\nTRIBUNAIS:');
    for (const [tribunal, count] of Object.entries(distData.CourtNameDistribution)) {
      observacoes.push(`  - ${tribunal}: ${count}`);
    }
  }

  // Status
  if (distData.StatusDistribution && Object.keys(distData.StatusDistribution).length > 0) {
    observacoes.push('\nSTATUS:');
    for (const [status, count] of Object.entries(distData.StatusDistribution)) {
      observacoes.push(`  - ${status}: ${count}`);
    }
  }

  // Estados
  if (distData.StateDistribution && Object.keys(distData.StateDistribution).length > 0) {
    observacoes.push('\nESTADOS:');
    for (const [estado, count] of Object.entries(distData.StateDistribution)) {
      observacoes.push(`  - ${estado}: ${count}`);
    }
  }

  // Tipo de parte
  if (distData.PartyTypeDistribution && Object.keys(distData.PartyTypeDistribution).length > 0) {
    observacoes.push('\nTIPO DE PARTE:');
    for (const [tipo, count] of Object.entries(distData.PartyTypeDistribution)) {
      observacoes.push(`  - ${tipo === 'AUTHOR' ? 'AUTOR' : tipo === 'DEFENDANT' ? 'RÉU' : tipo}: ${count}`);
    }
  }

  // Assuntos CNJ
  if (distData.CnjSubjectDistribution && Object.keys(distData.CnjSubjectDistribution).length > 0) {
    observacoes.push('\nASSUNTOS (CNJ):');
    for (const [assunto, count] of Object.entries(distData.CnjSubjectDistribution)) {
      observacoes.push(`  - ${assunto}: ${count}`);
    }
  }

  // Cria um processo único com todas as informações agregadas
  processos.push({
    numero_processo: `RESUMO-${totalProcessos}-PROCESSOS`,
    tribunal: Object.keys(distData.CourtNameDistribution || {})[0] || 'NÃO INFORMADO',
    vara: distData.CourtTypeDistribution ? Object.keys(distData.CourtTypeDistribution)[0] : null,
    tipo_acao: distData.TypeDistribution ? Object.keys(distData.TypeDistribution)[0] : null,
    valor_causa: null,
    data_distribuicao: null,
    status: distData.StatusDistribution ? Object.keys(distData.StatusDistribution)[0] : null,
    parte_contraria: null,
    observacoes: observacoes.join('\n'),
    link_processo: null
  });

  console.log(`✅ ${totalProcessos} processos encontrados (resumo criado)`);
  
  return processos;
}


