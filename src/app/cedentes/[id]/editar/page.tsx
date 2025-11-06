'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj } from '@/lib/format';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import CompactDataManager from '@/components/shared/CompactDataManager';
import { categoriasCedentes } from '@/config/cedentesCategorias';
import { useToast } from '@/components/ui/ToastContainer';

type Cedente = {
  id: string;
  nome: string;
  razao_social: string | null;
  cnpj: string | null;
};

type Sacado = {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  situacao: string | null;
};

export default function EditarCedentePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [cedente, setCedente] = useState<Cedente | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCategorias, setLoadingCategorias] = useState<Record<string, boolean>>({});
  
  // Estado dinâmico para categorias (usando configuração)
  const [categoriasData, setCategoriasData] = useState<Record<string, any[]>>({});
  
  // Estados específicos (mantidos para compatibilidade)
  const [processosTexto, setProcessosTexto] = useState(''); // TEXTO SIMPLES
  
  // Observações gerais DA EMPRESA (uma única observação)
  const [observacoesGerais, setObservacoesGerais] = useState('');
  
  // Modal de detalhes de pessoa do QSA
  const [showQsaDetails, setShowQsaDetails] = useState(false);
  const [selectedQsa, setSelectedQsa] = useState<any>(null);
  const [qsaDetalhes, setQsaDetalhes] = useState('');
  
  // Sacados
  const [sacados, setSacados] = useState<Sacado[]>([]);
  const [sacadosQuery, setSacadosQuery] = useState('');
  const [showAddSacado, setShowAddSacado] = useState(false);
  const [sacadoForm, setSacadoForm] = useState({ cnpj: '', razao_social: '', nome_fantasia: '' });
  const [loadingSacadoCnpj, setLoadingSacadoCnpj] = useState(false);
  const [savingSacado, setSavingSacado] = useState(false);

  // Estados para navegação lateral e botão voltar ao topo
  const [activeSection, setActiveSection] = useState<string>('');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Recolhida por padrão
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  const { showToast } = useToast();

  useEffect(() => {
    loadAllData();
  }, [id]);

  // Scroll spy - detecta seção ativa e mostra botão voltar ao topo
  useEffect(() => {
    const handleScroll = () => {
      // Mostra/oculta botão voltar ao topo
      setShowBackToTop(window.scrollY > 400);

      // Detecta seção ativa
      const sections = Object.keys(sectionRefs.current);
      const scrollPosition = window.scrollY + 150; // Offset do header fixo

      for (let i = sections.length - 1; i >= 0; i--) {
        const sectionId = sections[i];
        const element = sectionRefs.current[sectionId];
        if (element) {
          const offsetTop = element.offsetTop;
          if (scrollPosition >= offsetTop) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Chama uma vez para setar inicial
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categoriasData]);

  // Função para scroll suave até seção
  const scrollToSection = (sectionId: string) => {
    const element = sectionRefs.current[sectionId];
    if (element) {
      const offset = 80; // Altura do header fixo
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Função para voltar ao topo
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Lista de seções para navegação
  const secoes = [
    { id: 'observacoes', label: 'Observações Gerais', icon: '💬' },
    { id: 'enderecos', label: 'Endereços', icon: '📍' },
    { id: 'telefones', label: 'Telefones', icon: '📞' },
    { id: 'emails', label: 'E-mails', icon: '📧' },
    { id: 'pessoas_ligadas', label: 'Pessoas Ligadas', icon: '👥' },
    { id: 'empresas_ligadas', label: 'Empresas Ligadas', icon: '🏢' },
    { id: 'processos', label: 'Processos', icon: '⚖️' },
    { id: 'qsa', label: 'QSA', icon: '👔' },
    { id: 'sacados', label: 'Sacados', icon: '📋' },
  ];

  async function loadAllData() {
    setLoading(true);
    
    // Carrega dados do cedente
    const { data: cedenteData } = await supabase
      .from('cedentes')
      .select('id, nome, razao_social, cnpj')
      .eq('id', id)
      .single();
    
    setCedente(cedenteData);

    // Carrega todos os dados complementares (dinamicamente baseado na configuração)
    await Promise.all([
      ...categoriasCedentes.map(cat => loadCategoria(cat.id, cat.tableName)),
      loadProcessos(),
      loadObservacoes(),
      loadSacados()
    ]);
    
    setLoading(false);
  }
  
  async function loadSacados() {
    try {
      const { data, error } = await supabase
        .from('sacados')
        .select('cnpj, razao_social, nome_fantasia, situacao')
        .eq('cedente_id', id)
        .order('razao_social', { ascending: true });
      
      if (error) {
        // Não loga erro se a tabela não existir, não tiver permissão ou se o erro for esperado/vazio
        const errorCode = error.code || '';
        const errorMessage = (error.message || '').toLowerCase();
        
        // Verifica se é um erro vazio (objeto {} sem propriedades úteis)
        const isEmptyError = !errorCode && !errorMessage && Object.keys(error).length === 0;
        
        // Códigos de erro esperados: tabela não existe, sem permissão
        const expectedErrors = ['PGRST116', '42P01', '42501'];
        const isExpectedError = isEmptyError ||
                                expectedErrors.includes(errorCode) || 
                                errorMessage.includes('permission') ||
                                errorMessage.includes('does not exist') ||
                                errorMessage.includes('relation');
        
        // Só loga se for um erro real e não esperado/vazio
        if (!isExpectedError && errorMessage) {
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
  
  async function consultarCnpjSacado() {
    const raw = sacadoForm.cnpj.replace(/\D+/g, '');
    if (!raw || raw.length !== 14) {
      showToast('CNPJ inválido', 'error');
      return;
    }

    setLoadingSacadoCnpj(true);
    try {
      const res = await fetch(`/api/cnpjws?cnpj=${raw}`);
      const data = await res.json();
      
      if (!res.ok) {
        showToast(data?.error || 'Erro ao consultar CNPJ', 'error');
        return;
      }

      const estabelecimento = data?.estabelecimento || {};
      const razao = data?.razao_social || '';
      const fantasia = estabelecimento?.nome_fantasia || '';

      setSacadoForm(f => ({
        ...f,
        razao_social: razao,
        nome_fantasia: fantasia
      }));
    } catch (err) {
      showToast('Erro ao consultar CNPJ', 'error');
    } finally {
      setLoadingSacadoCnpj(false);
    }
  }

  async function adicionarSacado() {
    const raw = sacadoForm.cnpj.replace(/\D+/g, '');
    if (!raw || !sacadoForm.razao_social.trim()) {
      showToast('Preencha CNPJ e Razão Social', 'warning');
      return;
    }

    setSavingSacado(true);
    try {
      // Verifica se já existe
      const { data: existing, error: checkError } = await supabase
        .from('sacados')
        .select('cnpj')
        .eq('cnpj', raw)
        .maybeSingle(); // Usa maybeSingle para não dar erro se não encontrar

      // Se já existe (e não é erro de "não encontrado")
      if (existing && !checkError) {
        showToast('Sacado já cadastrado com este CNPJ', 'warning');
        setSavingSacado(false);
        return;
      }

      // Insere novo sacado
      const { error } = await supabase.from('sacados').insert({
        cnpj: raw,
        cedente_id: id,
        razao_social: sacadoForm.razao_social.trim(),
        nome_fantasia: sacadoForm.nome_fantasia.trim() || null,
      });

      if (error) {
        // Não loga erro se for vazio ou se for um erro esperado
        const errorCode = error.code || '';
        const errorMessage = (error.message || '').toLowerCase();
        
        // Verifica se é um erro vazio (objeto {} sem propriedades úteis)
        const isEmptyError = !errorCode && !errorMessage && Object.keys(error).length === 0;
        
        // Códigos de erro esperados: constraint violation, permissão, etc
        const expectedErrors = ['23505', 'PGRST116', '42P01', '42501']; // 23505 = unique violation
        const isExpectedError = isEmptyError ||
                                expectedErrors.includes(errorCode) || 
                                errorMessage.includes('permission') ||
                                errorMessage.includes('duplicate') ||
                                errorMessage.includes('unique constraint');
        
        // Só loga se for um erro real e não esperado/vazio
        if (!isExpectedError && errorMessage) {
          console.error('Erro ao adicionar sacado:', error);
        }
        
        // Mostra mensagem amigável ao usuário
        if (errorMessage.includes('duplicate') || errorMessage.includes('unique constraint') || errorCode === '23505') {
          showToast('Sacado já cadastrado com este CNPJ', 'warning');
        } else if (errorMessage) {
          showToast(`Erro ao adicionar sacado: ${error.message || 'Erro desconhecido'}`, 'error');
        } else {
          showToast('Erro ao adicionar sacado', 'error');
        }
      } else {
      setSacadoForm({ cnpj: '', razao_social: '', nome_fantasia: '' });
      setShowAddSacado(false);
      showToast('Sacado adicionado com sucesso!', 'success');
        await loadSacados();
      }
    } catch (err) {
      console.error('Erro inesperado ao adicionar sacado:', err);
      showToast('Erro inesperado ao adicionar sacado', 'error');
    } finally {
      setSavingSacado(false);
    }
  }
  
  async function removerSacado(cnpj: string) {
    if (!confirm('Tem certeza que deseja remover este sacado?')) return;
    
    try {
      const { error } = await supabase
        .from('sacados')
        .delete()
        .eq('cnpj', cnpj);
      
      if (error) {
        console.error('Erro ao remover sacado:', error);
        showToast('Erro ao remover sacado', 'error');
      } else {
        await loadSacados();
      }
    } catch (err) {
      console.error('Erro ao remover sacado:', err);
      showToast('Erro ao remover sacado', 'error');
    }
  }

  // Função genérica para carregar qualquer categoria
  async function loadCategoria(categoriaId: string, tableName: string) {
    setLoadingCategorias(prev => ({ ...prev, [categoriaId]: true }));
    try {
      const categoriaConfig = categoriasCedentes.find(c => c.id === categoriaId);
      if (!categoriaConfig) return;

      let query = supabase
        .from(tableName)
        .select('*')
        .eq('cedente_id', id)
        .eq('ativo', true);

      // Ordenação específica por categoria
      if (categoriaId === 'qsa' || categoriaId === 'pessoas_ligadas') {
        query = query.order('nome');
      } else if (['enderecos', 'telefones', 'emails'].includes(categoriaId)) {
        query = query.order('principal', { ascending: false });
      } else if (categoriaId === 'empresas_ligadas') {
        query = query.order('razao_social');
      } else {
        // Ordenação padrão por created_at
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      
      if (error) {
        // Ignora erros de tabela não existente
        if (!error.message.includes('does not exist') && !error.message.includes('relation')) {
          console.error(`Erro ao carregar ${categoriaId}:`, error);
        }
        setCategoriasData(prev => ({ ...prev, [categoriaId]: [] }));
        return;
      }

      setCategoriasData(prev => ({ ...prev, [categoriaId]: data || [] }));
    } catch (error) {
      console.error(`Erro ao carregar categoria ${categoriaId}:`, error);
      setCategoriasData(prev => ({ ...prev, [categoriaId]: [] }));
    } finally {
      setLoadingCategorias(prev => ({ ...prev, [categoriaId]: false }));
    }
  }

  async function loadProcessos() {
    // Carrega texto de processos da tabela de observações gerais ou criar campo separado
    const { data } = await supabase
      .from('cedentes_observacoes_gerais')
      .select('processos_texto')
      .eq('cedente_id', id)
      .single();
    
    if (data) setProcessosTexto(data.processos_texto || '');
  }

  async function loadObservacoes() {
    // Carrega observação geral única da empresa
    const { data } = await supabase
      .from('cedentes_observacoes_gerais')
      .select('observacoes')
      .eq('cedente_id', id)
      .single();
    
    if (data) setObservacoesGerais(data.observacoes);
  }

  async function saveObservacaoGeral(observacoes: string) {
    try {
      const { error } = await supabase
        .from('cedentes_observacoes_gerais')
        .upsert({
          cedente_id: id,
          observacoes,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'cedente_id'
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao salvar observação:', error);
    }
  }

  async function saveProcessosTexto(texto: string) {
    try {
      const { error } = await supabase
        .from('cedentes_observacoes_gerais')
        .upsert({
          cedente_id: id,
          processos_texto: texto,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'cedente_id'
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao salvar processos:', error);
    }
  }

  async function saveQsaDetalhes() {
    if (!selectedQsa) return;
    
    try {
      const { error } = await supabase
        .from('cedentes_qsa_detalhes')
        .upsert({
          qsa_id: selectedQsa.id,
          cedente_id: id,
          detalhes_completos: qsaDetalhes,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'qsa_id'
        });
      
      if (error) throw error;
      
      showToast('Detalhes salvos com sucesso!', 'success');
      setShowQsaDetails(false);
      setSelectedQsa(null);
      setQsaDetalhes('');
    } catch (error) {
      console.error('Erro ao salvar detalhes da pessoa:', error);
      showToast('Erro ao salvar detalhes', 'error');
    }
  }

  async function openQsaDetails(item: any) {
    setSelectedQsa(item);
    
    // Carrega detalhes existentes
    const { data } = await supabase
      .from('cedentes_qsa_detalhes')
      .select('detalhes_completos')
      .eq('qsa_id', item.id)
      .single();
    
    if (data) {
      setQsaDetalhes(data.detalhes_completos || '');
    } else {
      setQsaDetalhes('');
    }
    
    setShowQsaDetails(true);
  }

  async function fetchFromAPI(tipo: string) {
    if (!cedente?.cnpj) {
      showToast('Cedente sem CNPJ cadastrado', 'warning');
      return;
    }

    try {
      const res = await fetch(`/api/bigdata?cnpj=${encodeURIComponent(cedente.cnpj)}&tipo=${tipo}`);
      const response = await res.json();
      
      if (!res.ok) {
        throw new Error(response.error || 'Erro ao buscar dados');
      }

      const dados = response.mock ? response.data : response;
      
      // Salva os dados no banco
      if (Array.isArray(dados) && dados.length > 0) {
        const tableName = getTableNameByType(tipo);
        
        // Remove dados antigos da API para evitar duplicatas
        const { error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .eq('cedente_id', id)
          .eq('origem', 'api');

        if (deleteError) {
          console.error('Erro ao limpar dados antigos da API:', deleteError);
        }

        // Insere os novos dados da API
        const dataToInsert = dados.map(item => ({
          ...item,
          cedente_id: id,
          origem: 'api',
          ativo: true
        }));

        const { error } = await supabase
          .from(tableName)
          .insert(dataToInsert);

        if (error) {
          console.error('Erro ao salvar dados da API:', error);
          showToast('Alguns dados não puderam ser salvos', 'warning');
        }
      }
    } catch (error) {
      console.error('Erro ao buscar da API:', error);
      throw error;
    }
  }

  function getTableNameByType(tipo: string): string {
    // Busca a tabela na configuração usando o apiType
    const categoria = categoriasCedentes.find(c => c.apiType === tipo);
    return categoria?.tableName || '';
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
            <Button variant="primary" onClick={() => router.back()} className="mt-4">
              Voltar
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Menu Lateral Fixo - Navegação por Seções */}
      <aside className={`hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 overflow-y-auto z-30 transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 space-y-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Navegação</h3>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
              aria-label="Recolher navegação"
              title="Recolher"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Lista de Seções */}
          <nav className="space-y-1">
            {secoes.map((secao) => {
              const isActive = activeSection === secao.id;
              const categoria = categoriasCedentes.find(c => c.id === secao.id);
              const itemCount = categoria ? (categoriasData[secao.id] || []).length : 
                                secao.id === 'observacoes' ? (observacoesGerais ? 1 : 0) : 
                                secao.id === 'processos' ? (processosTexto ? 1 : 0) :
                                secao.id === 'sacados' ? sacados.length : 0;

              return (
                <button
                  key={secao.id}
                  onClick={() => scrollToSection(secao.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{secao.icon}</span>
                    <span className="truncate">{secao.label}</span>
                  </span>
                  {itemCount > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      isActive ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {itemCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Botão para Expandir Sidebar */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="hidden lg:fixed left-4 top-20 z-40 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 hover:scale-110"
          aria-label="Expandir navegação"
          title="Mostrar navegação"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Conteúdo Principal */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
        <div className="container max-w-6xl mx-auto p-6 space-y-6">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#0369a1]">
                {cedente.nome}
              </h1>
              {cedente.razao_social && <p className="text-[#64748b]">{cedente.razao_social}</p>}
              {cedente.cnpj && <p className="text-sm text-[#64748b] font-mono">{cedente.cnpj}</p>}
            </div>
            <Button variant="secondary" onClick={() => router.back()}>
              Voltar
            </Button>
          </header>

          {/* Observações Gerais da Empresa - TOPO */}
          <div id="observacoes" ref={(el) => { sectionRefs.current['observacoes'] = el; }}>
            <Card>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  💬 Observações Gerais - {cedente.nome}
                </label>
                <textarea
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] resize-y"
                  value={observacoesGerais}
                  onChange={e => {
                    setObservacoesGerais(e.target.value);
                    saveObservacaoGeral(e.target.value);
                  }}
                  placeholder="Digite observações gerais sobre esta empresa: contexto, histórico, alertas, etc..."
                />
                <p className="text-xs text-gray-500">Salva automaticamente ao digitar</p>
              </div>
            </Card>
          </div>

          {/* Categorias dinâmicas (baseadas na configuração) - Agrupadas */}
          {(() => {
            // Agrupa categorias por grupo
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

            // Labels dos grupos
            const grupoLabels: Record<string, string> = {
              'contatos': '📞 Informações de Contato',
              'relacionamentos': '👥 Relacionamentos',
              'outros': '📋 Outros'
            };

            return Object.entries(categoriasPorGrupo).map(([grupo, categorias]) => (
              <div key={grupo} className="space-y-4">
                {grupo !== 'outros' && (
                  <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    {grupoLabels[grupo] || grupo}
                  </h2>
                )}
                <div className="space-y-4">
                  {categorias.map(categoria => (
                    <div 
                      key={categoria.id} 
                      id={categoria.id}
                      ref={(el) => { sectionRefs.current[categoria.id] = el; }}
                    >
                      <Card>
                        <CompactDataManager
                          title={categoria.title}
                          entityId={id}
                          tableName={categoria.tableName}
                          items={categoriasData[categoria.id] || []}
                          onRefresh={() => loadCategoria(categoria.id, categoria.tableName)}
                          onFetchFromAPI={cedente.cnpj && categoria.apiType ? () => fetchFromAPI(categoria.apiType!) : undefined}
                          fields={categoria.fields}
                          displayFields={categoria.displayFields}
                          showDetailsButton={categoria.showDetailsButton}
                          isLoading={loadingCategorias[categoria.id]}
                        />
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}

          {/* Processos Judiciais - SIMPLIFICADO */}
          <div id="processos" ref={(el) => { sectionRefs.current['processos'] = el; }}>
            <Card>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  ⚖️ Processos Judiciais e Informações Relevantes
                </label>
                <textarea
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[300px] resize-y font-mono"
                  value={processosTexto}
                  onChange={e => {
                    setProcessosTexto(e.target.value);
                    saveProcessosTexto(e.target.value);
                  }}
                  placeholder="Cole aqui todos os processos e informações relevantes encontradas...&#10;&#10;Exemplo:&#10;PROCESSOS: 13&#10;&#10;Processo 1: ...&#10;Processo 2: ...&#10;&#10;INFORMAÇÕES:&#10;- Detalhes importantes&#10;- Endereços relacionados&#10;- Contatos úteis"
                />
                <p className="text-xs text-gray-500">Salva automaticamente ao digitar</p>
              </div>
            </Card>
          </div>

          {/* QSA com Botão de Detalhes (renderizado separadamente) */}
          {(() => {
            const categoriaQsa = categoriasCedentes.find(c => c.id === 'qsa');
            if (!categoriaQsa) return null;
            
            return (
              <div id="qsa" ref={(el) => { sectionRefs.current['qsa'] = el; }}>
                <Card>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                      <h3 className="text-base font-semibold text-gray-900">
                        {categoriaQsa.title}
                      </h3>
                      <div className="flex gap-2">
                        {cedente.cnpj && categoriaQsa.apiType && (
                          <button
                            onClick={() => fetchFromAPI(categoriaQsa.apiType!).then(() => loadCategoria('qsa', categoriaQsa.tableName))}
                            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
                          >
                            🔄 API
                          </button>
                        )}
                      </div>
                    </div>

                    <CompactDataManager
                      title=""
                      entityId={id}
                      tableName={categoriaQsa.tableName}
                      items={categoriasData['qsa'] || []}
                      onRefresh={() => loadCategoria('qsa', categoriaQsa.tableName)}
                      fields={categoriaQsa.fields}
                      displayFields={categoriaQsa.displayFields}
                      showDetailsButton={categoriaQsa.showDetailsButton}
                      isLoading={loadingCategorias['qsa']}
                    />
                  </div>
                </Card>
              </div>
            );
          })()}

          {/* Sacados Relacionados */}
          <div id="sacados" ref={(el) => { sectionRefs.current['sacados'] = el; }}>
            <Card>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-2 border-b border-gray-200">
              <div>
                <h3 className="text-base font-semibold text-gray-800">👥 Sacados Relacionados</h3>
                <p className="text-xs text-gray-500 mt-1">Gerencie os sacados (devedores) deste cedente</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={sacadosQuery}
                  onChange={(e) => setSacadosQuery(e.target.value)}
                  placeholder="Buscar sacado (nome, CNPJ)"
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-64"
                />
                <button 
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                  onClick={() => setShowAddSacado(true)}
                >
                  + Adicionar
                </button>
              </div>
            </div>

            {sacados.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500 text-sm mb-2">Nenhum sacado cadastrado ainda</p>
                <button 
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-300 rounded hover:bg-blue-50"
                  onClick={() => setShowAddSacado(true)}
                >
                  + Adicionar Primeiro Sacado
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Razão Social</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Nome Fantasia</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">CNPJ</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Situação</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
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
                      <tr key={sacado.cnpj} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2 text-sm text-gray-900 font-medium">{sacado.razao_social}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{sacado.nome_fantasia || '—'}</td>
                        <td className="px-4 py-2 text-sm text-gray-600 font-mono">{formatCpfCnpj(sacado.cnpj)}</td>
                        <td className="px-4 py-2">
                          {sacado.situacao && (
                            <Badge variant={sacado.situacao === 'ATIVA' ? 'success' : 'error'} size="sm">
                              {sacado.situacao}
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-1">
                            <Link href={`/sacados/${encodeURIComponent(sacado.cnpj)}`} title="Ver">
                              <button className="px-2 py-1 text-xs text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50" aria-label="Ver">👁️</button>
                            </Link>
                            <Link href={`/sacados/${encodeURIComponent(sacado.cnpj)}/editar`} title="Editar">
                              <button className="px-2 py-1 text-xs text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50" aria-label="Editar">✏️</button>
                            </Link>
                            <button 
                              onClick={() => removerSacado(sacado.cnpj)}
                              className="px-2 py-1 text-xs text-red-600 bg-white border border-red-300 rounded hover:bg-red-50" 
                              title="Remover"
                              aria-label="Remover"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </Card>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={() => {
                router.push(`/cedentes/${id}`);
              }}
            >
              Salvar e Voltar
            </Button>
          </div>
        </div>
      </main>

      {/* Botão Voltar ao Topo - Flutuante */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 hover:scale-110"
          title="Voltar ao topo"
          aria-label="Voltar ao topo"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}

      {/* Modal Adicionar Sacado */}
      {showAddSacado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-gray-200">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Adicionar Sacado</h2>
              <button
                onClick={() => {
                  setShowAddSacado(false);
                  setSacadoForm({ cnpj: '', razao_social: '', nome_fantasia: '' });
                }}
                className="px-2 py-1 text-gray-500 hover:text-gray-900 text-xl"
                aria-label="Fechar"
              >×</button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ*</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sacadoForm.cnpj}
                    onChange={(e) => setSacadoForm(f => ({ ...f, cnpj: formatCpfCnpj(e.target.value) }))}
                    placeholder="00.000.000/0000-00"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    maxLength={18}
                  />
                  <button
                    onClick={consultarCnpjSacado}
                    disabled={loadingSacadoCnpj}
                    className="px-3 py-2 border border-blue-600 text-blue-600 rounded text-sm hover:bg-blue-50 disabled:opacity-50"
                  >
                    {loadingSacadoCnpj ? 'Consultando...' : '🔍 Consultar'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social*</label>
                <input
                  type="text"
                  value={sacadoForm.razao_social}
                  onChange={(e) => setSacadoForm(f => ({ ...f, razao_social: e.target.value }))}
                  placeholder="Razão social da empresa"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia</label>
                <input
                  type="text"
                  value={sacadoForm.nome_fantasia}
                  onChange={(e) => setSacadoForm(f => ({ ...f, nome_fantasia: e.target.value }))}
                  placeholder="Nome fantasia (opcional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => {
                    setShowAddSacado(false);
                    setSacadoForm({ cnpj: '', razao_social: '', nome_fantasia: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={adicionarSacado}
                  disabled={savingSacado || !sacadoForm.cnpj || !sacadoForm.razao_social}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingSacado ? 'Salvando...' : 'Adicionar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

