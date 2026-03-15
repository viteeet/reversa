'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

type Meio = { id: string; nome: string };

export default function MeiosPage() {
  const [items, setItems] = useState<Meio[]>([]);
  const [nome, setNome] = useState('');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { load(); }, []);
  async function load() {
    const { data, error } = await supabase
      .from('meios_pagamento')
      .select('id, nome')
      .order('nome');
    if (error) setErr(error.message);
    setItems((data ?? []) as Meio[]);
  }
  async function add() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr('Não autenticado'); return; }
    const { error } = await supabase.from('meios_pagamento').insert({ user_id: user.id, nome: nome.trim() });
    if (error) { setErr(error.message); return; }
    setNome('');
    await load();
  }
  async function remove(id: string) {
    const { error } = await supabase.from('meios_pagamento').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    await load();
  }
  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="container max-w-4xl space-y-4">
        <PageHeader
          title="Meios de Pagamento"
          subtitle="Gerenciamento de meios de pagamento"
          backHref="/settings/finance"
        />
        <div className="card p-4 grid gap-3 sm:grid-cols-[1fr_auto] items-end">
          <input className="input" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          <button className="btn btn-primary" onClick={add}>Adicionar</button>
          {err && <p className="text-sm text-red-600 sm:col-span-2">{err}</p>}
        </div>
        <div className="card p-0 overflow-x-auto">
          {items.length === 0 ? (
            <EmptyState title="Nenhum meio de pagamento cadastrado" className="p-6" />
          ) : (
            <table className="table">
              <thead><tr><th>Nome</th><th className="w-24">Acoes</th></tr></thead>
              <tbody>
                {items.map(m => (
                  <tr key={m.id}>
                    <td>{m.nome}</td>
                    <td><button className="btn h-8 px-2" onClick={() => remove(m.id)}>Excluir</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}


