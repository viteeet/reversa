'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj, formatCpf } from '@/lib/format';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import AtividadesManager from '@/components/atividades/AtividadesManager';
import { categoriasCedentes } from '@/config/cedentesCategorias';

// Mapeamento de tabelas de cedentes para sacados
const sacadoTableMapping: Record<string, string> = {
  'cedentes_enderecos': 'sacados_enderecos',
  'cedentes_telefones': 'sacados_telefones',
  'cedentes_emails': 'sacados_emails',
  'cedentes_qsa': 'sacados_qsa',
  'cedentes_qsa_detalhes': 'sacados_qsa_detalhes',
  'cedentes_processos': 'sacados_processos',
};

type Sacado = {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  situacao: string | null;
  porte: string | null;
  natureza_juridica: string | null;
  data_abertura: string | null;
  capital_social: number | null;
  atividade_principal_descricao: string | null;
  atividades_secundarias: string | null;
  simples_nacional: boolean | null;
  endereco_receita: string | null;
  telefone_receita: string | null;
  email_receita: string | null;
  grupo_empresa_id: string | null;
  grupo_empresa?: {
    id: string;
    nome_grupo: string;
    cnpj_matriz: string;
  };
};

type FoundDataItem = {
  id: string;
  tipo: string;
  titulo: string;
  conteudo: string;
  observacoes?: string;
  fonte?: string;
  data_encontrado?: string;
};

