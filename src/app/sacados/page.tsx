'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj } from '@/lib/format';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

type Sacado = {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  grupo: string | null;
  endereco_receita: string | null;
  telefone_receita: string | null;
  email_receita: string | null;
  situacao: string | null;
  data_abertura: string | null;
  capital_social: number | null;
  atividade_principal_codigo: string | null;
  atividade_principal_descricao: string | null;
  atividades_secundarias: string | null;
  simples_nacional: boolean | null;
  porte: string | null;
  natureza_juridica: string | null;
  cedente_id: string;
  cedente: {
    id: string;
    nome: string;
    razao_social: string | null;
  } | null;
};

export default function SacadosPage() {
  const router = useRouter();
  const [items, setItems] = useState<Sacado[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [sortBy, setSortBy] = useState<'nome_fantasia' | 'razao_social' | 'cnpj' | 'situacao' | 'porte'>('nome_fantasia');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.replace('/login');

    setLoading(true);
    const { data, error } = await supabase
      .from('sacados')
      .select(`
        cnpj,
        razao_social,
        nome_fantasia,
        grupo,
        endereco_receita,
        telefone_receita,
        email_receita,
        situacao,
        data_abertura,
        capital_social,
        atividade_principal_codigo,
        atividade_principal_descricao,
        atividades_secundarias,
        simples_nacional,
        porte,
        natureza_juridica,
        cedente_id,
        cedente:cedentes!sacados_cedente_id_fkey(id, nome, razao_social)
      `)
      .order('razao_social', { ascending: true });
    
    if (error) {
      console.error('Erro ao carregar sacados:', error);
    } else {
      // Transforma cedente de array para objeto único ou null
      const dadosProcessados = (data ?? []).map(item => ({
        ...item,
        cedente: Array.isArray(item.cedente) 
          ? (item.cedente.length > 0 ? item.cedente[0] : null)
          : item.cedente
      }));
      setItems(dadosProcessados);
    }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter(s => {
      const cedenteNome = s.cedente?.nome?.toLowerCase() ?? '';
      const cedenteRazao = s.cedente?.razao_social?.toLowerCase() ?? '';
      return [
        s.cnpj, s.razao_social, s.nome_fantasia ?? '', s.grupo ?? '',
        s.endereco_receita ?? '', s.telefone_receita ?? '', s.email_receita ?? '',
        s.situacao ?? '', s.atividade_principal_descricao ?? '', s.porte ?? '',
        s.natureza_juridica ?? '', cedenteNome, cedenteRazao
      ]
        .some(v => v.toLowerCase().includes(t));
    });
  }, [items, q]);

  const sorted = useMemo(() => {
    const sortedItems = [...filtered];
    sortedItems.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortBy) {
        case 'nome_fantasia':
          aVal = a.nome_fantasia || '';
          bVal = b.nome_fantasia || '';
          break;
        case 'razao_social':
          aVal = a.razao_social || '';
          bVal = b.razao_social || '';
          break;
        case 'cnpj':
          aVal = a.cnpj || '';
          bVal = b.cnpj || '';
          break;
        case 'situacao':
          aVal = a.situacao || '';
          bVal = b.situacao || '';
          break;
        case 'porte':
          aVal = a.porte || '';
          bVal = b.porte || '';
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sortedItems;
  }, [filtered, sortBy, sortDir]);

  function onSort(col: 'nome_fantasia' | 'razao_social' | 'cnpj' | 'situacao' | 'porte') {
    if (sortBy === col) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6 bg-white">
        <div className="container max-w-6xl">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0369a1]"></div>
            <p className="mt-2 text-[#64748b]">Carregando...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container max-w-7xl mx-auto px-4 py-8 space-y-6">
        <header className="flex flex-col gap-4">
          <div>
            <button 
              onClick={() => router.push('/menu/operacional')}
              className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-lg bg-white border border-gray-200 hover:border-[#0369a1] hover:bg-blue-50 transition-all shadow-sm hover:shadow-md text-[#0369a1] font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </button>
            <h1 className="text-4xl font-bold text-[#0369a1] mb-2">Sacados</h1>
            <p className="text-[#64748b] text-lg">Visualização de todos os sacados cadastrados</p>
          </div>
        </header>

        {/* Toolbar */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            {/* Busca */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1">
                <Input
                  placeholder="🔍 Buscar por nome, CNPJ, cedente..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[#cbd5e1] hover:border-[#0369a1] hover:bg-blue-50 transition-all shadow-sm hover:shadow-md text-[#0369a1] font-medium"
                  onClick={() => setShowHelp(!showHelp)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Ajuda
                </button>
                {showHelp && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">ℹ️</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#0369a1] mb-1">Como cadastrar sacados</h3>
                        <p className="text-sm text-[#64748b] mb-3">
                          Os sacados (devedores) devem ser cadastrados dentro de um <strong>cedente</strong>. 
                          Acesse um cedente específico e adicione seus sacados na aba "Sacados".
                        </p>
                        <Link href="/cedentes" className="text-sm text-[#0369a1] hover:underline inline-block">
                          → Ver lista de cedentes
                        </Link>
                      </div>
                      <button
                        onClick={() => setShowHelp(false)}
                        className="text-[#64748b] hover:text-[#0369a1]"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <Button 
                variant="primary"
                onClick={() => router.push('/cedentes')}
              >
                Novo Sacado (via Cedente)
              </Button>
            </div>
          </div>

          {/* Contador de resultados */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm">
            <span className="text-[#64748b]">
              Exibindo <strong className="text-[#0369a1]">{sorted.length}</strong> de <strong className="text-[#0369a1]">{items.length}</strong> sacados
              {q && <span> (filtrado)</span>}
            </span>
            {q && (
              <Button variant="secondary" onClick={() => setQ('')} size="sm">
                Limpar busca
              </Button>
            )}
          </div>
        </div>

        <Card>
          <div className="space-y-4">

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#e0efff] to-[#f0f7ff]">
                  <tr>
                    <th 
                      className="px-4 py-3 text-center text-sm font-semibold text-[#0369a1] cursor-pointer select-none hover:bg-blue-100 transition-colors"
                      onClick={() => onSort('nome_fantasia')}
                    >
                      Nome Fantasia
                      {sortBy === 'nome_fantasia' && (
                        <span className="ml-1 text-[#64748b]">{sortDir === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </th>
                    <th 
                      className="px-4 py-3 text-center text-sm font-semibold text-[#0369a1] cursor-pointer select-none hover:bg-blue-100 transition-colors"
                      onClick={() => onSort('razao_social')}
                    >
                      Razão Social
                      {sortBy === 'razao_social' && (
                        <span className="ml-1 text-[#64748b]">{sortDir === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </th>
                    <th 
                      className="px-4 py-3 text-center text-sm font-semibold text-[#0369a1] cursor-pointer select-none hover:bg-blue-100 transition-colors"
                      onClick={() => onSort('cnpj')}
                    >
                      CNPJ
                      {sortBy === 'cnpj' && (
                        <span className="ml-1 text-[#64748b]">{sortDir === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-[#0369a1]">Cedente</th>
                    <th 
                      className="px-4 py-3 text-center text-sm font-semibold text-[#0369a1] cursor-pointer select-none hover:bg-blue-100 transition-colors"
                      onClick={() => onSort('situacao')}
                    >
                      Situação
                      {sortBy === 'situacao' && (
                        <span className="ml-1 text-[#64748b]">{sortDir === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </th>
                    <th 
                      className="px-4 py-3 text-center text-sm font-semibold text-[#0369a1] cursor-pointer select-none hover:bg-blue-100 transition-colors"
                      onClick={() => onSort('porte')}
                    >
                      Porte
                      {sortBy === 'porte' && (
                        <span className="ml-1 text-[#64748b]">{sortDir === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-[#0369a1]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#cbd5e1]">
                  {sorted.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#64748b]">
                        <div className="flex flex-col items-center gap-3">
                          <span className="text-4xl">📭</span>
                          <p>Nenhum sacado encontrado.</p>
                        </div>
                      </td>
                    </tr>
                  ) : sorted.map(s => (
                    <tr key={s.cnpj} className="hover:bg-[#f8fbff] transition-colors group">
                      <td className="px-4 py-3 text-sm text-[#1e293b] font-medium text-center">{s.nome_fantasia ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-[#64748b] text-center">{s.razao_social}</td>
                      <td className="px-4 py-3 text-sm text-[#64748b] font-mono text-center">{s.cnpj ? formatCpfCnpj(s.cnpj) : '—'}</td>
                      <td className="px-4 py-3 text-center">
                        {s.cedente ? (
                          <Link 
                            href={`/cedentes/${s.cedente.id}`}
                            className="text-sm text-[#0369a1] hover:underline font-medium"
                          >
                            {s.cedente.nome || s.cedente.razao_social || '—'}
                          </Link>
                        ) : (
                          <span className="text-sm text-[#94a3b8]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.situacao && (
                          <Badge variant={s.situacao === 'ATIVA' ? 'success' : s.situacao === 'INATIVA' ? 'error' : 'neutral'} size="sm">
                            {s.situacao}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#64748b] text-center">{s.porte ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                          <Link href={`/sacados/${encodeURIComponent(s.cnpj)}`}>
                            <button className="p-2 rounded-lg hover:bg-blue-50 transition-colors" title="Ver detalhes" aria-label="Ver">
                              👁️
                            </button>
                          </Link>
                          <Link href={`/sacados/${encodeURIComponent(s.cnpj)}/editar`}>
                            <button className="p-2 rounded-lg hover:bg-blue-50 transition-colors" title="Editar" aria-label="Editar">
                              ✏️
                            </button>
                          </Link>
                          <Link href={`/sacados/${encodeURIComponent(s.cnpj)}/cobranca`}>
                            <button className="p-2 rounded-lg hover:bg-blue-50 transition-colors" title="Ficha de cobrança" aria-label="Ficha">
                              📄
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
            </table>
          </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
