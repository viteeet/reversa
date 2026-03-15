'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/ui/PageHeader';

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
    <main className="min-h-screen bg-gray-50">
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-4">
        <PageHeader
          title="Configuracoes · Status de Sacado"
          subtitle="Cadastre os status que aparecerao como badge na ficha do sacado"
          backHref="/menu/configuracoes"
          className="mb-4"
        />

        {/* Formulário */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">Novo Status</h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nome*</label>
                <input 
                  className="w-full px-3 py-2 border border-gray-300 text-sm" 
                  value={form.nome} 
                  onChange={(e) => setForm({ ...form, nome: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Cor</label>
                <input 
                  className="w-full px-3 py-2 border border-gray-300 text-sm" 
                  type="color" 
                  value={form.cor} 
                  onChange={(e) => setForm({ ...form, cor: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ordem</label>
                <input 
                  className="w-full px-3 py-2 border border-gray-300 text-sm" 
                  value={form.ordem} 
                  onChange={(e) => setForm({ ...form, ordem: e.target.value })} 
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
                <input 
                  className="w-full px-3 py-2 border border-gray-300 text-sm" 
                  value={form.descricao} 
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })} 
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                className="px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium" 
                type="button" 
                onClick={() => setForm({ nome: '', cor: '#4180ab', descricao: '', ordem: '' })}
              >
                Limpar
              </button>
              <button 
                className="px-3 py-1.5 bg-[#0369a1] hover:bg-[#075985] text-white text-sm font-medium disabled:opacity-50" 
                onClick={add} 
                disabled={pending}
              >
                {pending ? 'Salvando...' : 'Adicionar'}
              </button>
            </div>
            {err && <p className="text-xs text-red-600">{err}</p>}
          </div>
        </div>

        {/* Busca */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">Buscar</h2>
          </div>
          <div className="p-4 flex items-center gap-2">
            <input 
              className="flex-1 px-3 py-2 border border-gray-300 text-sm" 
              placeholder="Buscar status..." 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
            />
            <button 
              className="px-3 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium" 
              onClick={() => setQ('')}
            >
              Limpar
            </button>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">Status Cadastrados</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Nome</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Cor</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Ordem</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Descrição</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-sm text-gray-500 text-center border-b border-gray-300">
                      Nenhum status.
                    </td>
                  </tr>
                ) : filtered.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 border-b border-gray-300">
                    <td className="px-4 py-2 text-sm text-gray-900 border-r border-gray-300">{s.nome}</td>
                    <td className="px-4 py-2 text-sm text-gray-900 border-r border-gray-300">
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full border border-gray-300" style={{ background: s.cor ?? '#cdb89a' }} />
                        {s.cor ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 border-r border-gray-300">{s.ordem ?? '—'}</td>
                    <td className="px-4 py-2 text-sm text-gray-900 border-r border-gray-300">{s.descricao ?? '—'}</td>
                    <td className="px-4 py-2">
                      <button 
                        className="px-2 py-1 border border-gray-300 bg-white hover:bg-gray-50 text-red-600 text-xs font-medium" 
                        onClick={() => remove(s.id)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}