export default function SacadoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const cnpj = decodeURIComponent(params.cnpj as string);
  
  const [sacado, setSacado] = useState<Sacado | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'atividades'>('info');
  
  // Dados complementares
  const [categoriasData, setCategoriasData] = useState<Record<string, any[]>>({});
  const [observacoesGerais, setObservacoesGerais] = useState<string>('');
  const [processosTexto, setProcessosTexto] = useState<string>('');
  const [qsaDetalhes, setQsaDetalhes] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, [cnpj]);

  async function loadData() {
    setLoading(true);
    
    const { data: sacadoData } = await supabase
      .from('sacados')
      .select('*')
      .eq('cnpj', cnpj)
      .single();
    
    setSacado(sacadoData);
    
    // Carrega informações do grupo, se houver
    if (sacadoData?.grupo_empresa_id) {
      const { data: grupoData } = await supabase
        .from('empresas_grupo')
        .select('id, nome_grupo, cnpj_matriz')
        .eq('id', sacadoData.grupo_empresa_id)
        .single();
      
      if (grupoData) {
        // Conta quantos CNPJs estão no grupo
        const { count } = await supabase
          .from('empresas_grupo_cnpjs')
          .select('*', { count: 'exact', head: true })
          .eq('grupo_id', grupoData.id)
          .eq('ativo', true);
        
        // setGrupoInfo({
        //   nome_grupo: grupoData.nome_grupo,
        //   id: grupoData.id,
        //   cnpjs_count: count || 0
        // });
      }
    }
    
    await loadDadosComplementares();
    
    setLoading(false);
  }

  async function loadDadosComplementares() {
    if (!cnpj) return;
    
    try {
      // Carrega todas as categorias
      for (const categoria of categoriasCedentes) {
        try {
          const tableName = sacadoTableMapping[categoria.tableName] || categoria.tableName.replace('cedentes_', 'sacados_');
          const { data } = await supabase
            .from(tableName)
            .select('*')
            .eq('sacado_cnpj', cnpj)
            .order('created_at', { ascending: false });

          setCategoriasData(prev => ({
            ...prev,
            [categoria.id]: data || []
          }));
        } catch (error: any) {
          // Ignora erros de tabelas que não existem
          if (error.code !== 'PGRST116' && error.code !== '42P01') {
            console.error(`Erro ao carregar ${categoria.id}:`, error);
          }
        }
      }

      // Carrega observações gerais
      try {
        const { data } = await supabase
          .from('sacados')
          .select('observacoes_gerais')
          .eq('cnpj', cnpj)
          .single();
        setObservacoesGerais(data?.observacoes_gerais || '');
      } catch (error: any) {
        if (error.code !== 'PGRST116' && error.code !== '42P01') {
          console.error('Erro ao carregar observações:', error);
        }
      }

      // Carrega processos (texto simples)
      try {
        const processosData = categoriasData['processos'] || [];
        if (processosData.length > 0) {
          setProcessosTexto(processosData[0]?.processos_texto || '');
        }
      } catch (error) {
        // Ignora
      }

      // Carrega detalhes do QSA
      const qsaItems = categoriasData['qsa'] || [];
      if (qsaItems.length > 0) {
        const detalhesPromises = qsaItems.map(async (item) => {
          try {
            const { data } = await supabase
              .from('sacados_qsa_detalhes')
              .select('detalhes_completos')
              .eq('qsa_id', item.id)
              .single();
            return { id: item.id, detalhes: data?.detalhes_completos || '' };
          } catch {
            return { id: item.id, detalhes: '' };
          }
        });

        const detalhesResults = await Promise.all(detalhesPromises);
        const detalhesMap: Record<string, string> = {};
        detalhesResults.forEach(r => {
          detalhesMap[r.id] = r.detalhes;
        });
        setQsaDetalhes(detalhesMap);
      }
    } catch (error) {
      console.error('Erro ao carregar dados complementares:', error);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <div className="container max-w-6xl">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-slate-600">Carregando...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!sacado) {
    return (
      <main className="min-h-screen p-6">
        <div className="container max-w-6xl">
          <div className="text-center py-8">
            <p className="text-slate-600">Sacado não encontrado</p>
            <Button variant="primary" onClick={() => {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back();
  } else {
    router.push('/sacados');
  }
}} className="mt-4">
              Voltar
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="container max-w-6xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-slate-800 bg-clip-text text-transparent">
                {sacado.razao_social}
              </h1>
            </div>
            <p className="text-slate-600">{sacado.nome_fantasia}</p>
            <p className="text-sm text-slate-500 font-mono">{sacado.cnpj}</p>
          </div>
          <Button variant="secondary" onClick={() => {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back();
  } else {
    router.push('/sacados');
  }
}}>
            Voltar
          </Button>
        </header>

        {/* Abas */}
        <Card>
          <div className="border-b border-[#cbd5e1]">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('info')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'info'
                    ? 'border-[#0369a1] text-[#0369a1]'
                    : 'border-transparent text-[#64748b] hover:text-[#1e293b] hover:border-[#cbd5e1]'
                }`}
              >
                📋 Informações
              </button>
              <button
                onClick={() => setActiveTab('atividades')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'atividades'
                    ? 'border-[#0369a1] text-[#0369a1]'
                    : 'border-transparent text-[#64748b] hover:text-[#1e293b] hover:border-[#cbd5e1]'
                }`}
              >
                📞 Atividades
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'info' ? (
              <div className="space-y-6">
                {/* Informações Básicas */}
                <div className="bg-white border border-gray-300">
                  <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
                    <h2 className="text-xs font-semibold text-gray-700 uppercase">Informações Básicas</h2>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Razão Social</p>
                      <p className="text-sm font-medium text-gray-900">{sacado.razao_social}</p>
                    </div>
                    {sacado.nome_fantasia && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Nome Fantasia</p>
                        <p className="text-sm font-medium text-gray-900">{sacado.nome_fantasia}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">CNPJ</p>
                      <p className="text-sm font-mono text-gray-900">{formatCpfCnpj(sacado.cnpj)}</p>
                    </div>
                    {sacado.situacao && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Situação</p>
                        <Badge variant={sacado.situacao === 'ATIVA' ? 'success' : 'error'} size="sm">
                          {sacado.situacao}
                        </Badge>
                      </div>
                    )}
                    {sacado.porte && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Porte</p>
                        <p className="text-sm text-gray-900">{sacado.porte}</p>
                      </div>
                    )}
                    {sacado.natureza_juridica && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Natureza Jurídica</p>
                        <p className="text-sm text-gray-900">{sacado.natureza_juridica}</p>
                      </div>
                    )}
                    {sacado.data_abertura && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Data de Abertura</p>
                        <p className="text-sm text-gray-900">
                          {new Date(sacado.data_abertura).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}
                    {sacado.capital_social !== null && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Capital Social</p>
                        <p className="text-sm text-gray-900">
                          R$ {sacado.capital_social.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}
                    {sacado.atividade_principal_descricao && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Atividade Principal</p>
                        <p className="text-sm text-gray-900">{sacado.atividade_principal_descricao}</p>
                      </div>
                    )}
                    {sacado.atividades_secundarias && (
                      <div className="md:col-span-2 lg:col-span-3">
                        <p className="text-xs text-gray-500 uppercase mb-1">Atividades Secundárias</p>
                        <p className="text-sm text-gray-900">{sacado.atividades_secundarias}</p>
                      </div>
                    )}
                    {sacado.simples_nacional !== null && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Simples Nacional</p>
                        <Badge variant={sacado.simples_nacional ? 'success' : 'neutral'} size="sm">
                          {sacado.simples_nacional ? 'Sim' : 'Não'}
                        </Badge>
                      </div>
                    )}
                    {sacado.endereco_receita && (
                      <div className="md:col-span-2 lg:col-span-3">
                        <p className="text-xs text-gray-500 uppercase mb-1">Endereço (Receita)</p>
                        <p className="text-sm text-gray-900">{sacado.endereco_receita}</p>
                      </div>
                    )}
                    {sacado.telefone_receita && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Telefone (Receita)</p>
                        <p className="text-sm text-gray-900">{sacado.telefone_receita}</p>
                      </div>
                    )}
                    {sacado.email_receita && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Email (Receita)</p>
                        <p className="text-sm text-gray-900">{sacado.email_receita}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dados Complementares - Organizados por Grupos */}
                {(() => {
                  const categoriasPorGrupo: Record<string, typeof categoriasCedentes> = {};
                  categoriasCedentes
                    .filter(cat => cat.id !== 'qsa') // QSA é renderizado separadamente
                    .forEach(categoria => {
                      const grupo = categoria.group || 'outros';
                      if (!categoriasPorGrupo[grupo]) {
                        categoriasPorGrupo[grupo] = [];
                      }
                      categoriasPorGrupo[grupo].push(categoria);
                    });

                  const grupoLabels: Record<string, string> = {
                    'contatos': 'Informações de Contato',
                    'relacionamentos': 'Relacionamentos',
                    'outros': 'Outros'
                  };

                  return Object.entries(categoriasPorGrupo).map(([grupo, categorias]) => {
                    const temDados = categorias.some(cat => (categoriasData[cat.id] || []).length > 0);
                    if (!temDados) return null;

                    return (
                      <div key={grupo} className="space-y-4">
                        {grupo !== 'outros' && (
                          <h2 className="text-base font-semibold text-gray-700">
                            {grupoLabels[grupo] || grupo}
                          </h2>
                        )}
                        {categorias.map(categoria => {
                          const items = categoriasData[categoria.id] || [];
                          if (items.length === 0) return null;

                          return (
                            <div key={categoria.id} className="bg-white border border-gray-300">
                              <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
                                <h3 className="text-xs font-semibold text-gray-700 uppercase">
                                  {categoria.title || categoria.id}
                                  {items.length > 0 && (
                                    <span className="ml-2 text-gray-500">({items.length})</span>
                                  )}
                                </h3>
                              </div>
                              <div className="p-4">
                                <div className="space-y-3">
                                  {items.map((item: any, idx: number) => (
                                    <div key={item.id || idx} className="border-b border-gray-200 pb-3 last:border-0">
                                      {categoria.fields?.map(field => {
                                        const value = item[field.key];
                                        if (!value && field.key !== 'observacoes') return null;
                                        return (
                                          <div key={field.key} className="mb-2">
                                            <p className="text-xs text-gray-500 uppercase mb-1">
                                              {field.label}
                                            </p>
                                            <p className="text-sm text-gray-900">
                                              {field.key === 'cpf' && value ? formatCpf(value) :
                                               field.key === 'participacao' && value ? `${value}%` :
                                               value || '—'}
                                            </p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  });
                })()}

                {/* QSA com Detalhes */}
                {(() => {
                  const categoriaQsa = categoriasCedentes.find(c => c.id === 'qsa');
                  if (!categoriaQsa) return null;
                  const qsaItems = categoriasData['qsa'] || [];
                  if (qsaItems.length === 0) return null;

                  return (
                    <div className="bg-white border border-gray-300">
                      <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
                        <h2 className="text-xs font-semibold text-gray-700 uppercase">
                          {categoriaQsa.title} ({qsaItems.length})
                        </h2>
                      </div>
                      <div className="p-4">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                {categoriaQsa.fields?.map(field => (
                                  <th key={field.key} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-300">
                                    {field.label}
                                  </th>
                                ))}
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Detalhes</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {qsaItems.map((item: any, idx: number) => {
                                const detalhes = qsaDetalhes[item.id] || '';
                                return (
                                  <tr key={item.id || idx} className="hover:bg-gray-50">
                                    {categoriaQsa.fields?.map(field => {
                                      const value = item[field.key];
                                      return (
                                        <td key={field.key} className="px-3 py-2 text-gray-900 border-r border-gray-300">
                                          {field.key === 'cpf' && value ? formatCpf(value) :
                                           field.key === 'participacao' && value ? `${value}%` :
                                           value || '—'}
                                        </td>
                                      );
                                    })}
                                    <td className="px-3 py-2">
                                      {detalhes ? (
                                        <details className="cursor-pointer">
                                          <summary className="text-sm text-[#0369a1] hover:underline">
                                            Ver detalhes
                                          </summary>
                                          <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-700 whitespace-pre-wrap">
                                            {detalhes}
                                          </div>
                                        </details>
                                      ) : (
                                        <span className="text-gray-400">—</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Processos Judiciais */}
                {processosTexto && (
                  <div className="bg-white border border-gray-300">
                    <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
                      <h2 className="text-xs font-semibold text-gray-700 uppercase">Processos Judiciais e Informações Relevantes</h2>
                    </div>
                    <div className="p-4">
                      <div className="whitespace-pre-wrap text-sm text-gray-700">
                        {processosTexto}
                      </div>
                    </div>
                  </div>
                )}

                {/* Observações Gerais */}
                {observacoesGerais && (
                  <div className="bg-white border border-gray-300">
                    <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
                      <h2 className="text-xs font-semibold text-gray-700 uppercase">Observações Gerais</h2>
                    </div>
                    <div className="p-4">
                      <div className="whitespace-pre-wrap text-sm text-gray-700">
                        {observacoesGerais}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <AtividadesManager 
                tipo="sacado" 
                id={cnpj} 
                nome={sacado.nome_fantasia || sacado.razao_social} 
              />
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}