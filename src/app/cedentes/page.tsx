'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj } from '@/lib/format';
import { consultarCnpj } from '@/lib/cnpjws';
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

type ViewMode = 'table' | 'grid';

export default function CedentesPage() {
  const router = useRouter();
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
  const [consultarAPIs, setConsultarAPIs] = useState(false);
  const [sortBy, setSortBy] = useState<'nome' | 'razao_social' | 'cnpj' | 'situacao'>('nome');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [filterSituacao, setFilterSituacao] = useState<string>('all');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) { router.replace('/login'); return; }
      load();
    });
  }, [router]);

  async function load() {
    const { data, error } = await supabase
      .from('cedentes')
      .select('id, nome, razao_social, cnpj, telefone, email, endereco, porte, natureza_juridica, situacao, data_abertura, capital_social, atividade_principal_codigo, atividade_principal_descricao, atividades_secundarias, simples_nacional, ultima_atualizacao')
      .order('nome', { ascending: true });
    if (error) setErr(error.message);
    setItems((data as Cedente[]) ?? []);
  }

  async function consultarAPIsCedente(cedenteId: string, cnpj: string) {
    if (!cnpj || cnpj.length !== 14) return;
    
    try {
      const tipos = ['enderecos', 'telefones', 'emails', 'qsa'];
      
      for (const tipo of tipos) {
        try {
          const res = await fetch(`/api/bigdata?cnpj=${encodeURIComponent(cnpj)}&tipo=${tipo}`);
          const response = await res.json();
          
          if (res.ok && response && Array.isArray(response) && response.length > 0) {
            const tableName = tipo === 'enderecos' ? 'cedentes_enderecos' :
                            tipo === 'telefones' ? 'cedentes_telefones' :
                            tipo === 'emails' ? 'cedentes_emails' :
                            tipo === 'qsa' ? 'cedentes_qsa' : null;
            
            if (tableName) {
              // Remove dados antigos da API
              await supabase
                .from(tableName)
                .delete()
                .eq('cedente_id', cedenteId)
                .eq('origem', 'api');
              
              // Insere novos dados
              const dataToInsert = response.map((item: any) => ({
                ...item,
                cedente_id: cedenteId,
                origem: 'api',
                ativo: true
              }));
              
              await supabase.from(tableName).insert(dataToInsert);
            }
          }
        } catch (err) {
          console.error(`Erro ao consultar ${tipo}:`, err);
        }
      }
    } catch (err) {
      console.error('Erro ao consultar APIs:', err);
    }
  }

  async function add() {
    if (!form.nome.trim()) return;
    setPending(true); setErr(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr('Não autenticado'); setPending(false); return; }
    
    const cnpjLimpo = form.cnpj ? form.cnpj.replace(/\D+/g, '') : null;
    
    const { data: novoCedente, error } = await supabase.from('cedentes').insert({
      user_id: user.id,
      nome: form.nome.trim(),
      razao_social: form.razao_social || null,
      cnpj: cnpjLimpo,
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
    }).select('id, cnpj').single();
    
    if (error) {
      setErr(error.message);
      setPending(false);
      return;
    }
    
    // Se marcou para consultar APIs e tem CNPJ, consulta
    if (consultarAPIs && novoCedente && cnpjLimpo && cnpjLimpo.length === 14) {
      await consultarAPIsCedente(novoCedente.id, cnpjLimpo);
    }
    
    setShowCreate(false);
    setConsultarAPIs(false);
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
    if (!confirm('Tem certeza que deseja excluir este cedente?')) return;
    const { error } = await supabase.from('cedentes').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    await load();
  }

  const filtered = useMemo(() => {
    let result = items;
    
    // Filtro por situação
    if (filterSituacao !== 'all') {
      if (filterSituacao === 'ativa') {
        result = result.filter(i => i.situacao === 'ATIVA');
      } else if (filterSituacao === 'inativa') {
        result = result.filter(i => i.situacao !== 'ATIVA');
      }
    }
    
    // Filtro por texto
    const t = q.trim().toLowerCase();
    if (t) {
      result = result.filter(i => [
        i.nome, i.razao_social ?? '', i.cnpj ?? '', i.email ?? '', i.telefone ?? '', i.endereco ?? '',
        i.porte ?? '', i.natureza_juridica ?? '', i.situacao ?? '', i.atividade_principal_descricao ?? ''
      ].some(v => String(v).toLowerCase().includes(t)));
    }
    
    return result;
  }, [items, q, filterSituacao]);

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

  useEffect(() => { setPage(1); }, [q, filterSituacao]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container max-w-7xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <header className="flex flex-col gap-4">
          <div>
            <button 
              onClick={() => router.push('/menu/operacional')}
              className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 bg-white border border-gray-300 hover:bg-gray-50 text-[#0369a1] text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </button>
            <div className="border-b-2 border-[#0369a1] pb-3">
              <h1 className="text-3xl font-bold text-[#0369a1] mb-1">Cedentes</h1>
              <p className="text-sm text-gray-600">Gestão completa de cedentes e relacionamentos</p>
            </div>
          </div>
        </header>

        {/* Toolbar */}
        <div className="bg-white border border-gray-300 p-4">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            {/* Busca e filtros */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1">
                <Input
                  placeholder="🔍 Buscar por nome, CNPJ, email..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full"
                />
              </div>
              <select
                value={filterSituacao}
                onChange={(e) => setFilterSituacao(e.target.value)}
                className="px-3 py-2 border border-gray-300 text-sm text-[#0369a1] bg-white hover:bg-gray-50"
              >
                <option value="all">📊 Todas as situações</option>
                <option value="ativa">✅ Apenas Ativos</option>
                <option value="inativa">⏸ Apenas Inativos</option>
              </select>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
                className="px-3 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-[#0369a1] text-sm font-medium"
                title={viewMode === 'table' ? 'Visualizar em Grid' : 'Visualizar em Tabela'}
              >
                {viewMode === 'table' ? '⊞' : '≡'}
              </button>
              <Button variant="primary" onClick={() => setShowCreate(true)}>
                ➕ Novo Cedente
              </Button>
            </div>
          </div>

          {/* Contador de resultados */}
          <div className="mt-3 pt-3 border-t border-gray-300 flex items-center justify-between text-sm">
            <span className="text-[#64748b]">
              Exibindo <strong className="text-[#0369a1]">{paginated.length}</strong> de <strong className="text-[#0369a1]">{total}</strong> cedentes
              {q && <span> (filtrado de <strong>{items.length}</strong>)</span>}
            </span>
            {q && (
              <Button variant="secondary" onClick={() => setQ('')} className="text-xs">
                Limpar busca
              </Button>
            )}
          </div>
        </div>

        {/* Modal Novo Cedente */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white border border-gray-300 w-full max-w-3xl max-h-[90vh] overflow-auto">
              <div className="border-b border-gray-300 bg-gray-100 px-4 py-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700 uppercase">Novo Cedente</h2>
                <button
                  onClick={() => { setShowCreate(false); setErr(null); }}
                  className="text-gray-600 hover:text-gray-900 text-xl"
                  aria-label="Fechar"
                >×</button>
              </div>
              <div className="p-4 space-y-4">
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
                    <label className="block text-xs font-medium text-gray-700 mb-1">CNPJ</label>
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
                            
                            const dadosCnpj = await consultarCnpj(raw);
                            
                            setForm(f => ({
                              ...f,
                              nome: dadosCnpj.nome_fantasia,
                              razao_social: dadosCnpj.razao_social,
                              telefone: dadosCnpj.telefone,
                              email: dadosCnpj.email,
                              endereco: dadosCnpj.endereco,
                              porte: dadosCnpj.porte,
                              natureza_juridica: dadosCnpj.natureza_juridica,
                              situacao: dadosCnpj.situacao,
                              data_abertura: dadosCnpj.data_abertura || '',
                              capital_social: dadosCnpj.capital_social || '',
                              atividade_principal_codigo: dadosCnpj.atividade_principal_codigo || '',
                              atividade_principal_descricao: dadosCnpj.atividade_principal_descricao || '',
                              atividades_secundarias: dadosCnpj.atividades_secundarias || '',
                              simples_nacional: dadosCnpj.simples_nacional || false,
                            }));
                            
                          } catch (error) {
                            const msg = error instanceof Error ? error.message : 'Erro ao consultar CNPJ';
                            alert(msg);
                          } finally {
                            setLoadingCnpj(false);
                          }
                        }}
                      >
                        {loadingCnpj ? 'Consultando...' : 'Consultar'}
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
                
                <div className="pt-4 border-t border-gray-300 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="consultar-apis"
                      checked={consultarAPIs}
                      onChange={(e) => setConsultarAPIs(e.target.checked)}
                      className="w-4 h-4 border border-gray-300"
                    />
                    <label htmlFor="consultar-apis" className="text-sm text-gray-700">
                      Consultar APIs após salvar (endereços, telefones, emails, QSA)
                    </label>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button 
                      className="px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium"
                      onClick={() => {
                        setForm({ 
                          nome: '', razao_social: '', cnpj: '', telefone: '', email: '', endereco: '',
                          porte: '', natureza_juridica: '', situacao: '', data_abertura: '', capital_social: '',
                          atividade_principal_codigo: '', atividade_principal_descricao: '', atividades_secundarias: '',
                          simples_nacional: false
                        });
                        setConsultarAPIs(false);
                      }}
                    >
                      Limpar
                    </button>
                    <button 
                      className="px-3 py-1.5 bg-[#0369a1] hover:bg-[#075985] text-white text-sm font-medium disabled:opacity-50"
                      onClick={add} 
                      disabled={pending || !form.nome}
                    >
                      {pending ? 'Salvando...' : 'Adicionar Cedente'}
                    </button>
                  </div>
                </div>
                
                {err && <p className="text-xs text-red-600 bg-red-50 border border-red-200 p-2">{err}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Visualização - Tabela ou Grid */}
        <Card>
          {viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    {(['nome','razao_social','cnpj'] as const).map(col => (
                      <th key={col} className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300 cursor-pointer select-none hover:bg-gray-200" onClick={() => onSort(col)}>
                        {col === 'nome' ? 'Nome' : col === 'razao_social' ? 'Razão Social' : 'CNPJ'}
                        {sortBy === col && (
                          <span className="ml-1 text-[#64748b]">{sortDir === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </th>
                    ))}
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300 cursor-pointer select-none hover:bg-gray-200" onClick={() => onSort('situacao')}>
                      Status
                      {sortBy === 'situacao' && (
                        <span className="ml-1 text-gray-500">{sortDir === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-600 border-b border-gray-300">
                      <div className="flex flex-col items-center gap-3">
                        <span className="text-4xl">📭</span>
                        <p>Nenhum cedente encontrado.</p>
                      </div>
                    </td></tr>
                  ) : paginated.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 border-b border-gray-300 group">
                      <td className="px-4 py-2 text-sm text-gray-900 font-medium border-r border-gray-300">{c.nome}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 border-r border-gray-300">{c.razao_social ?? '—'}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 font-mono border-r border-gray-300">{c.cnpj ? formatCpfCnpj(c.cnpj) : '—'}</td>
                      <td className="px-4 py-2 border-r border-gray-300">
                        {c.situacao && (
                          <Badge variant={c.situacao === 'ATIVA' ? 'success' : 'neutral'} size="sm">
                            {c.situacao}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <Link href={`/cedentes/${c.id}`}>
                            <button className="px-2 py-1 border border-gray-300 bg-white hover:bg-gray-50 text-[#0369a1] text-xs font-medium">Ver</button>
                          </Link>
                          <Link href={`/cedentes/${c.id}/editar`}>
                            <button className="px-2 py-1 border border-gray-300 bg-white hover:bg-gray-50 text-[#0369a1] text-xs font-medium">Editar</button>
                          </Link>
                          <button className="px-2 py-1 border border-gray-300 bg-white hover:bg-gray-50 text-red-600 text-xs font-medium" onClick={() => remove(c.id)}>Apagar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 p-4">
              {paginated.length === 0 ? (
                <div className="col-span-full p-8 text-center text-[#64748b]">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-4xl">📭</span>
                    <p>Nenhum cedente encontrado.</p>
                  </div>
                </div>
              ) : paginated.map(c => (
                <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">🏢</span>
                    </div>
                    {c.situacao && (
                      <Badge variant={c.situacao === 'ATIVA' ? 'success' : 'neutral'} size="sm">
                        {c.situacao}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-bold text-[#0369a1] mb-1 text-lg">{c.nome}</h3>
                  {c.razao_social && <p className="text-sm text-[#64748b] mb-2">{c.razao_social}</p>}
                  {c.cnpj && <p className="text-xs text-[#64748b] font-mono mb-3">{formatCpfCnpj(c.cnpj)}</p>}
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <Link href={`/cedentes/${c.id}`} className="flex-1">
                      <button className="w-full px-3 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-[#0369a1] font-medium text-sm">
                        Ver
                      </button>
                    </Link>
                    <Link href={`/cedentes/${c.id}/editar`}>
                      <button className="px-3 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-[#0369a1] font-medium text-sm">
                        Editar
                      </button>
                    </Link>
                    <button 
                      onClick={() => remove(c.id)}
                      className="px-3 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-red-600 font-medium text-sm"
                    >
                      Apagar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginação */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 border-t border-gray-300 bg-gray-100">
            <div className="text-sm text-[#64748b]">
              Página <strong className="text-[#0369a1]">{currentPage}</strong> de <strong className="text-[#0369a1]">{totalPages}</strong>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <button
                className="px-3 py-1.5 border border-gray-300 text-sm text-[#0369a1] font-medium bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >← Anterior</button>
              <span className="text-sm text-gray-600 px-2">•</span>
              <button
                className="px-3 py-1.5 border border-gray-300 text-sm text-[#0369a1] font-medium bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >Próxima →</button>
              <select
                className="ml-2 px-3 py-1.5 border border-gray-300 text-sm text-[#0369a1] bg-white hover:bg-gray-50"
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              >
                {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}/página</option>)}
              </select>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
