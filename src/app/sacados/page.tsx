'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Sacado = {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  grupo: string | null;
};

export default function SacadosPage() {
  const router = useRouter();
  const [items, setItems] = useState<Sacado[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace('/login');

      setLoading(true);
      const { data, error } = await supabase
        .from('sacados')
        .select('cnpj, razao_social, nome_fantasia, grupo')
        .order('razao_social', { ascending: true });
      if (error) console.error(error);
      setItems(data ?? []);
      setLoading(false);
    })();
  }, [router]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter(s =>
      [s.cnpj, s.razao_social, s.nome_fantasia ?? '', s.grupo ?? '']
        .some(v => v.toLowerCase().includes(t))
    );
  }, [items, q]);

  return (
    <main className="min-h-screen p-6">
      <div className="container max-w-5xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Sacados</h1>
          <Link href="/sacados/new" className="btn btn-primary">Cadastrar novo sacado</Link>
        </header>

        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por CPF/CNPJ, razão social, grupo..."
            className="input"
          />
          <button onClick={() => setQ('')} className="btn">Limpar</button>
        </div>

        {loading ? (
          <p className="muted">Carregando...</p>
        ) : filtered.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="mb-2">Nenhum sacado encontrado.</p>
            <Link href="/sacados/new" className="btn btn-primary">Cadastrar primeiro sacado</Link>
          </div>
        ) : (
          <div className="overflow-x-auto card">
            <table className="table">
              <thead>
                <tr>
                  <th>CNPJ</th>
                  <th>Razão social</th>
                  <th>Fantasia</th>
                  <th>Grupo</th>
                  <th className="w-32">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.cnpj}>
                    <td>{s.cnpj}</td>
                    <td>{s.razao_social}</td>
                    <td>{s.nome_fantasia ?? '—'}</td>
                    <td>{s.grupo ?? '—'}</td>
                    <td>
                      <Link href={`/sacados/${encodeURIComponent(s.cnpj)}`} className="btn btn-ghost h-8 px-2">
                        Consultar/Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
