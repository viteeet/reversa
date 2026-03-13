'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj, formatCpf, formatMoney } from '@/lib/format';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import AtividadesManager from '@/components/atividades/AtividadesManager';
import TitulosNegociadosManager from '@/components/titulos/TitulosNegociadosManager';
import TitulosAtividadesManager from '@/components/atividades/TitulosAtividadesManager';
import AcordosManager from '@/components/titulos/AcordosManager';
import { categoriasCedentes } from '@/config/cedentesCategorias';

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
  grupo_empresa_id: string | null;
};

type Sacado = {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  situacao: string | null;
  porte: string | null;
  atividade_principal_descricao: string | null;
};

export default function CedentePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [cedente, setCedente] = useState<Cedente | null>(null);
  const [sacados, setSacados] = useState<Sacado[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'sacados' | 'titulos' | 'acordos' | 'atividades'>('info');
  const [sacadosQuery, setSacadosQuery] = useState('');
  const [grupoInfo, setGrupoInfo] = useState<{ nome_grupo: string; id: string; cnpjs_count: number } | null>(null);
  const [showCobrancaModal, setShowCobrancaModal] = useState(false);
  const [titulosCedente, setTitulosCedente] = useState<any[]>([]);
  const [tituloSelecionadoCobranca, setTituloSelecionadoCobranca] = useState<{ id: string; numero_titulo: string; sacado_nome: string } | null>(null);
  
  // Dados complementares
  const [categoriasData, setCategoriasData] = useState<Record<string, any[]>>({});
  const [observacoesGerais, setObservacoesGerais] = useState<string>('');
  const [processosTexto, setProcessosTexto] = useState<string>('');
  const [qsaDetalhes, setQsaDetalhes] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
    
    // Verifica se há tab na URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      if (tab && ['info', 'sacados', 'titulos', 'acordos', 'atividades'].includes(tab)) {
        setActiveTab(tab as 'info' | 'sacados' | 'titulos' | 'acordos' | 'atividades');
      }
    }
  }, [id]);

  useEffect(() => {
    if (showCobrancaModal) {
      loadTitulosCedente();
    }
  }, [showCobrancaModal, id]);

  async function loadData() {
    setLoading(true);
    
    // Carrega cedente
    const { data: cedenteData, error: cedenteError } = await supabase
      .from('cedentes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (cedenteError) {
      console.error('Erro ao carregar cedente:', cedenteError);
    } else {
      setCedente(cedenteData);
      
      // Carrega informações do grupo, se houver
      if (cedenteData?.grupo_empresa_id) {
        const { data: grupoData } = await supabase
          .from('empresas_grupo')
          .select('id, nome_grupo, cnpj_matriz')
          .eq('id', cedenteData.grupo_empresa_id)
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

    // Carrega sacados deste cedente
    await loadSacados();
    
    // Carrega dados complementares das APIs
    await loadDadosComplementares();
    
    setLoading(false);
  }

  async function loadTitulosCedente() {
    try {
      const { data, error } = await supabase
        .from('titulos_negociados')
        .select(`
          id,
          numero_titulo,
          valor_atualizado,
          data_vencimento_original,
          status,
          sacado_cnpj,
          sacados!titulos_negociados_sacado_cnpj_fkey (
            razao_social,
            nome_fantasia
          )
        `)
        .eq('cedente_id', id)
        .eq('ativo', true)
        .order('data_vencimento_original', { ascending: false });

      if (error) throw error;

      const titulosComSacado = (data || []).map((titulo: any) => {
        const sacado = Array.isArray(titulo.sacados) ? titulo.sacados[0] : titulo.sacados;
        return {
          id: titulo.id,
          numero_titulo: titulo.numero_titulo,
          valor_atualizado: titulo.valor_atualizado,
          data_vencimento_original: titulo.data_vencimento_original,
          status: titulo.status,
          sacado_nome: sacado?.nome_fantasia || sacado?.razao_social || 'Sem sacado',
          sacado_cnpj: titulo.sacado_cnpj
        };
      });

      setTitulosCedente(titulosComSacado);
    } catch (error) {
      console.error('Erro ao carregar títulos:', error);
      setTitulosCedente([]);
    }
  }

  async function loadDadosComplementares() {
    if (!id) return;
    
    try {
      // Carrega todas as categorias
      for (const categoria of categoriasCedentes) {
        try {
          const { data } = await supabase
            .from(categoria.tableName)
            .select('*')
            .eq('cedente_id', id)
            .eq('ativo', true)
            .order('created_at', { ascending: false });
          
          setCategoriasData(prev => ({
            ...prev,
            [categoria.id]: data || []
          }));
        } catch (err) {
          // Tabela pode não existir
          setCategoriasData(prev => ({
            ...prev,
            [categoria.id]: []
          }));
        }
      }
      
      // Carrega observações gerais
      try {
        const { data } = await supabase
          .from('cedentes_observacoes_gerais')
          .select('observacoes')
          .eq('cedente_id', id)
          .single();
        
        setObservacoesGerais(data?.observacoes || '');
      } catch (err) {
        setObservacoesGerais('');
      }
      
      // Carrega processos
      try {
        const { data } = await supabase
          .from('cedentes_observacoes_gerais')
          .select('processos_texto')
          .eq('cedente_id', id)
          .single();
        
        setProcessosTexto(data?.processos_texto || '');
      } catch (err) {
        setProcessosTexto('');
      }
      
      // Carrega detalhes do QSA (após carregar os dados do QSA)
      try {
        const qsaItems = categoriasData['qsa'] || [];
        if (qsaItems.length > 0) {
          const detalhesPromises = qsaItems.map(async (item) => {
            const { data } = await supabase
              .from('cedentes_qsa_detalhes')
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

  async function loadSacados() {
    try {
      const { data, error } = await supabase
        .from('sacados')
        .select('cnpj, razao_social, nome_fantasia, situacao, porte, atividade_principal_descricao')
        .eq('cedente_id', id)
        .order('razao_social', { ascending: true });
      
      if (error) {
        // Não loga erro se a tabela não existir ou não tiver permissão
        if (error.code !== 'PGRST116' && error.code !== '42P01' && error.code !== '42501') {
          console.error('Erro ao carregar sacados:', error);
        }
        setSacados([]);
      } else {
        setSacados(data || []);
      }
    } catch (err) {
      // Silenciosamente trata erros
      setSacados([]);
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

  if (!cedente) {
    return (
      <main className="min-h-screen p-6 bg-white">
        <div className="container max-w-6xl">
          <div className="text-center py-8">
            <p className="text-[#64748b]">Cedente não encontrado</p>
            <Button variant="primary" onClick={() => {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back();
  } else {
    router.push('/cedentes');
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
                router.push('/cedentes');
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
                <h1 className="text-3xl font-bold text-[#0369a1]">{cedente.nome}</h1>
                {grupoInfo && (
                  <Link href={`/empresas-grupo/${grupoInfo.id}`}>
                    <Badge variant="info" className="cursor-pointer hover:opacity-80">
                      🏭 {grupoInfo.nome_grupo} ({grupoInfo.cnpjs_count} CNPJs)
                    </Badge>
                  </Link>
                )}
              </div>
              {cedente.razao_social && <p className="text-sm text-gray-600">{cedente.razao_social}</p>}
              {cedente.cnpj && <p className="text-xs text-gray-500 font-mono">{formatCpfCnpj(cedente.cnpj)}</p>}
            </div>
            <div className="flex gap-2">
              <button
                className="px-3 py-1.5 border border-[#0369a1] bg-white text-[#0369a1] text-sm font-medium hover:bg-blue-50"
                onClick={() => setShowCobrancaModal(true)}
              >
                Cobrança
              </button>
              <button
                className="px-3 py-1.5 border border-[#0369a1] bg-[#0369a1] text-white text-sm font-medium hover:bg-[#075985]"
                onClick={() => router.push(`/cedentes/${cedente.id}/editar`)}
              >
                Editar
              </button>
            </div>
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
                onClick={() => setActiveTab('sacados')}
                className={`px-4 py-2 text-sm font-medium border-r border-gray-300 ${
                  activeTab === 'sacados'
                    ? 'bg-white text-[#0369a1] border-b-2 border-[#0369a1] -mb-[2px]'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Sacados ({sacados.length})
              </button>
              <button
                onClick={() => setActiveTab('titulos')}
                className={`px-4 py-2 text-sm font-medium border-r border-gray-300 ${
                  activeTab === 'titulos'
                    ? 'bg-white text-[#0369a1] border-b-2 border-[#0369a1] -mb-[2px]'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Títulos
              </button>
              <button
                onClick={() => setActiveTab('acordos')}
                className={`px-4 py-2 text-sm font-medium border-r border-gray-300 ${
                  activeTab === 'acordos'
                    ? 'bg-white text-[#0369a1] border-b-2 border-[#0369a1] -mb-[2px]'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Acordos
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
                <div className="bg-white border border-gray-300 p-4">
                  <div className="border-b border-gray-300 bg-gray-100 -mx-4 -mt-4 px-4 py-2 mb-4">
                    <h2 className="text-xs font-semibold text-gray-700 uppercase">Informações Básicas</h2>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Nome</p>
                      <p className="text-sm text-gray-900">{cedente.nome}</p>
                    </div>
                    {cedente.razao_social && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Razão Social</p>
                        <p className="text-sm text-gray-900">{cedente.razao_social}</p>
                      </div>
                    )}
                    {cedente.cnpj && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">CNPJ</p>
                        <p className="text-sm text-gray-900 font-mono">{formatCpfCnpj(cedente.cnpj)}</p>
                      </div>
                    )}
                    {cedente.situacao && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Situação</p>
                        <Badge variant={cedente.situacao === 'ATIVA' ? 'success' : cedente.situacao === 'INATIVA' ? 'error' : 'neutral'} size="sm">
                          {cedente.situacao}
                        </Badge>
                      </div>
                    )}
                    {cedente.porte && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Porte</p>
                        <p className="text-sm text-gray-900">{cedente.porte}</p>
                      </div>
                    )}
                    {cedente.natureza_juridica && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Natureza Jurídica</p>
                        <p className="text-sm text-gray-900">{cedente.natureza_juridica}</p>
                      </div>
                    )}
                    {cedente.data_abertura && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Data de Abertura</p>
                        <p className="text-sm text-gray-900">{new Date(cedente.data_abertura).toLocaleDateString('pt-BR')}</p>
                      </div>
                    )}
                    {cedente.capital_social && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Capital Social</p>
                        <p className="text-sm text-gray-900">R$ {cedente.capital_social.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    )}
                    {cedente.simples_nacional !== null && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Simples Nacional</p>
                        <Badge variant={cedente.simples_nacional ? 'success' : 'neutral'} size="sm">
                          {cedente.simples_nacional ? 'Sim' : 'Não'}
                        </Badge>
                      </div>
                    )}
                    {cedente.telefone && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Telefone</p>
                        <p className="text-sm text-gray-900">{cedente.telefone}</p>
                      </div>
                    )}
                    {cedente.email && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">E-mail</p>
                        <p className="text-sm text-gray-900">{cedente.email}</p>
                      </div>
                    )}
                    {cedente.endereco && (
                      <div className="md:col-span-2">
                        <p className="text-xs text-gray-500 uppercase mb-1">Endereço</p>
                        <p className="text-sm text-gray-900">{cedente.endereco}</p>
                      </div>
                    )}
                    {cedente.atividade_principal_codigo && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Código da Atividade Principal</p>
                        <p className="text-sm text-gray-900 font-mono">{cedente.atividade_principal_codigo}</p>
                      </div>
                    )}
                    {cedente.atividade_principal_descricao && (
                      <div className="md:col-span-2">
                        <p className="text-xs text-gray-500 uppercase mb-1">Atividade Principal</p>
                        <p className="text-sm text-gray-900">{cedente.atividade_principal_descricao}</p>
                      </div>
                    )}
                    {cedente.atividades_secundarias && (
                      <div className="md:col-span-2">
                        <p className="text-xs text-gray-500 uppercase mb-1">Atividades Secundárias</p>
                        <p className="text-sm text-gray-900 whitespace-pre-line">{cedente.atividades_secundarias}</p>
                      </div>
                    )}
                  </div>
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
                                <div className="p-4">
                                  <div className="space-y-3">
                                    {items.map((item, idx) => (
                                      <div key={item.id || idx} className="border-b border-gray-200 pb-3 last:border-b-0">
                                        <div className="grid gap-2 sm:grid-cols-2">
                                          {categoria.displayFields.map(field => {
                                            const fieldConfig = categoria.fields.find(f => f.key === field);
                                            if (!fieldConfig) return null;
                                            const value = item[field];
                                            if (!value && value !== 0) return null;
                                            
                                            return (
                                              <div key={field}>
                                                <p className="text-xs text-gray-500 uppercase mb-1">{fieldConfig.label}</p>
                                                <p className="text-sm text-gray-900">
                                                  {field === 'cpf' && value ? formatCpf(value) : 
                                                   field === 'cnpj' && value ? formatCpfCnpj(value) :
                                                   String(value)}
                                                </p>
                                              </div>
                                            );
                                          })}
                                        </div>
                                        {item.origem === 'api' && (
                                          <span className="inline-block mt-2 text-xs text-[#0369a1] bg-blue-50 px-2 py-1 rounded">API</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
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
                                {categoriaQsa.displayFields.map(field => {
                                  const fieldConfig = categoriaQsa.fields.find(f => f.key === field);
                                  return (
                                    <th key={field} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">
                                      {fieldConfig?.label || field}
                                    </th>
                                  );
                                })}
                              </tr>
                            </thead>
                            <tbody>
                              {qsaItems.map((item, idx) => (
                                <tr key={item.id || idx} className="border-b border-gray-200 hover:bg-gray-50">
                                  {categoriaQsa.displayFields.map(field => {
                                    const value = item[field];
                                    return (
                                      <td key={field} className="px-3 py-2 text-gray-900 border-r border-gray-300">
                                        {field === 'cpf' && value ? formatCpf(value) :
                                         field === 'participacao' && value ? `${value}%` :
                                         value || '—'}
                                      </td>
                                    );
                                  })}
                                </tr>
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
            ) : activeTab === 'sacados' ? (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-gray-300">
                  <div>
                    <h2 className="text-base font-semibold text-gray-700">Sacados do Cedente</h2>
                    <p className="text-xs text-gray-600">Visualização dos sacados (devedores) deste cedente. Para adicionar ou editar, use a página de edição.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      value={sacadosQuery}
                      onChange={(e) => setSacadosQuery(e.target.value)}
                      placeholder="Buscar sacado (nome, CNPJ)"
                      className="px-3 py-2 border border-gray-300 text-sm"
                    />
                    <button 
                      className="px-3 py-1.5 border border-[#0369a1] bg-[#0369a1] text-white text-sm font-medium hover:bg-[#075985]"
                      onClick={() => router.push(`/cedentes/${cedente.id}/editar`)}
                    >
                      Ir para Edição
                    </button>
                  </div>
                </div>

                {sacados.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 border border-gray-300">
                    <p className="text-gray-600 mb-2">Nenhum sacado cadastrado ainda</p>
                    <p className="text-xs text-gray-500 mb-4">
                      Para adicionar sacados, acesse a página de edição
                    </p>
                    <button 
                      className="px-4 py-2 border border-[#0369a1] bg-[#0369a1] text-white text-sm font-medium hover:bg-[#075985]"
                      onClick={() => router.push(`/cedentes/${cedente.id}/editar`)}
                    >
                      Ir para Edição
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead className="bg-gray-100 border-b-2 border-gray-300">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Razão Social</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Nome Fantasia</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">CNPJ</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Situação</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sacados
                          .filter(s => {
                            const t = sacadosQuery.trim().toLowerCase();
                            if (!t) return true;
                            return (
                              s.razao_social.toLowerCase().includes(t) ||
                              (s.nome_fantasia || '').toLowerCase().includes(t) ||
                              s.cnpj.replace(/\D+/g, '').includes(t.replace(/\D+/g, ''))
                            );
                          })
                          .map(sacado => (
                          <tr key={sacado.cnpj} className="hover:bg-gray-50 border-b border-gray-300">
                            <td className="px-4 py-2 text-sm text-gray-900 font-medium border-r border-gray-300">{sacado.razao_social}</td>
                            <td className="px-4 py-2 text-sm text-gray-600 border-r border-gray-300">{sacado.nome_fantasia || '—'}</td>
                            <td className="px-4 py-2 text-sm text-gray-600 font-mono border-r border-gray-300">{formatCpfCnpj(sacado.cnpj)}</td>
                            <td className="px-4 py-2 border-r border-gray-300">
                              {sacado.situacao && (
                                <Badge variant={sacado.situacao === 'ATIVA' ? 'success' : 'error'} size="sm">
                                  {sacado.situacao}
                                </Badge>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex gap-1">
                                <Link href={`/sacados/${encodeURIComponent(sacado.cnpj)}`}>
                                  <button className="px-2 py-1 border border-gray-300 bg-white hover:bg-gray-50 text-[#0369a1] text-xs font-medium" title="Ver">Ver</button>
                                </Link>
                                <Link href={`/sacados/${encodeURIComponent(sacado.cnpj)}/editar`}>
                                  <button className="px-2 py-1 border border-gray-300 bg-white hover:bg-gray-50 text-[#0369a1] text-xs font-medium" title="Editar">Editar</button>
                                </Link>
                                <Link href={`/sacados/${encodeURIComponent(sacado.cnpj)}/cobranca`}>
                                  <button className="px-2 py-1 border border-gray-300 bg-white hover:bg-gray-50 text-[#0369a1] text-xs font-medium" title="Ficha">Ficha</button>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : activeTab === 'titulos' ? (
              <TitulosNegociadosManager cedenteId={id} />
            ) : activeTab === 'acordos' ? (
              <AcordosManager cedenteId={id} />
            ) : (
              <AtividadesManager 
                tipo="cedente" 
                id={id} 
                nome={cedente.nome} 
              />
            )}
          </div>
        </div>

        {cedente.ultima_atualizacao && (
          <div className="bg-white border border-gray-300 p-3">
            <p className="text-xs text-gray-600 text-center">
              Última atualização: {new Date(cedente.ultima_atualizacao).toLocaleString('pt-BR')}
            </p>
          </div>
        )}

        {/* Modal de Cobrança - Seleção de Título */}
        {showCobrancaModal && !tituloSelecionadoCobranca && (
          <Modal
            isOpen={showCobrancaModal}
            onClose={() => {
              setShowCobrancaModal(false);
              setTitulosCedente([]);
            }}
            title={`Cobrança - ${cedente.nome}`}
            size="2xl"
          >
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Selecione um título para registrar a cobrança:
              </p>
              
              {titulosCedente.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Carregando títulos...
                </div>
              ) : (
                <div className="border border-gray-300 rounded">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b border-gray-300">
                        <tr>
                          <th className="px-2 py-1.5 text-left border-r border-gray-300 font-semibold text-gray-700">Nº Título</th>
                          <th className="px-2 py-1.5 text-left border-r border-gray-300 font-semibold text-gray-700">Sacado</th>
                          <th className="px-2 py-1.5 text-left border-r border-gray-300 font-semibold text-gray-700">Vencimento</th>
                          <th className="px-2 py-1.5 text-right border-r border-gray-300 font-semibold text-gray-700">Valor</th>
                          <th className="px-2 py-1.5 text-center font-semibold text-gray-700">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {titulosCedente.map((titulo) => (
                          <tr key={titulo.id} className="hover:bg-blue-50">
                            <td className="px-2 py-1 border-r border-gray-200 font-medium">
                              #{titulo.numero_titulo}
                            </td>
                            <td className="px-2 py-1 border-r border-gray-200">
                              {titulo.sacado_nome}
                            </td>
                            <td className="px-2 py-1 border-r border-gray-200">
                              {new Date(titulo.data_vencimento_original).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-2 py-1 border-r border-gray-200 text-right font-semibold">
                              {formatMoney(titulo.valor_atualizado)}
                            </td>
                            <td className="px-2 py-1 text-center">
                              <button
                                onClick={() => {
                                  setTituloSelecionadoCobranca({
                                    id: titulo.id,
                                    numero_titulo: titulo.numero_titulo,
                                    sacado_nome: titulo.sacado_nome
                                  });
                                }}
                                className="px-2 py-1 text-xs border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium"
                              >
                                Cobrança
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Modal de Cobrança - Título Selecionado */}
        {showCobrancaModal && tituloSelecionadoCobranca && (
          <Modal
            isOpen={showCobrancaModal}
            onClose={() => {
              setShowCobrancaModal(false);
              setTituloSelecionadoCobranca(null);
              setTitulosCedente([]);
            }}
            title={`Histórico de Cobrança - Título #${tituloSelecionadoCobranca.numero_titulo}`}
            size="2xl"
          >
            <TitulosAtividadesManager
              tituloId={tituloSelecionadoCobranca.id}
              numeroTitulo={tituloSelecionadoCobranca.numero_titulo}
              sacadoNome={tituloSelecionadoCobranca.sacado_nome}
            />
          </Modal>
        )}

      </div>
    </main>
  );
}
