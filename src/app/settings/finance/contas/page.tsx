'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

type Conta = { id: string; nome: string; tipo: string; saldo_inicial: number };

export default function ContasPage() {
  const [items, setItems] = useState<Conta[]>([]);
  const [form, setForm] = useState({ nome: '', tipo: 'conta_corrente', saldo_inicial: '0' });
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data, error } = await supabase
      .from('contas_financeiras')
      .select('id, nome, tipo, saldo_inicial')
      .order('nome');
    if (error) setErr(error.message);
    setItems((data ?? []) as Conta[]);
  }

  async function add() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr('Não autenticado'); return; }
    const { error } = await supabase.from('contas_financeiras').insert({
      user_id: user.id,
      nome: form.nome.trim(),
      tipo: form.tipo,
      saldo_inicial: Number(form.saldo_inicial || 0),
    });
    if (error) { setErr(error.message); return; }
    setForm({ nome: '', tipo: 'conta_corrente', saldo_inicial: '0' });
    await load();
  }

  async function remove(id: string) {
    const { error } = await supabase.from('contas_financeiras').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    await load();
  }

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="container max-w-4xl space-y-4">
        <PageHeader
          title="Contas Financeiras"
          subtitle="Gerenciamento de contas financeiras"
          backHref="/settings/finance"
        />

        <div className="card p-4 grid gap-3 sm:grid-cols-3 items-end">
          <div>
            <label className="block text-sm muted">Nome</label>
            <input className="input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm muted">Tipo</label>
            <select className="select" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              {['conta_corrente','cartao','carteira','outro'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm muted">Saldo inicial</label>
            <input className="input" value={form.saldo_inicial} onChange={(e) => setForm({ ...form, saldo_inicial: e.target.value })} />
          </div>
          <button className="btn btn-primary" onClick={add}>Adicionar</button>
          {err && <p className="text-sm text-red-600 sm:col-span-3">{err}</p>}
        </div>

        <div className="card p-0 overflow-x-auto">
          {items.length === 0 ? (
            <EmptyState title="Nenhuma conta cadastrada" className="p-6" />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Saldo inicial</th>
                  <th className="w-24">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {items.map(c => (
                  <tr key={c.id}>
                    <td>{c.nome}</td>
                    <td>{c.tipo}</td>
                    <td>{c.saldo_inicial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td><button className="btn h-8 px-2" onClick={() => remove(c.id)}>Excluir</button></td>
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


