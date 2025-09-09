'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj } from '@/lib/format';

type Cedente = {
  id: string;
  nome: string;
  razao_social: string | null;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
};

export default function CedentesPage() {
  const [items, setItems] = useState<Cedente[]>([]);
  const [form, setForm] = useState({ nome: '', razao_social: '', cnpj: '', telefone: '', email: '', endereco: '' });
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const { data, error } = await supabase
      .from('cedentes')
      .select('id, nome, razao_social, cnpj, telefone, email, endereco')
      .order('nome', { ascending: true });
    if (error) setErr(error.message);
    setItems((data as Cedente[]) ?? []);
  }

  async function add() {
    if (!form.nome.trim()) return;
    setPending(true); setErr(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr('Não autenticado'); setPending(false); return; }
    const { error } = await supabase.from('cedentes').insert({
      user_id: user.id,
      nome: form.nome.trim(),
      razao_social: form.razao_social || null,
      cnpj: form.cnpj ? formatCpfCnpj(form.cnpj) : null,
      telefone: form.telefone || null,
      email: form.email || null,
      endereco: form.endereco || null,
    });
    if (error) setErr(error.message);
    setForm({ nome: '', razao_social: '', cnpj: '', telefone: '', email: '', endereco: '' });
    await load();
    setPending(false);
  }

  async function remove(id: string) {
    const { error } = await supabase.from('cedentes').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    await load();
  }

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter(i => [i.nome, i.razao_social ?? '', i.cnpj ?? '', i.email ?? '', i.telefone ?? '', i.endereco ?? '']
      .some(v => String(v).toLowerCase().includes(t)));
  }, [items, q]);

  return (
    <main className="min-h-screen p-6">
      <div className="container max-w-3xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">Cedentes</h1>
          <p className="text-sm muted">Cadastro simples: nome, incluir e excluir.</p>
        </header>

        <div className="card p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm muted">Nome*</label>
              <input className="input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm muted">Razão social</label>
              <input className="input" value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm muted">CNPJ</label>
              <input className="input" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: formatCpfCnpj(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm muted">Telefone</label>
              <input className="input" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm muted">E-mail</label>
              <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm muted">Endereço</label>
              <input className="input" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn" onClick={() => setForm({ nome: '', razao_social: '', cnpj: '', telefone: '', email: '', endereco: '' })} type="button">Limpar</button>
            <button className="btn btn-primary" onClick={add} disabled={pending}>{pending ? 'Salvando...' : 'Adicionar'}</button>
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>

        <div className="flex items-center gap-2">
          <input className="input" placeholder="Buscar cedente..." value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn" onClick={() => setQ('')}>Limpar</button>
        </div>

        <div className="card p-0 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Razão social</th>
                <th>CNPJ</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>Endereço</th>
                <th className="w-24">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-3 muted">Nenhum cedente.</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id}>
                  <td>{c.nome}</td>
                  <td>{c.razao_social ?? '—'}</td>
                  <td>{c.cnpj ? formatCpfCnpj(c.cnpj) : '—'}</td>
                  <td>{c.telefone ?? '—'}</td>
                  <td>{c.email ?? '—'}</td>
                  <td>{c.endereco ?? '—'}</td>
                  <td>
                    <button className="btn h-8 px-2" onClick={() => remove(c.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}


