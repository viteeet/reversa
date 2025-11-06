import { NextResponse } from 'next/server';

// Ensure Node.js runtime on Vercel and disable caching/static optimization
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function onlyDigits(value: string): string {
  return (value || '').replace(/\D+/g, '');
}

// Função helper para fetch com timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cnpjParam = searchParams.get('cnpj') || '';
    const cnpj = onlyDigits(cnpjParam);
    if (!cnpj) {
      return NextResponse.json({ error: 'cnpj requerido' }, { status: 400 });
    }

  const token = process.env.CNPJWS_TOKEN || '';
  const forcePublic = (process.env.CNPJWS_FORCE_PUBLIC || '').toLowerCase() === 'true' || process.env.CNPJWS_FORCE_PUBLIC === '1';
    
    console.log('[CNPJWS API] CNPJ:', cnpj);
    console.log('[CNPJWS API] Token exists:', !!token);
    console.log('[CNPJWS API] Token length:', token.length);

    // Preferencial: API comercial com token; fallback: API pública sem token
    async function fetchComToken() {
      const url = `https://api.cnpj.ws/cnpj/${cnpj}`;
      console.log('[CNPJWS API] Usando API com token:', url);
      
      // Segundo a documentação CNPJ.ws, o token vai direto na Authorization
      let res = await fetchWithTimeout(url, {
        headers: { 
          'Authorization': token,
          'Accept': 'application/json',
          'User-Agent': 'ReversaApp/1.0 (+https://reversa.vercel.app)'
        },
        cache: 'no-store',
      }, 20000); // 20 segundos de timeout
      
      console.log('[CNPJWS API] Resposta (token direto):', res.status);
      
      // Se falhar, tenta com Bearer
      if (res.status === 401 || res.status === 403) {
        console.log('[CNPJWS API] Tentando Bearer...');
        res = await fetchWithTimeout(url, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'User-Agent': 'ReversaApp/1.0 (+https://reversa.vercel.app)'
          },
          cache: 'no-store',
        }, 20000);
        console.log('[CNPJWS API] Resposta (Bearer):', res.status);
      }
      
      // Se ainda falhar, tenta Token token=
      if (res.status === 401 || res.status === 403) {
        console.log('[CNPJWS API] Tentando Token token=...');
        res = await fetchWithTimeout(url, {
          headers: { 
            'Authorization': `Token token=${token}`,
            'Accept': 'application/json',
            'User-Agent': 'ReversaApp/1.0 (+https://reversa.vercel.app)'
          },
          cache: 'no-store',
        }, 20000);
        console.log('[CNPJWS API] Resposta (Token token=):', res.status);
      }

      // Tenta cabeçalho X-API-KEY (alguns providers aceitam este formato)
      if (res.status === 401 || res.status === 403) {
        console.log('[CNPJWS API] Tentando X-API-KEY header...');
        res = await fetchWithTimeout(url, {
          headers: {
            'X-API-KEY': token,
            'Accept': 'application/json',
            'User-Agent': 'ReversaApp/1.0 (+https://reversa.vercel.app)'
          },
          cache: 'no-store',
        }, 20000);
        console.log('[CNPJWS API] Resposta (X-API-KEY):', res.status);
      }
      
      return res;
    }

    // Tenta com token (se existir). Se falhar com qualquer status não-ok, faz fallback na pública.
    let res: Response | null = null;
    if (!forcePublic && token) {
      try {
        res = await fetchComToken();
      } catch (err) {
        console.warn('[CNPJWS API] Erro ao usar API com token, tentando pública...', err);
        res = null;
      }
      if (!res || !res.ok) {
        console.log('[CNPJWS API] Fallback para API pública');
        res = await fetchWithTimeout(
          `https://publica.cnpj.ws/cnpj/${cnpj}`,
          { 
            cache: 'no-store',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'ReversaApp/1.0 (+https://reversa.vercel.app)'
            }
          },
          20000
        );
      }
    } else {
      res = await fetchWithTimeout(
        `https://publica.cnpj.ws/cnpj/${cnpj}`,
        { 
          cache: 'no-store',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'ReversaApp/1.0 (+https://reversa.vercel.app)'
          }
        },
        20000
      );
    }

    console.log('[CNPJWS API] Status final:', res.status);

    if (!res.ok) {
      const text = await res.text();
      console.error('[CNPJWS API] Erro:', text);
      return NextResponse.json({ 
        error: 'Erro CNPJ.ws', 
        details: text,
        status: res.status,
        hasToken: !!token,
        forcePublic
      }, { status: res.status });
    }
    
    const data = await res.json();
    console.log('[CNPJWS API] Sucesso!');
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro inesperado';
    const stack = e instanceof Error ? e.stack : '';
    console.error('[CNPJWS API] Exception:', msg, stack);
    
    // Detectar timeout
    if (e instanceof Error && (e.name === 'AbortError' || msg.includes('aborted'))) {
      return NextResponse.json({ 
        error: 'Timeout ao consultar CNPJ.ws - A requisição demorou muito tempo',
        timeout: true
      }, { status: 504 });
    }
    
    return NextResponse.json({ 
      error: msg, 
      stack: process.env.NODE_ENV === 'development' ? stack : undefined 
    }, { status: 500 });
  }
}


