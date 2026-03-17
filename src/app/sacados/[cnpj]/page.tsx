'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj, formatCpf } from '@/lib/format';
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
};

export default function SacadoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cnpj = decodeURIComponent(params.cnpj as string);
  
  const [sacado, setSacado] = useState<Sacado | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'atividades'>('info');
  const [grupoInfo, setGrupoInfo] = useState<{ nome_grupo: string; id: string; cnpjs_count: number } | null>(null);
  
  // Dados complementares
  const [categoriasData, setCategoriasData] = useState<Record<string, any[]>>({});
  const [observacoesGerais, setObservacoesGerais] = useState<string>('');
  const [processosTexto, setProcessosTexto] = useState<string>('');
  const [qsaDetalhes, setQsaDetalhes] = useState<Record<string, string>>({});

  function formatCategoriaValue(fieldKey: string, value: any) {
    if (value === null || value === undefined || value === '') return '—';
    if (fieldKey === 'cpf') return formatCpf(String(value));
    if (fieldKey === 'cnpj' || fieldKey === 'cnpj_relacionado') return formatCpfCnpj(String(value));
    if (fieldKey === 'participacao') return `${value}%`;
    return String(value);
  }

  useEffect(() => {
    loadData();
    
    // Verifica se há tab na URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      if (tab && ['info', 'atividades'].includes(tab)) {
        setActiveTab(tab as 'info' | 'atividades');
      }
    }
  }, [cnpj]);

  async function loadData() {
    setLoading(true);
    
    const { data: sacadoData, error: sacadoError } = await supabase
      .from('sacados')
      .select('*')
      .eq('cnpj', cnpj)
      .single();
    
    if (sacadoError) {
      console.error('Erro ao carregar sacado:', sacadoError);
    } else {
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
          
          setGrupoInfo({
            nome_grupo: grupoData.nome_grupo,
            id: grupoData.id,
            cnpjs_count: count || 0
          });
        }
      }
    }
    
    await loadDadosComplementares();
    
    setLoading(false);
  }

  async function loadDadosComplementares() {
    if (!cnpj) return;
    
    try {
      const categoriasTemp: Record<string, any[]> = {};
      
      // Carrega todas as categorias
      for (const categoria of categoriasCedentes) {
        try {
          const tableName = sacadoTableMapping[categoria.tableName] || categoria.tableName.replace('cedentes_', 'sacados_');
          const { data } = await supabase
            .from(tableName)
            .select('*')
            .eq('sacado_cnpj', cnpj)
            .eq('ativo', true)
            .order('created_at', { ascending: false });
          
          categoriasTemp[categoria.id] = data || [];
        } catch (err) {
          // Tabela pode não existir
          categoriasTemp[categoria.id] = [];
        }
      }
      
      setCategoriasData(categoriasTemp);
      
      // Carrega observações e processos da mesma fonte usada na edição
      try {
        const { data } = await supabase
          .from('sacados_observacoes_gerais')
          .select('observacoes, processos_texto')
          .eq('sacado_cnpj', cnpj)
          .single();

        if (data) {
          setObservacoesGerais(data.observacoes || '');
          setProcessosTexto(data.processos_texto || '');
        } else {
          setObservacoesGerais('');
          setProcessosTexto('');
        }
      } catch (err) {
        // Fallback para estrutura legada, caso a tabela nova ainda nao exista
        try {
          const { data: observacoesLegacy } = await supabase
            .from('sacados')
            .select('observacoes_gerais')
            .eq('cnpj', cnpj)
            .single();

          setObservacoesGerais(observacoesLegacy?.observacoes_gerais || '');
        } catch {
          setObservacoesGerais('');
        }

        try {
          const { data: processosLegacy } = await supabase
            .from('sacados_processos')
            .select('processos_texto')
            .eq('sacado_cnpj', cnpj)
            .single();

          setProcessosTexto(processosLegacy?.processos_texto || '');
        } catch {
          setProcessosTexto('');
        }
      }
      
      // Carrega detalhes do QSA (após carregar os dados do QSA)
      try {
        const qsaItems = categoriasTemp['qsa'] || [];
        if (qsaItems.length > 0) {
          const detalhesPromises = qsaItems.map(async (item) => {
            const { data } = await supabase
              .from('sacados_qsa_detalhes')
              .select('detalhes_completos')
              .eq('qsa_id', item.id)
              .single();
            
            return { id: item.id, detalhes: data?.detalhes_completos || '' };
          });
          
          const detalhes = await Promise.all(detalhesPromises);
          const detalhesMap: Record<string, string> = {};
          detalhes.forEach(d => {
            if (d.id) detalhesMap[d.id] = d.detalhes;
          });
          setQsaDetalhes(detalhesMap);
        }
      } catch (err) {
        // Ignora erros
      }
    } catch (err) {
      console.error('Erro ao carregar dados complementares:', err);
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

  if (!sacado) {
    return (
      <main className="min-h-screen p-6 bg-white">
        <div className="container max-w-6xl">
          <div className="text-center py-8">
            <p className="text-[#64748b]">Sacado não encontrado</p>
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
    <main className="min-h-screen bg-gray-50">
      <div className="container max-w-6xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <header className="mb-4">
          <button 
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/sacados');
              }
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 bg-white border border-gray-300 hover:bg-gray-50 text-[#0369a1] text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
          <div className="border-b-2 border-[#0369a1] pb-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold text-[#0369a1]">{sacado.razao_social}</h1>
                {grupoInfo && (
                  <Link href={`/empresas-grupo/${grupoInfo.id}`}>
                    <Badge variant="info" className="cursor-pointer hover:opacity-80">
                      🏭 {grupoInfo.nome_grupo} ({grupoInfo.cnpjs_count} CNPJs)
                    </Badge>
                  </Link>
                )}
              </div>
              {sacado.nome_fantasia && <p className="text-sm text-gray-600">{sacado.nome_fantasia}</p>}
              <p className="text-xs text-gray-500 font-mono">{formatCpfCnpj(sacado.cnpj)}</p>
            </div>
            <button
              className="px-3 py-1.5 border border-[#0369a1] bg-[#0369a1] text-white text-sm font-medium hover:bg-[#075985]"
              onClick={() => router.push(`/sacados/${encodeURIComponent(cnpj)}/editar?mode=edit`)}
            >
              Editar
            </button>
          </div>
        </header>

        {/* Abas */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('info')}
                className={`px-4 py-2 text-sm font-medium border-r border-gray-300 ${
                  activeTab === 'info'
                    ? 'bg-white text-[#0369a1] border-b-2 border-[#0369a1] -mb-[2px]'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Informações
              </button>
              <button
                onClick={() => setActiveTab('atividades')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'atividades'
                    ? 'bg-white text-[#0369a1] border-b-2 border-[#0369a1] -mb-[2px]'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Atividades
              </button>
            </nav>
          </div>

          <div className="p-4">
            {activeTab === 'info' ? (
              <div className="space-y-4">
                {/* Informações Básicas */}
                <div className="compact-table-shell">
                  <div className="compact-table-title">
                    <h2 className="compact-table-title-main">Informacoes Basicas</h2>
                  </div>
                  <table className="info-basic-kv">
                    <tbody>
                      <tr>
                        <td className="info-basic-kv-label">Razao Social</td>
                        <td className="info-basic-kv-value">{sacado.razao_social}</td>
                      </tr>
                      {sacado.nome_fantasia && (
                        <tr>
                          <td className="info-basic-kv-label">Nome Fantasia</td>
                          <td className="info-basic-kv-value">{sacado.nome_fantasia}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="info-basic-kv-label">CNPJ</td>
                        <td className="info-basic-kv-value font-mono">{formatCpfCnpj(sacado.cnpj)}</td>
                      </tr>
                      {sacado.porte && (
                        <tr>
                          <td className="info-basic-kv-label">Porte</td>
                          <td className="info-basic-kv-value">{sacado.porte}</td>
                        </tr>
                      )}
                      {sacado.natureza_juridica && (
                        <tr>
                          <td className="info-basic-kv-label">Natureza Juridica</td>
                          <td className="info-basic-kv-value">{sacado.natureza_juridica}</td>
                        </tr>
                      )}
                      {sacado.situacao && (
                        <tr>
                          <td className="info-basic-kv-label">Situacao</td>
                          <td className="info-basic-kv-value">
                            <Badge variant={sacado.situacao === 'ATIVA' ? 'success' : sacado.situacao === 'INATIVA' ? 'error' : 'neutral'} size="sm">
                              {sacado.situacao}
                            </Badge>
                          </td>
                        </tr>
                      )}
                      {sacado.data_abertura && (
                        <tr>
                          <td className="info-basic-kv-label">Data Abertura</td>
                          <td className="info-basic-kv-value">{new Date(sacado.data_abertura).toLocaleDateString('pt-BR')}</td>
                        </tr>
                      )}
                      {sacado.capital_social !== null && (
                        <tr>
                          <td className="info-basic-kv-label">Capital Social</td>
                          <td className="info-basic-kv-value">R$ {sacado.capital_social.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      )}
                      {sacado.simples_nacional !== null && (
                        <tr>
                          <td className="info-basic-kv-label">Simples Nacional</td>
                          <td className="info-basic-kv-value">
                            <Badge variant={sacado.simples_nacional ? 'success' : 'neutral'} size="sm">
                              {sacado.simples_nacional ? 'Sim' : 'Nao'}
                            </Badge>
                          </td>
                        </tr>
                      )}
                      {sacado.telefone_receita && (
                        <tr>
                          <td className="info-basic-kv-label">Telefone</td>
                          <td className="info-basic-kv-value">{sacado.telefone_receita}</td>
                        </tr>
                      )}
                      {sacado.email_receita && (
                        <tr>
                          <td className="info-basic-kv-label">E-mail</td>
                          <td className="info-basic-kv-value">{sacado.email_receita}</td>
                        </tr>
                      )}
                      {sacado.endereco_receita && (
                        <tr>
                          <td className="info-basic-kv-label">Endereco</td>
                          <td className="info-basic-kv-value">{sacado.endereco_receita}</td>
                        </tr>
                      )}
                      {sacado.atividade_principal_descricao && (
                        <tr>
                          <td className="info-basic-kv-label">Atividade Principal</td>
                          <td className="info-basic-kv-value">{sacado.atividade_principal_descricao}</td>
                        </tr>
                      )}
                      {sacado.atividades_secundarias && (
                        <tr>
                          <td className="info-basic-kv-label">Ativ. Secundarias</td>
                          <td className="info-basic-kv-value whitespace-pre-line">{sacado.atividades_secundarias}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Observações Gerais */}
                {observacoesGerais && (
                  <div className="bg-white border border-gray-300 p-4">
                    <div className="border-b border-gray-300 bg-gray-100 -mx-4 -mt-4 px-4 py-2 mb-4">
                      <h2 className="text-xs font-semibold text-gray-700 uppercase">Observações Gerais</h2>
                    </div>
                    <div className="prose prose-sm max-w-none text-gray-900" dangerouslySetInnerHTML={{ __html: observacoesGerais }} />
                  </div>
                )}

                {/* Categorias dinâmicas (baseadas na configuração) */}
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
                          <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                            {grupoLabels[grupo] || grupo}
                          </h2>
                        )}
                        <div className="space-y-4">
                          {categorias.map(categoria => {
                            const items = categoriasData[categoria.id] || [];
                            if (items.length === 0) return null;

                            return (
                              <div key={categoria.id} className="bg-white border border-gray-300">
                                <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
                                  <h2 className="text-xs font-semibold text-gray-700 uppercase">
                                    {categoria.title} ({items.length})
                                  </h2>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="w-full border-collapse text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-300">
                                      <tr>
                                        {categoria.fields.map(fieldConfig => (
                                          <th key={fieldConfig.key} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300 align-top whitespace-nowrap">
                                            {fieldConfig.label}
                                          </th>
                                        ))}
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase align-top whitespace-nowrap">
                                          Origem
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {items.map((item, idx) => (
                                        <tr key={item.id || idx} className="border-b border-gray-200 hover:bg-gray-50 align-top">
                                          {categoria.fields.map(fieldConfig => (
                                            <td key={fieldConfig.key} className={`px-3 py-2 text-gray-900 border-r border-gray-300 align-top ${fieldConfig.type === 'textarea' || fieldConfig.width === 'full' ? 'whitespace-pre-wrap min-w-[260px]' : 'whitespace-nowrap'}`}>
                                              {formatCategoriaValue(fieldConfig.key, item[fieldConfig.key])}
                                            </td>
                                          ))}
                                          <td className="px-3 py-2 align-top whitespace-nowrap">
                                            {item.origem === 'api' ? (
                                              <span className="inline-block text-xs text-[#0369a1] bg-blue-50 px-2 py-1 rounded">API</span>
                                            ) : (
                                              <span className="inline-block text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">Manual</span>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}

                {/* QSA - Quadro de Sócios */}
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
                          <table className="w-full border-collapse text-sm">
                            <thead className="bg-gray-50 border-b border-gray-300">
                              <tr>
                                {categoriaQsa.fields.map(fieldConfig => (
                                  <th key={fieldConfig.key} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">
                                    {fieldConfig.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {qsaItems.map((item, idx) => (
                                [
                                  <tr key={`qsa-row-${item.id || idx}`} className="border-b border-gray-200 hover:bg-gray-50">
                                    {categoriaQsa.fields.map(fieldConfig => {
                                      const value = item[fieldConfig.key];
                                      return (
                                        <td key={fieldConfig.key} className="px-3 py-2 text-gray-900 border-r border-gray-300">
                                          {formatCategoriaValue(fieldConfig.key, value)}
                                        </td>
                                      );
                                    })}
                                  </tr>,
                                  qsaDetalhes[item.id] ? (
                                    <tr key={`qsa-details-${item.id || idx}`} className="border-b border-gray-200 bg-gray-50">
                                      <td colSpan={categoriaQsa.fields.length} className="px-3 py-2 text-sm text-gray-800 whitespace-pre-wrap">
                                        <span className="font-medium text-gray-900">Detalhes completos:</span> {qsaDetalhes[item.id]}
                                      </td>
                                    </tr>
                                  ) : null
                                ]
                              ))}
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
                      <div className="whitespace-pre-line text-sm text-gray-900 font-mono bg-gray-50 p-3 rounded border border-gray-200">
                        {processosTexto}
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
        </div>
      </div>
    </main>
  );
}
