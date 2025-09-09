'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Cat = { id: string; nome: string; natureza: 'receita'|'despesa'; cor: string | null; ordem: number | null };

export default function CategoriasPage() {
  const [items, setItems] = useState<Cat[]>([]);
  const [form, setForm] = useState({ nome: '', natureza: 'despesa' as 'receita'|'despesa', cor: '#4180ab', ordem: '' });
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data, error } = await supabase.from('categorias').select('id, nome, natureza, cor, ordem').order('ordem').order('nome');
    if (error) setErr(error.message);
    setItems((data as any) ?? []);
  }

  async function add() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr('Não autenticado'); return; }
    const { error } = await supabase.from('categorias').insert({
      user_id: user.id,
      nome: form.nome.trim(),
      natureza: form.natureza,
      cor: form.cor || null,
      ordem: form.ordem ? Number(form.ordem) : null,
    });
    if (error) { setErr(error.message); return; }
    setForm({ nome: '', natureza: 'despesa', cor: '#4180ab', ordem: '' });
    await load();
  }

  async function remove(id: string) {
    const { error } = await supabase.from('categorias').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    await load();
  }

  return (
    <main className="min-h-screen p-6">
      <div className="container max-w-4xl space-y-4">
        <h1 className="text-2xl font-semibold">Categorias</h1>

        <div className="card p-4 grid gap-3 sm:grid-cols-4 items-end">
          <input className="input" placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <select className="select" value={form.natureza} onChange={(e) => setForm({ ...form, natureza: e.target.value as any })}>
            <option value="despesa">Despesa</option>
            <option value="receita">Receita</option>
          </select>
          <input className="input" type="color" value={form.cor} onChange={(e) => setForm({ ...form, cor: e.target.value })} />
          <input className="input" placeholder="Ordem" value={form.ordem} onChange={(e) => setForm({ ...form, ordem: e.target.value })} />
          <button className="btn btn-primary" onClick={add}>Adicionar</button>
          {err && <p className="text-sm text-red-600 sm:col-span-4">{err}</p>}
        </div>

        <div className="card p-0 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Natureza</th>
                <th>Cor</th>
                <th>Ordem</th>
                <th className="w-24">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={5} className="p-3 muted">Nenhuma categoria.</td></tr>
              ) : items.map(c => (
                <tr key={c.id}>
                  <td>{c.nome}</td>
                  <td>{c.natureza}</td>
                  <td>
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full" style={{ background: c.cor ?? '#cdb89a' }} />
                      {c.cor ?? '—'}
                    </span>
                  </td>
                  <td>{c.ordem ?? '—'}</td>
                  <td><button className="btn h-8 px-2" onClick={() => remove(c.id)}>Excluir</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}


