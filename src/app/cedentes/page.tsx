'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj } from '@/lib/format';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

type Cedente = {
  id: string;
  nome: string;
  razao_social: string | null;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  porte: string | null;
  natureza_juridica: string | null;
  situacao: string | null;
  data_abertura: string | null;
  capital_social: number | null;
  atividade_principal_codigo: string | null;
  atividade_principal_descricao: string | null;
  atividades_secundarias: string | null;
  simples_nacional: boolean | null;
  ultima_atualizacao: string | null;
};

export default function CedentesPage() {
  const [items, setItems] = useState<Cedente[]>([]);
  const [form, setForm] = useState({ 
    nome: '', razao_social: '', cnpj: '', telefone: '', email: '', endereco: '',
    porte: '', natureza_juridica: '', situacao: '', data_abertura: '', capital_social: '',
    atividade_principal_codigo: '', atividade_principal_descricao: '', atividades_secundarias: '',
    simples_nacional: false
  });
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [sortBy, setSortBy] = useState<'nome' | 'razao_social' | 'cnpj' | 'situacao'>('nome');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data, error } = await supabase
      .from('cedentes')
      .select('id, nome, razao_social, cnpj, telefone, email, endereco, porte, natureza_juridica, situacao, data_abertura, capital_social, atividade_principal_codigo, atividade_principal_descricao, atividades_secundarias, simples_nacional, ultima_atualizacao')
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
      cnpj: form.cnpj ? form.cnpj.replace(/\D+/g, '') : null,
      telefone: form.telefone || null,
      email: form.email || null,
      endereco: form.endereco || null,
      porte: form.porte || null,
      natureza_juridica: form.natureza_juridica || null,
      situacao: form.situacao || null,
      data_abertura: form.data_abertura || null,
      capital_social: form.capital_social ? Number(form.capital_social) : null,
      atividade_principal_codigo: form.atividade_principal_codigo || null,
      atividade_principal_descricao: form.atividade_principal_descricao || null,
      atividades_secundarias: form.atividades_secundarias || null,
      simples_nacional: form.simples_nacional || null,
      ultima_atualizacao: new Date().toISOString(),
    });
    if (error) setErr(error.message);
    setForm({ 
      nome: '', razao_social: '', cnpj: '', telefone: '', email: '', endereco: '',
      porte: '', natureza_juridica: '', situacao: '', data_abertura: '', capital_social: '',
      atividade_principal_codigo: '', atividade_principal_descricao: '', atividades_secundarias: '',
      simples_nacional: false
    });
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
    return items.filter(i => [
      i.nome, i.razao_social ?? '', i.cnpj ?? '', i.email ?? '', i.telefone ?? '', i.endereco ?? '',
      i.porte ?? '', i.natureza_juridica ?? '', i.situacao ?? '', i.atividade_principal_descricao ?? ''
    ].some(v => String(v).toLowerCase().includes(t)));
  }, [items, q]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const va = (a[sortBy] ?? '').toString().toLowerCase();
      const vb = (b[sortBy] ?? '').toString().toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, currentPage, pageSize]);

  function onSort(col: 'nome' | 'razao_social' | 'cnpj' | 'situacao') {
    if (sortBy === col) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
    setPage(1);
  }

  useEffect(() => { setPage(1); }, [q]);

  return (
    <main className="min-h-screen p-6 bg-white">
      <div className="container max-w-6xl space-y-6">
        {/* Toolbar */}
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#0369a1]">Cedentes</h1>
            <p className="text-[#64748b]">Cadastro e gestão de cedentes</p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Input
              placeholder="Buscar cedente..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="md:w-80 flex-1"
            />
            <Button variant="secondary" onClick={() => setQ('')}>Limpar</Button>
            <Button variant="primary" onClick={() => setShowCreate(v => !v)}>
              {showCreate ? 'Fechar' : 'Novo Cedente'}
            </Button>
          </div>
        </header>

        {/* Modal Novo Cedente */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl border border-[#e2e8f0]">
              <div className="flex items-center justify-between px-5 py-3 border-b">
                <h2 className="text-lg font-semibold text-[#0369a1]">Novo Cedente</h2>
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-2 py-1 text-[#64748b] hover:text-[#0f172a]"
                  aria-label="Fechar"
                >×</button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Nome*"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
              <Input
                label="Razão social"
                value={form.razao_social}
                onChange={(e) => setForm({ ...form, razao_social: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ</label>
                <div className="flex gap-2">
                  <Input
                    value={form.cnpj}
                    onChange={(e) => setForm({ ...form, cnpj: formatCpfCnpj(e.target.value) })}
                    className="flex-1"
                  />
                  <Button 
                    variant="secondary" 
                    disabled={loadingCnpj}
                    onClick={async () => {
                      try {
                        setLoadingCnpj(true);
                        const raw = (form.cnpj || '').replace(/\D+/g, '');
                        if (!raw) return;
                        const res = await fetch(`/api/cnpjws?cnpj=${raw}`);
                        const data = await res.json();
                        if (!res.ok) { alert(data?.error || 'Erro ao consultar CNPJ'); return; }
                        const estabelecimento = data?.estabelecimento || {};
                        const nome = estabelecimento?.nome_fantasia || '';
                        const rz = data?.razao_social || '';
                        const telefone = estabelecimento?.telefone1 ? `(${estabelecimento.ddd1}) ${estabelecimento.telefone1}` : '';
                        const email = estabelecimento?.email || '';
                        const endereco = [
                          estabelecimento?.tipo_logradouro,
                          estabelecimento?.logradouro,
                          estabelecimento?.numero,
                          estabelecimento?.complemento,
                          estabelecimento?.bairro,
                          estabelecimento?.cidade?.nome,
                          estabelecimento?.estado?.sigla,
                          estabelecimento?.cep,
                        ].filter(Boolean).join(', ');
                        const porte = data?.porte?.descricao || '';
                        const natureza_juridica = data?.natureza_juridica?.descricao || '';
                        const situacao = estabelecimento?.situacao_cadastral || '';
                        const data_abertura = estabelecimento?.data_inicio_atividade || '';
                        const capital_social = data?.capital_social || '';
                        const atividade_principal_codigo = estabelecimento?.atividade_principal?.subclasse || '';
                        const atividade_principal_descricao = estabelecimento?.atividade_principal?.descricao || '';
                        const atividades_secundarias = estabelecimento?.atividades_secundarias?.map(a => `${a.subclasse} - ${a.descricao}`).join('; ') || '';
                        const simples_nacional = data?.simples?.simples === 'Sim';
                        setForm(f => ({ 
                          ...f, nome, razao_social: rz, telefone, email, endereco,
                          porte, natureza_juridica, situacao, data_abertura, capital_social,
                          atividade_principal_codigo, atividade_principal_descricao, atividades_secundarias,
                          simples_nacional
                        }));
                      } finally {
                        setLoadingCnpj(false);
                      }
                    }}
                  >
                    {loadingCnpj ? 'Consultando...' : 'Consultar CNPJ'}
                  </Button>
                </div>
              </div>
              <Input
                label="Telefone"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              />
              <Input
                label="E-mail"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <Input
                label="Endereço"
                value={form.endereco}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                className="sm:col-span-2"
              />
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                onClick={() => setForm({ 
                  nome: '', razao_social: '', cnpj: '', telefone: '', email: '', endereco: '',
                  porte: '', natureza_juridica: '', situacao: '', data_abertura: '', capital_social: '',
                  atividade_principal_codigo: '', atividade_principal_descricao: '', atividades_secundarias: '',
                  simples_nacional: false
                })}
              >
                Limpar
              </Button>
              <Button 
                variant="primary" 
                onClick={add} 
                loading={pending}
                disabled={!form.nome}
              >
                Adicionar Cedente
              </Button>
            </div>
            
            {err && <p className="text-sm text-red-600">{err}</p>}
              </div>
            </div>
          </div>
        )}

        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#0369a1]">
                Lista de Cedentes
                <span className="ml-2 text-sm font-normal text-[#64748b]">({total})</span>
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#e0efff] to-[#f0f7ff]">
                  <tr>
                    {(['nome','razao_social','cnpj'] as const).map(col => (
                      <th key={col} className="px-4 py-3 text-left text-sm font-semibold text-[#0369a1] cursor-pointer select-none" onClick={() => onSort(col)}>
                        {col === 'nome' ? 'Nome' : col === 'razao_social' ? 'Razão social' : 'CNPJ'}
                        {sortBy === col && (
                          <span className="ml-1 text-[#64748b]">{sortDir === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#0369a1] cursor-pointer select-none" onClick={() => onSort('situacao')}>
                      Resumo
                      {sortBy === 'situacao' && (
                        <span className="ml-1 text-[#64748b]">{sortDir === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#0369a1]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#cbd5e1]">
                  {paginated.length === 0 ? (
                    <tr><td colSpan={7} className="p-6 text-center text-[#64748b]">Nenhum cedente encontrado.</td></tr>
                  ) : paginated.map(c => (
                    <tr key={c.id} className="hover:bg-[#f8fbff] transition-colors">
                      <td className="px-4 py-3 text-sm text-[#1e293b] font-medium">{c.nome}</td>
                      <td className="px-4 py-3 text-sm text-[#64748b]">{c.razao_social ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-[#64748b] font-mono">{c.cnpj ? formatCpfCnpj(c.cnpj) : '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {c.situacao && (
                            <Badge variant={c.situacao === 'ATIVA' ? 'success' : c.situacao === 'INATIVA' ? 'error' : 'neutral'} size="sm">
                              {c.situacao}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Link href={`/cedentes/${c.id}`} title="Ver">
                            <button className="p-2 rounded hover:bg-[#e2e8f0]" aria-label="Ver">👁️</button>
                          </Link>
                          <Link href={`/cedentes/${c.id}/editar`} title="Editar">
                            <button className="p-2 rounded hover:bg-[#e2e8f0]" aria-label="Editar">✏️</button>
                          </Link>
                          <button className="p-2 rounded hover:bg-[#fee2e2]" title="Excluir" aria-label="Excluir" onClick={() => remove(c.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-2">
              <div className="text-sm text-[#64748b]">
                Mostrando <strong>{paginated.length}</strong> de <strong>{total}</strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1.5 rounded border border-[#cbd5e1] text-sm text-[#0369a1] disabled:opacity-50"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >Anterior</button>
                <span className="text-sm text-[#64748b]">Página {currentPage} de {totalPages}</span>
                <button
                  className="px-3 py-1.5 rounded border border-[#cbd5e1] text-sm text-[#0369a1] disabled:opacity-50"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >Próxima</button>
                <select
                  className="ml-2 px-2 py-1.5 border border-[#cbd5e1] rounded text-sm text-[#0369a1] bg-white"
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                >
                  {[10, 20, 50].map(n => <option key={n} value={n}>{n}/página</option>)}
                </select>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}


