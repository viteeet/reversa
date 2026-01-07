'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj } from '@/lib/format';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

type PessoaFisica = {
  id: string;
  cpf: string;
  nome: string;
  nome_mae: string | null;
  data_nascimento: string | null;
  rg: string | null;
  situacao: string | null;
  observacoes_gerais: string | null;
  origem: string | null;
  created_at: string;
};

type ViewMode = 'table' | 'grid';

export default function PessoasFisicasPage() {
  const router = useRouter();
  const [items, setItems] = useState<PessoaFisica[]>([]);
  const [form, setForm] = useState({ 
    cpf: '', nome: '', nome_mae: '', data_nascimento: '', rg: '', situacao: 'ativa', observacoes_gerais: ''
  });
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [sortBy, setSortBy] = useState<'nome' | 'cpf' | 'situacao'>('nome');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [filterSituacao, setFilterSituacao] = useState<string>('all');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) { router.replace('/login'); return; }
      load();
    });
  }, [router]);

  // Validação de CPF
  function validarCPF(cpf: string): boolean {
    const cpfLimpo = cpf.replace(/\D+/g, '');
    if (cpfLimpo.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
    }
    let digito = 11 - (soma % 11);
    if (digito >= 10) digito = 0;
    if (digito !== parseInt(cpfLimpo.charAt(9))) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
    }
    digito = 11 - (soma % 11);
    if (digito >= 10) digito = 0;
    if (digito !== parseInt(cpfLimpo.charAt(10))) return false;
    
    return true;
  }

  async function load() {
    const { data, error } = await supabase
      .from('pessoas_fisicas')
      .select('id, cpf, nome, nome_mae, data_nascimento, rg, situacao, observacoes_gerais, origem, created_at')
      .eq('ativo', true)
      .order('nome', { ascending: true });
    if (error) setErr(error.message);
    setItems((data as PessoaFisica[]) ?? []);
  }

  async function add() {
    if (!form.nome.trim()) {
      setErr('Nome é obrigatório');
      return;
    }
    if (!form.cpf.trim()) {
      setErr('CPF é obrigatório');
      return;
    }
    
    const cpfLimpo = form.cpf.replace(/\D+/g, '');
    if (!validarCPF(cpfLimpo)) {
      setErr('CPF inválido');
      return;
    }
    
    setPending(true); 
    setErr(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr('Não autenticado'); setPending(false); return; }
    
    const { error } = await supabase.from('pessoas_fisicas').insert({
      user_id: user.id,
      cpf: cpfLimpo,
      nome: form.nome.trim(),
      nome_mae: form.nome_mae || null,
      data_nascimento: form.data_nascimento || null,
      rg: form.rg || null,
      situacao: form.situacao || 'ativa',
      observacoes_gerais: form.observacoes_gerais || null,
      origem: 'manual',
    });
    
    if (error) {
      if (error.code === '23505') {
        setErr('CPF já cadastrado');
      } else {
        setErr(error.message);
      }
    } else {
      setShowCreate(false);
      setForm({ cpf: '', nome: '', nome_mae: '', data_nascimento: '', rg: '', situacao: 'ativa', observacoes_gerais: '' });
      await load();
    }
    setPending(false);
  }

  async function remove(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta pessoa física?')) return;
    const { error } = await supabase.from('pessoas_fisicas').update({ ativo: false }).eq('id', id);
    if (error) alert(error.message);
    await load();
  }

  const filtered = useMemo(() => {
    let result = items;
    
    if (filterSituacao !== 'all') {
      result = result.filter(item => item.situacao === filterSituacao);
    }
    
    if (q.trim()) {
      const query = q.trim().toLowerCase();
      result = result.filter(item => 
        item.nome.toLowerCase().includes(query) ||
        item.cpf.replace(/\D+/g, '').includes(query) ||
        (item.rg && item.rg.toLowerCase().includes(query)) ||
        (item.nome_mae && item.nome_mae.toLowerCase().includes(query))
      );
    }
    
    return result.sort((a, b) => {
      const aVal = a[sortBy] || '';
      const bVal = b[sortBy] || '';
      if (sortDir === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [items, q, sortBy, sortDir, filterSituacao]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container max-w-7xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <header className="mb-4">
          <button 
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/menu/operacional');
              }
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 bg-white border border-gray-300 hover:bg-gray-50 text-[#0369a1] text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
          <div className="border-b-2 border-[#0369a1] pb-3">
            <h1 className="text-3xl font-bold text-[#0369a1] mb-1">Pessoas Físicas</h1>
            <p className="text-sm text-gray-600">Cadastro de pessoas físicas</p>
          </div>
        </header>

        {/* Toolbar */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700 uppercase">Filtros e Ações</h2>
              <Button variant="primary" onClick={() => setShowCreate(true)}>
                + Nova Pessoa Física
              </Button>
            </div>
          </div>
          <div className="p-4 grid gap-4 sm:grid-cols-3">
            <Input
              label="Buscar"
              placeholder="Nome, CPF, RG ou Nome da Mãe..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Situação</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 text-sm"
                value={filterSituacao}
                onChange={(e) => setFilterSituacao(e.target.value)}
              >
                <option value="all">Todas</option>
                <option value="ativa">Ativa</option>
                <option value="inativa">Inativa</option>
                <option value="falecida">Falecida</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                className="px-3 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium"
                onClick={() => {
                  setQ('');
                  setFilterSituacao('all');
                }}
              >
                Limpar
              </button>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">
              Lista de Pessoas Físicas ({filtered.length})
            </h2>
            <div className="flex items-center gap-2">
              <button
                className={`px-2 py-1 text-xs border border-gray-300 ${viewMode === 'table' ? 'bg-gray-200' : 'bg-white'}`}
                onClick={() => setViewMode('table')}
              >
                Tabela
              </button>
              <button
                className={`px-2 py-1 text-xs border border-gray-300 ${viewMode === 'grid' ? 'bg-gray-200' : 'bg-white'}`}
                onClick={() => setViewMode('grid')}
              >
                Grade
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                <p>Nenhuma pessoa física encontrada</p>
              </div>
            ) : viewMode === 'table' ? (
              <table className="w-full border-collapse">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">
                      <button onClick={() => { setSortBy('nome'); setSortDir(sortBy === 'nome' && sortDir === 'asc' ? 'desc' : 'asc'); }}>
                        Nome {sortBy === 'nome' && (sortDir === 'asc' ? '↑' : '↓')}
                      </button>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">
                      <button onClick={() => { setSortBy('cpf'); setSortDir(sortBy === 'cpf' && sortDir === 'asc' ? 'desc' : 'asc'); }}>
                        CPF {sortBy === 'cpf' && (sortDir === 'asc' ? '↑' : '↓')}
                      </button>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">RG</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Data Nasc.</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">
                      <button onClick={() => { setSortBy('situacao'); setSortDir(sortBy === 'situacao' && sortDir === 'asc' ? 'desc' : 'asc'); }}>
                        Situação {sortBy === 'situacao' && (sortDir === 'asc' ? '↑' : '↓')}
                      </button>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 border-b border-gray-300">
                      <td className="px-4 py-2 text-sm text-gray-900 border-r border-gray-300">
                        <Link href={`/pessoas-fisicas/${encodeURIComponent(item.cpf)}`} className="text-[#0369a1] hover:underline font-medium">
                          {item.nome}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 border-r border-gray-300">
                        {formatCpfCnpj(item.cpf)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600 border-r border-gray-300">
                        {item.rg || '—'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600 border-r border-gray-300">
                        {item.data_nascimento ? new Date(item.data_nascimento).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="px-4 py-2 border-r border-gray-300">
                        <Badge variant={item.situacao === 'ativa' ? 'success' : item.situacao === 'falecida' ? 'error' : 'warning'}>
                          {item.situacao || 'ativa'}
                        </Badge>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <Link href={`/pessoas-fisicas/${encodeURIComponent(item.cpf)}/editar`}>
                            <button className="px-2 py-1 border border-gray-300 bg-white hover:bg-gray-50 text-[#0369a1] text-xs font-medium">
                              Editar
                            </button>
                          </Link>
                          <button 
                            className="px-2 py-1 border border-gray-300 bg-white hover:bg-gray-50 text-red-600 text-xs font-medium"
                            onClick={() => remove(item.id)}
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((item) => (
                  <div key={item.id} className="border border-gray-300 p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <Link href={`/pessoas-fisicas/${encodeURIComponent(item.cpf)}`} className="text-[#0369a1] hover:underline font-semibold">
                        {item.nome}
                      </Link>
                      <Badge variant={item.situacao === 'ativa' ? 'success' : item.situacao === 'falecida' ? 'error' : 'warning'}>
                        {item.situacao || 'ativa'}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p><strong>CPF:</strong> {formatCpfCnpj(item.cpf)}</p>
                      {item.rg && <p><strong>RG:</strong> {item.rg}</p>}
                      {item.data_nascimento && <p><strong>Nascimento:</strong> {new Date(item.data_nascimento).toLocaleDateString('pt-BR')}</p>}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Link href={`/pessoas-fisicas/${encodeURIComponent(item.cpf)}/editar`} className="flex-1">
                        <button className="w-full px-2 py-1 border border-gray-300 bg-white hover:bg-gray-50 text-[#0369a1] text-xs font-medium">
                          Editar
                        </button>
                      </Link>
                      <button 
                        className="px-2 py-1 border border-gray-300 bg-white hover:bg-gray-50 text-red-600 text-xs font-medium"
                        onClick={() => remove(item.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Criar */}
        {showCreate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white border border-gray-300 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="border-b border-gray-300 bg-gray-100 px-4 py-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700 uppercase">Nova Pessoa Física</h2>
                <button onClick={() => { setShowCreate(false); setErr(null); }} className="text-gray-600 hover:text-gray-900">
                  ✕
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Input
                      label="CPF *"
                      placeholder="000.000.000-00"
                      value={form.cpf}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D+/g, '');
                        const formatted = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                        setForm({ ...form, cpf: formatted });
                      }}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      label="Nome *"
                      placeholder="Nome completo"
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    />
                  </div>
                  <Input
                    label="Nome da Mãe"
                    placeholder="Nome completo da mãe"
                    value={form.nome_mae}
                    onChange={(e) => setForm({ ...form, nome_mae: e.target.value })}
                  />
                  <Input
                    label="RG"
                    placeholder="RG"
                    value={form.rg}
                    onChange={(e) => setForm({ ...form, rg: e.target.value })}
                  />
                  <Input
                    label="Data de Nascimento"
                    type="date"
                    value={form.data_nascimento}
                    onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })}
                  />
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Situação</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 text-sm"
                      value={form.situacao}
                      onChange={(e) => setForm({ ...form, situacao: e.target.value })}
                    >
                      <option value="ativa">Ativa</option>
                      <option value="inativa">Inativa</option>
                      <option value="falecida">Falecida</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Observações Gerais</label>
                    <textarea 
                      className="w-full px-3 py-2 border border-gray-300 text-sm"
                      rows={3}
                      value={form.observacoes_gerais}
                      onChange={(e) => setForm({ ...form, observacoes_gerais: e.target.value })}
                    />
                  </div>
                </div>
                {err && <p className="text-xs text-red-600">{err}</p>}
                <div className="flex gap-2 justify-end">
                  <button 
                    className="px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium"
                    onClick={() => { setShowCreate(false); setErr(null); setForm({ cpf: '', nome: '', nome_mae: '', data_nascimento: '', rg: '', situacao: 'ativa', observacoes_gerais: '' }); }}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="px-3 py-1.5 bg-[#0369a1] hover:bg-[#075985] text-white text-sm font-medium disabled:opacity-50"
                    onClick={add}
                    disabled={pending}
                  >
                    {pending ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

