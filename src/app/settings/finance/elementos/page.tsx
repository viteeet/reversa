'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

type Elem = { id: string; nome: string; descricao: string | null };

export default function ElementosPage() {
  const [items, setItems] = useState<Elem[]>([]);
  const [form, setForm] = useState({ nome: '', descricao: '' });
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { load(); }, []);
  async function load() {
    const { data, error } = await supabase
      .from('elementos')
      .select('id, nome, descricao')
      .order('nome');
    if (error) setErr(error.message);
    setItems((data ?? []) as Elem[]);
  }
  async function add() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr('Não autenticado'); return; }
    const { error } = await supabase.from('elementos').insert({ user_id: user.id, nome: form.nome.trim(), descricao: form.descricao || null });
    if (error) { setErr(error.message); return; }
    setForm({ nome: '', descricao: '' });
    await load();
  }
  async function remove(id: string) {
    const { error } = await supabase.from('elementos').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    await load();
  }
  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="container max-w-4xl space-y-4">
        <PageHeader
          title="Elementos"
          subtitle="Gerenciamento de elementos financeiros"
          backHref="/settings/finance"
        />
        <div className="card p-4 grid gap-3 sm:grid-cols-3 items-end">
          <input className="input" placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <input className="input" placeholder="Descrição" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          <button className="btn btn-primary" onClick={add}>Adicionar</button>
          {err && <p className="text-sm text-red-600 sm:col-span-3">{err}</p>}
        </div>
        <div className="card p-0 overflow-x-auto">
          {items.length === 0 ? (
            <EmptyState title="Nenhum elemento cadastrado" className="p-6" />
          ) : (
            <table className="table">
              <thead><tr><th>Nome</th><th>Descricao</th><th className="w-24">Acoes</th></tr></thead>
              <tbody>
                {items.map(e => (
                  <tr key={e.id}>
                    <td>{e.nome}</td>
                    <td>{e.descricao ?? '—'}</td>
                    <td><button className="btn h-8 px-2" onClick={() => remove(e.id)}>Excluir</button></td>
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


