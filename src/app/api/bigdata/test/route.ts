import { NextResponse } from 'next/server';

/**
 * Endpoint de teste para verificar se a API BigData está configurada
 * GET /api/bigdata/test
 */
export async function GET() {
  const accessToken = process.env.BIGDATA_ACCESS_TOKEN || '';
  const tokenId = process.env.BIGDATA_TOKEN_ID || '';

  const status = {
    configurada: false,
    accessToken: {
      definido: !!accessToken,
      tamanho: accessToken.length,
      prefixo: accessToken.substring(0, 20) + '...'
    },
    tokenId: {
      definido: !!tokenId,
      valor: tokenId || 'não definido'
    },
    testeConexao: null as { sucesso: boolean; mensagem: string; dados?: any } | null
  };

  if (!accessToken || !tokenId) {
    return NextResponse.json({
      ...status,
      mensagem: 'API BigData NÃO está configurada. Configure BIGDATA_ACCESS_TOKEN e BIGDATA_TOKEN_ID no .env.local'
    }, { status: 503 });
  }

  status.configurada = true;

  // Testa a conexão com a API usando um CNPJ conhecido
  try {
    const cnpjTeste = '27281399000182'; // CNPJ de teste conhecido
    const url = 'https://plataforma.bigdatacorp.com.br/empresas';
    
    const requestBody = {
      Datasets: 'registration_data',
      q: `doc{${cnpjTeste}}`,
      Limit: 1
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'AccessToken': accessToken,
        'TokenId': tokenId
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(10000) // 10 segundos de timeout
    });

    if (!response.ok) {
      status.testeConexao = {
        sucesso: false,
        mensagem: `Erro HTTP ${response.status}: ${response.statusText}`
      };
    } else {
      const data = await response.json();
      
      if (data.Status?.registration_data?.[0]?.Code === 0 && data.Result?.[0]) {
        status.testeConexao = {
          sucesso: true,
          mensagem: 'Conexão com API BigData OK!',
          dados: {
            cnpj: cnpjTeste,
            empresaEncontrada: !!data.Result[0],
            temEnderecos: !!data.Result[0]?.RegistrationData?.Addresses,
            temTelefones: !!data.Result[0]?.RegistrationData?.Phones,
            temEmails: !!data.Result[0]?.RegistrationData?.Emails
          }
        };
      } else {
        status.testeConexao = {
          sucesso: false,
          mensagem: 'API respondeu, mas não retornou dados válidos',
          dados: data.Status || data
        };
      }
    }
  } catch (error: any) {
    status.testeConexao = {
      sucesso: false,
      mensagem: error.message || 'Erro ao testar conexão',
      dados: error.name === 'AbortError' ? 'Timeout na requisição' : undefined
    };
  }

  return NextResponse.json({
    ...status,
    mensagem: status.configurada 
      ? (status.testeConexao?.sucesso ? 'API BigData configurada e funcionando!' : 'API configurada, mas teste falhou')
      : 'API não configurada'
  });
}

