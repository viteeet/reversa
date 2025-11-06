import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function tryFetch(url: string, options: RequestInit = {}, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal, cache: 'no-store' });
    clearTimeout(id);
    return { ok: res.ok, status: res.status };
  } catch (e) {
    clearTimeout(id);
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, status: 0, error: msg } as const;
  }
}

export async function GET() {
  const token = process.env.CNPJWS_TOKEN || '';
  const nodeVersion = process.version;
  const region = process.env.VERCEL_REGION || process.env.FLY_REGION || process.env.AWS_REGION || 'unknown';
  const env = process.env.NODE_ENV;

  // Lightweight connectivity checks
  const publicCheck = await tryFetch('https://publica.cnpj.ws/cnpj/26766504000100', {
    headers: { 'Accept': 'application/json', 'User-Agent': 'ReversaDiag/1.0' },
    method: 'GET'
  }, 4000);

  const privateCheck = token
    ? await tryFetch('https://api.cnpj.ws/cnpj/26766504000100', {
        headers: { 'Accept': 'application/json', 'Authorization': token, 'User-Agent': 'ReversaDiag/1.0' },
        method: 'GET'
      }, 4000)
    : { ok: false, status: 0 };

  return NextResponse.json({
    hasToken: !!token,
    tokenLength: token.length || 0,
    nodeVersion,
    region,
    env,
    checks: {
      publica: publicCheck,
      apiComToken: privateCheck
    }
  });
}
