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

    // Preferencial: API comercial com token; fallback: API pública sem token
    async function fetchComToken() {
      const url = `https://api.cnpj.ws/cnpj/${cnpj}`;
      // Tentativa 1: Token token=...
      let res = await fetch(url, {
        headers: { Authorization: `Token token=${token}`, Accept: 'application/json' },
        cache: 'no-store',
      });
      if (res.status === 401 || res.status === 403) {
        // Tentativa 2: Bearer
        res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          cache: 'no-store',
        });
      }
      return res;
    }

    const res = token ? await fetchComToken() : await fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`, { cache: 'no-store' });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: 'Erro CNPJ.ws', details: text }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro inesperado';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


