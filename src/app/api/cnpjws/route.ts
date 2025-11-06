import { NextResponse } from 'next/server';

function onlyDigits(value: string): string {
  return (value || '').replace(/\D+/g, '');
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
    
    console.log('[CNPJWS API] CNPJ:', cnpj);
    console.log('[CNPJWS API] Token exists:', !!token);
    console.log('[CNPJWS API] Token length:', token.length);

    // Preferencial: API comercial com token; fallback: API pública sem token
    async function fetchComToken() {
      const url = `https://api.cnpj.ws/cnpj/${cnpj}`;
      console.log('[CNPJWS API] Usando API com token:', url);
      
      // Tentativa 1: Token token=...
      let res = await fetch(url, {
        headers: { Authorization: `Token token=${token}`, Accept: 'application/json' },
        cache: 'no-store',
      });
      
      console.log('[CNPJWS API] Resposta (Token token=...):', res.status);
      
      if (res.status === 401 || res.status === 403) {
        console.log('[CNPJWS API] Tentando Bearer...');
        // Tentativa 2: Bearer
        res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          cache: 'no-store',
        });
        console.log('[CNPJWS API] Resposta (Bearer):', res.status);
      }
      return res;
    }

    const res = token 
      ? await fetchComToken() 
      : await fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`, { cache: 'no-store' });

    console.log('[CNPJWS API] Status final:', res.status);

    if (!res.ok) {
      const text = await res.text();
      console.error('[CNPJWS API] Erro:', text);
      return NextResponse.json({ 
        error: 'Erro CNPJ.ws', 
        details: text,
        status: res.status,
        hasToken: !!token 
      }, { status: res.status });
    }
    
    const data = await res.json();
    console.log('[CNPJWS API] Sucesso!');
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro inesperado';
    const stack = e instanceof Error ? e.stack : '';
    console.error('[CNPJWS API] Exception:', msg, stack);
    return NextResponse.json({ 
      error: msg, 
      stack: process.env.NODE_ENV === 'development' ? stack : undefined 
    }, { status: 500 });
  }
}


