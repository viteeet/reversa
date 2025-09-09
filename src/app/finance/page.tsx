'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Conta = { id: string; nome: string };
type Categoria = { id: string; nome: string; natureza: 'receita'|'despesa' };
type Meio = { id: string; nome: string };
type Elemento = { id: string; nome: string };
type Lanc = {
  id: string; conta_id: string; categoria_id: string; elemento_id: string | null;
  descricao: string | null; valor: number; natureza: 'receita'|'despesa';
  data_competencia: string; data_pagamento: string | null; status: string;
  meio_pagamento_id: string | null; terceiro: string | null;
};

export default function FluxoPage() {
  const [periodo, setPeriodo] = useState<{ini: string, fim: string}>(() => {
    const now = new Date();
    const ini = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
    const fim = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().slice(0,10);
    return { ini, fim };
  });
  const [contas, setContas] = useState<Conta[]>([]);
  const [cats, setCats] = useState<Categoria[]>([]);
  const [meios, setMeios] = useState<Meio[]>([]);
  const [els, setEls] = useState<Elemento[]>([]);
  const [filtros, setFiltros] = useState({ conta: '', categoria: '', status: '', meio: '', elemento: '', texto: '' });
  const [items, setItems] = useState<Lanc[]>([]);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [novo, setNovo] = useState({ conta_id: '', categoria_id: '', natureza: 'despesa' as 'receita'|'despesa', valor: '', data: '', descricao: '' });

  useEffect(() => { loadLookups(); }, []);
  useEffect(() => { load(); }, [periodo, filtros.conta, filtros.categoria, filtros.status, filtros.meio, filtros.elemento]);

  async function loadLookups() {
    const [c1, c2, c3, c4] = await Promise.all([
      supabase.from('contas_financeiras').select('id, nome').order('nome', { ascending: true }),
      supabase.from('categorias').select('id, nome, natureza').order('ordem', { ascending: true }).order('nome', { ascending: true }),
      supabase.from('meios_pagamento').select('id, nome').order('nome', { ascending: true }),
      supabase.from('elementos').select('id, nome').order('nome', { ascending: true }),
    ]);
    setContas((c1.data ?? []) as Conta[]);
    setCats((c2.data ?? []) as Categoria[]);
    setMeios((c3.data ?? []) as Meio[]);
    setEls((c4.data ?? []) as Elemento[]);
  }

  async function load() {
    setPending(true); setErr(null);
    let q = supabase.from('lancamentos').select('*').gte('data_competencia', periodo.ini).lte('data_competencia', periodo.fim).order('data_competencia', { ascending: true });
    if (filtros.conta) q = q.eq('conta_id', filtros.conta);
    if (filtros.categoria) q = q.eq('categoria_id', filtros.categoria);
    if (filtros.status) q = q.eq('status', filtros.status);
    if (filtros.meio) q = q.eq('meio_pagamento_id', filtros.meio);
    if (filtros.elemento) q = q.eq('elemento_id', filtros.elemento);
    const { data, error } = await q.returns<Lanc[]>();
    if (error) setErr(error.message);
    setItems(data ?? []);
    setPending(false);
  }

  async function add() {
    setPending(true); setErr(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr('Não autenticado'); setPending(false); return; }
    const { error } = await supabase.from('lancamentos').insert({
      user_id: user.id,
      conta_id: novo.conta_id,
      categoria_id: novo.categoria_id,
      elemento_id: null,
      descricao: novo.descricao || null,
      valor: Number(novo.valor || 0),
      natureza: novo.natureza,
      data_competencia: novo.data || periodo.ini,
      status: 'previsto',
      meio_pagamento_id: null,
      terceiro: null,
      observacoes: null,
    });
    if (error) setErr(error.message);
    setNovo({ conta_id: '', categoria_id: '', natureza: 'despesa', valor: '', data: '', descricao: '' });
    await load();
    setPending(false);
  }

  async function remove(id: string) {
    const { error } = await supabase.from('lancamentos').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    await load();
  }

  const total = useMemo(() => items.reduce((acc, l) => acc + (l.natureza === 'receita' ? l.valor : -l.valor), 0), [items]);

  return (
    <main className="min-h-screen p-6">
      <div className="container max-w-6xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Fluxo de Caixa</h1>
            <p className="text-sm muted">Período
              <input type="date" className="input ml-2" value={periodo.ini} onChange={(e) => setPeriodo({ ...periodo, ini: e.target.value })} />
              <span className="mx-2">até</span>
              <input type="date" className="input" value={periodo.fim} onChange={(e) => setPeriodo({ ...periodo, fim: e.target.value })} />
            </p>
          </div>
          <div className="card p-3">
            <p className="text-sm muted">Saldo do período</p>
            <p className="text-xl font-semibold">{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
        </header>

        <div className="card p-4 grid gap-3 sm:grid-cols-3 md:grid-cols-6 items-end">
          <div>
            <label className="block text-sm muted">Conta</label>
            <select className="select" value={filtros.conta} onChange={(e) => setFiltros({ ...filtros, conta: e.target.value })}>
              <option value="">Todas</option>
              {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm muted">Categoria</label>
            <select className="select" value={filtros.categoria} onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}>
              <option value="">Todas</option>
              {cats.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm muted">Status</label>
            <select className="select" value={filtros.status} onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}>
              <option value="">Todos</option>
              {['previsto','pendente','pago','estornado'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm muted">Meio</label>
            <select className="select" value={filtros.meio} onChange={(e) => setFiltros({ ...filtros, meio: e.target.value })}>
              <option value="">Todos</option>
              {meios.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm muted">Elemento</label>
            <select className="select" value={filtros.elemento} onChange={(e) => setFiltros({ ...filtros, elemento: e.target.value })}>
              <option value="">Todos</option>
              {els.map(el => <option key={el.id} value={el.id}>{el.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm muted">Busca</label>
            <input className="input" value={filtros.texto} onChange={(e) => setFiltros({ ...filtros, texto: e.target.value })} />
          </div>
        </div>

        <div className="card p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-5 items-end">
            <select className="select" value={novo.conta_id} onChange={(e) => setNovo({ ...novo, conta_id: e.target.value })}>
              <option value="">Conta</option>
              {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            <select className="select" value={novo.categoria_id} onChange={(e) => setNovo({ ...novo, categoria_id: e.target.value })}>
              <option value="">Categoria</option>
              {cats.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            <select className="select" value={novo.natureza} onChange={(e) => setNovo({ ...novo, natureza: e.target.value as any })}>
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </select>
            <input className="input" placeholder="Valor" value={novo.valor} onChange={(e) => setNovo({ ...novo, valor: e.target.value })} />
            <input type="date" className="input" value={novo.data} onChange={(e) => setNovo({ ...novo, data: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
            <input className="input" placeholder="Descrição" value={novo.descricao} onChange={(e) => setNovo({ ...novo, descricao: e.target.value })} />
            <button className="btn btn-primary" onClick={add} disabled={pending}>{pending ? 'Salvando...' : 'Adicionar'}</button>
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>

        <div className="card p-0 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Natureza</th>
                <th>Valor</th>
                <th>Status</th>
                <th className="w-24">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={6} className="p-3 muted">Sem lançamentos no período.</td></tr>
              ) : items
                .filter(l => !filtros.texto || (l.descricao ?? '').toLowerCase().includes(filtros.texto.toLowerCase()))
                .map(l => (
                <tr key={l.id}>
                  <td>{new Date(l.data_competencia).toLocaleDateString()}</td>
                  <td>{l.descricao ?? '—'}</td>
                  <td>{l.natureza}</td>
                  <td>{l.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td>{l.status}</td>
                  <td><button className="btn h-8 px-2" onClick={() => remove(l.id)}>Excluir</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}


