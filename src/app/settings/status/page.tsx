'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Status = { id: string; nome: string; cor: string | null; descricao: string | null; ordem: number | null };

export default function StatusSettingsPage() {
  const [items, setItems] = useState<Status[]>([]);
  const [form, setForm] = useState({ nome: '', cor: '#4180ab', descricao: '', ordem: '' });
  const [q, setQ] = useState('');
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data, error } = await supabase
      .from('sacado_statuses')
      .select('id, nome, cor, descricao, ordem')
      .order('ordem', { ascending: true })
      .order('nome', { ascending: true });
    if (error) setErr(error.message);
    setItems((data as Status[]) ?? []);
  }

  async function add() {
    if (!form.nome.trim()) return;
    setPending(true); setErr(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr('Não autenticado'); setPending(false); return; }
    const { error } = await supabase.from('sacado_statuses').insert({
      user_id: user.id,
      nome: form.nome.trim(),
      cor: form.cor || null,
      descricao: form.descricao || null,
      ordem: form.ordem ? Number(form.ordem) : null,
    });
    if (error) setErr(error.message);
    setForm({ nome: '', cor: '#4180ab', descricao: '', ordem: '' });
    await load();
    setPending(false);
  }

  async function remove(id: string) {
    const { error } = await supabase.from('sacado_statuses').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    await load();
  }

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter(s => [s.nome, s.descricao ?? ''].some(v => String(v).toLowerCase().includes(t)));
  }, [items, q]);

  return (
    <main className="min-h-screen p-6">
      <div className="container max-w-4xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">Configurações · Status de Sacado</h1>
          <p className="text-sm muted">Cadastre os status que aparecerão como badge na Ficha do Sacado.</p>
        </header>

        <div className="card p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm muted">Nome*</label>
              <input className="input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm muted">Cor</label>
              <input className="input" type="color" value={form.cor} onChange={(e) => setForm({ ...form, cor: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm muted">Ordem</label>
              <input className="input" value={form.ordem} onChange={(e) => setForm({ ...form, ordem: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm muted">Descrição</label>
              <input className="input" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn" type="button" onClick={() => setForm({ nome: '', cor: '#4180ab', descricao: '', ordem: '' })}>Limpar</button>
            <button className="btn btn-primary" onClick={add} disabled={pending}>{pending ? 'Salvando...' : 'Adicionar'}</button>
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>

        <div className="flex items-center gap-2">
          <input className="input" placeholder="Buscar status..." value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn" onClick={() => setQ('')}>Limpar</button>
        </div>

        <div className="card p-0 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Cor</th>
                <th>Ordem</th>
                <th>Descrição</th>
                <th className="w-24">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-3 muted">Nenhum status.</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id}>
                  <td>{s.nome}</td>
                  <td>
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full" style={{ background: s.cor ?? '#cdb89a' }} />
                      {s.cor ?? '—'}
                    </span>
                  </td>
                  <td>{s.ordem ?? '—'}</td>
                  <td>{s.descricao ?? '—'}</td>
                  <td><button className="btn h-8 px-2" onClick={() => remove(s.id)}>Excluir</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}


