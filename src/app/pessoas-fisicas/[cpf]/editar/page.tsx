'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCpf } from '@/lib/format';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import CompactDataManager from '@/components/shared/CompactDataManager';
import { categoriasPessoasFisicas } from '@/config/pessoasFisicasCategorias';
import { useToast } from '@/components/ui/ToastContainer';

type PessoaFisica = {
  id: string;
  cpf: string;
  nome: string;
  nome_mae: string | null;
  data_nascimento: string | null;
  rg: string | null;
  situacao: string | null;
  ativo: boolean;
};

export default function EditarPessoaFisicaPage() {
  const router = useRouter();
  const params = useParams();
  const cpf = decodeURIComponent(params.cpf as string);
  
  const [pessoa, setPessoa] = useState<PessoaFisica | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCategorias, setLoadingCategorias] = useState<Record<string, boolean>>({});
  
  // Estados para informações básicas editáveis
  const [infoBasicas, setInfoBasicas] = useState({
    nome: '',
    cpf: '',
    nome_mae: '',
    data_nascimento: '',
    rg: '',
    situacao: 'ativa',
    ativo: true,
  });
  const [savingInfoBasicas, setSavingInfoBasicas] = useState(false);
  const [infoBasicasCollapsed, setInfoBasicasCollapsed] = useState(true);
  
  // Estado dinâmico para categorias
  const [categoriasData, setCategoriasData] = useState<Record<string, any[]>>({});
  
  // Estados específicos
  const [processosTexto, setProcessosTexto] = useState('');
  const [lastSavedProcessos, setLastSavedProcessos] = useState('');
  const [savingProcessos, setSavingProcessos] = useState(false);
  
  // Observações gerais
  const [observacoesGerais, setObservacoesGerais] = useState('');
  const [lastSavedObservacoes, setLastSavedObservacoes] = useState('');
  const [savingObservacoes, setSavingObservacoes] = useState(false);

  // Estados para navegação lateral e botão voltar ao topo
  const [activeSection, setActiveSection] = useState<string>('');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  const { showToast } = useToast();

  useEffect(() => {
    loadAllData();
  }, [cpf]);

  // Scroll spy
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);

      const sections = Object.keys(sectionRefs.current);
      const scrollPosition = window.scrollY + 150;

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
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categoriasData]);

  const scrollToSection = (sectionId: string) => {
    const element = sectionRefs.current[sectionId];
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Lista de seções para navegação
  const secoes = [
    { id: 'informacoes_basicas', label: 'Informações Básicas', icon: '' },
    { id: 'observacoes', label: 'Observações Gerais', icon: '' },
    { id: 'enderecos', label: 'Endereços', icon: '' },
    { id: 'telefones', label: 'Telefones', icon: '' },
    { id: 'emails', label: 'E-mails', icon: '' },
    { id: 'familiares', label: 'Familiares', icon: '' },
    { id: 'empresas', label: 'Empresas Ligadas', icon: '' },
    { id: 'processos', label: 'Processos', icon: '' },
  ];

  async function loadAllData() {
    setLoading(true);
    const cpfLimpo = cpf.replace(/\D+/g, '');
    
    // Carrega dados da pessoa física
    const { data: pessoaData } = await supabase
      .from('pessoas_fisicas')
      .select('*')
      .eq('cpf', cpfLimpo)
      .single();
    
    setPessoa(pessoaData);
    
    // Preenche o formulário de informações básicas
    if (pessoaData) {
      setInfoBasicas({
        nome: pessoaData.nome || '',
        cpf: pessoaData.cpf ? formatCpf(pessoaData.cpf) : '',
        nome_mae: pessoaData.nome_mae || '',
        data_nascimento: pessoaData.data_nascimento ? pessoaData.data_nascimento.split('T')[0] : '',
        rg: pessoaData.rg || '',
        situacao: pessoaData.situacao || 'ativa',
        ativo: pessoaData.ativo ?? true,
      });
    }

    // Carrega todos os dados complementares (após pessoa estar carregada)
    if (pessoaData) {
      await Promise.all([
        ...categoriasPessoasFisicas.map(cat => loadCategoria(cat.id, cat.tableName, pessoaData.id)),
        loadProcessos(pessoaData.id),
        loadObservacoes(pessoaData.id)
      ]);
    }
    
    setLoading(false);
  }

  // Função genérica para carregar qualquer categoria
  async function loadCategoria(categoriaId: string, tableName: string, pessoaId?: string) {
    const idParaUsar = pessoaId || pessoa?.id;
    if (!idParaUsar) return;
    
    setLoadingCategorias(prev => ({ ...prev, [categoriaId]: true }));
    try {
      const categoriaConfig = categoriasPessoasFisicas.find(c => c.id === categoriaId);
      if (!categoriaConfig) return;

      let query = supabase
        .from(tableName)
        .select('*')
        .eq('pessoa_id', idParaUsar)
        .eq('ativo', true);

      // Ordenação específica por categoria
      if (categoriaId === 'familiares') {
        query = query.order('familiar_nome');
      } else if (['enderecos', 'telefones', 'emails'].includes(categoriaId)) {
        query = query.order('principal', { ascending: false });
      } else if (categoriaId === 'empresas') {
        query = query.order('empresa_razao_social');
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      
      if (error) {
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

  async function loadProcessos(pessoaId?: string) {
    const idParaUsar = pessoaId || pessoa?.id;
    if (!idParaUsar) return;
    const { data } = await supabase
      .from('pessoas_fisicas_observacoes')
      .select('processos_texto')
      .eq('pessoa_id', idParaUsar)
      .single();
    
    if (data) {
      const txt = data.processos_texto || '';
      setProcessosTexto(txt);
      setLastSavedProcessos(txt);
    } else {
      setProcessosTexto('');
      setLastSavedProcessos('');
    }
  }

  async function loadObservacoes(pessoaId?: string) {
    const idParaUsar = pessoaId || pessoa?.id;
    if (!idParaUsar) return;
    const { data } = await supabase
      .from('pessoas_fisicas_observacoes')
      .select('observacoes')
      .eq('pessoa_id', idParaUsar)
      .single();
    
    if (data) {
      const txt = data.observacoes || '';
      setObservacoesGerais(txt);
      setLastSavedObservacoes(txt);
    } else {
      setObservacoesGerais('');
      setLastSavedObservacoes('');
    }
  }

  async function saveObservacaoGeral(observacoes: string) {
    if (!pessoa?.id) return false;
    try {
      const { error } = await supabase
        .from('pessoas_fisicas_observacoes')
        .upsert({
          pessoa_id: pessoa.id,
          observacoes,
          processos_texto: processosTexto,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'pessoa_id'
        });
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao salvar observação:', error);
      showToast('Erro ao salvar observações gerais', 'error');
      return false;
    }
  }

  async function saveProcessosTexto(texto: string) {
    if (!pessoa?.id) return false;
    try {
      const { error } = await supabase
        .from('pessoas_fisicas_observacoes')
        .upsert({
          pessoa_id: pessoa.id,
          observacoes: observacoesGerais,
          processos_texto: texto,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'pessoa_id'
        });
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao salvar processos:', error);
      showToast('Erro ao salvar processos', 'error');
      return false;
    }
  }

  async function saveInfoBasicas() {
    if (!infoBasicas.nome.trim()) {
      showToast('O nome é obrigatório', 'error');
      return false;
    }

    if (!pessoa?.id) return false;

    setSavingInfoBasicas(true);
    try {
      const cpfLimpo = infoBasicas.cpf.replace(/\D+/g, '');
      const { error } = await supabase
        .from('pessoas_fisicas')
        .update({
          nome: infoBasicas.nome.trim(),
          cpf: cpfLimpo,
          nome_mae: infoBasicas.nome_mae.trim() || null,
          data_nascimento: infoBasicas.data_nascimento || null,
          rg: infoBasicas.rg.trim() || null,
          situacao: infoBasicas.situacao || 'ativa',
          ativo: infoBasicas.ativo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pessoa.id);
      
      if (error) throw error;
      
      setPessoa(prev => prev ? {
        ...prev,
        nome: infoBasicas.nome.trim(),
        cpf: cpfLimpo,
        nome_mae: infoBasicas.nome_mae || null,
        data_nascimento: infoBasicas.data_nascimento || null,
        rg: infoBasicas.rg || null,
        situacao: infoBasicas.situacao || 'ativa',
        ativo: infoBasicas.ativo,
      } : null);
      
      showToast('Informações básicas salvas com sucesso!', 'success');
      return true;
    } catch (error) {
      console.error('Erro ao salvar informações básicas:', error);
      showToast('Erro ao salvar informações básicas', 'error');
      return false;
    } finally {
      setSavingInfoBasicas(false);
    }
  }

  async function fetchFromAPI(tipo: string) {
    if (!pessoa?.cpf) {
      showToast('Pessoa física sem CPF cadastrado', 'warning');
      return;
    }

    try {
      const url = `/api/bigdata?cpf=${encodeURIComponent(pessoa.cpf)}&tipo=${tipo}`;
      const res = await fetch(url);
      const response = await res.json();
      
      if (!res.ok) {
        const errorMsg = response.error || 'Erro ao buscar dados da API BigData';
        showToast(errorMsg, 'error');
        return;
      }

      const dados = Array.isArray(response) ? response : (response.data || []);
      
      if (!Array.isArray(dados) || dados.length === 0) {
        showToast('Nenhum dado encontrado na API para este CPF', 'warning');
        return;
      }
      
      // Salva os dados no banco
      const categoria = categoriasPessoasFisicas.find(c => c.apiType === tipo);
      if (!categoria) return;
      
      const tableName = categoria.tableName;
      
      // Remove dados antigos da API para evitar duplicatas
      if (pessoa.id) {
        const { error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .eq('pessoa_id', pessoa.id)
          .eq('origem', 'api');

        if (deleteError) {
          console.error('Erro ao limpar dados antigos da API:', deleteError);
        }

        // Insere os novos dados da API
        const dataToInsert = dados.map(item => ({
          ...item,
          pessoa_id: pessoa.id,
          origem: 'api',
          ativo: true
        }));

        const { error } = await supabase
          .from(tableName)
          .insert(dataToInsert);

        if (error) {
          console.error('Erro ao salvar dados da API:', error);
          showToast('Erro ao salvar dados da API', 'error');
          return;
        }

        await loadCategoria(categoria.id, tableName);
      }
    } catch (error) {
      console.error('Erro ao buscar da API:', error);
      showToast('Erro ao buscar dados da API', 'error');
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

  if (!pessoa) {
    return (
      <main className="min-h-screen p-6 bg-white">
        <div className="container max-w-6xl">
          <div className="text-center py-8">
            <p className="text-[#64748b]">Pessoa física não encontrada</p>
            <Button variant="primary" onClick={() => router.push('/pessoas-fisicas')} className="mt-4">
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
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="space-y-1">
            {secoes.map((secao) => {
              const isActive = activeSection === secao.id;
              const categoria = categoriasPessoasFisicas.find(c => c.id === secao.id);
              const itemCount = categoria ? (categoriasData[secao.id] || []).length : 
                                secao.id === 'informacoes_basicas' ? 1 :
                                secao.id === 'observacoes' ? (observacoesGerais ? 1 : 0) : 
                                secao.id === 'processos' ? (processosTexto ? 1 : 0) : 0;

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
                  <span className="truncate">{secao.label}</span>
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
                {pessoa.nome}
              </h1>
              <p className="text-sm text-[#64748b] font-mono">{formatCpf(pessoa.cpf)}</p>
            </div>
            <Button variant="secondary" onClick={() => router.push(`/pessoas-fisicas/${encodeURIComponent(cpf)}`)}>
              Voltar
            </Button>
          </header>

          {/* Informações Básicas */}
          <div id="informacoes_basicas" ref={(el) => { sectionRefs.current['informacoes_basicas'] = el; }}>
            <Card>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setInfoBasicasCollapsed(!infoBasicasCollapsed)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <svg 
                        className={`w-5 h-5 text-gray-600 transition-transform ${infoBasicasCollapsed ? '' : 'rotate-90'}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <h2 className="text-xl font-semibold text-[#0369a1]">Informações Básicas</h2>
                  </div>
                  {!infoBasicasCollapsed && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={saveInfoBasicas}
                      loading={savingInfoBasicas}
                      disabled={!infoBasicas.nome.trim()}
                    >
                      Salvar Informações
                    </Button>
                  )}
                </div>
                
                {!infoBasicasCollapsed && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Nome Completo *"
                      value={infoBasicas.nome}
                      onChange={(e) => setInfoBasicas({ ...infoBasicas, nome: e.target.value })}
                      placeholder="Nome completo"
                      required
                    />
                    <div>
                      <label className="block text-sm font-medium text-[#1e293b] mb-1">CPF</label>
                      <input
                        type="text"
                        value={infoBasicas.cpf}
                        onChange={(e) => setInfoBasicas({ ...infoBasicas, cpf: formatCpf(e.target.value) })}
                        placeholder="000.000.000-00"
                        className="block w-full px-3 py-2 border border-[#cbd5e1] rounded-md shadow-sm transition-colors bg-white text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1] hover:border-[#0369a1]"
                        maxLength={14}
                      />
                    </div>
                    <Input
                      label="RG"
                      value={infoBasicas.rg}
                      onChange={(e) => setInfoBasicas({ ...infoBasicas, rg: e.target.value })}
                      placeholder="RG"
                    />
                    <Input
                      label="Data de Nascimento"
                      type="date"
                      value={infoBasicas.data_nascimento}
                      onChange={(e) => setInfoBasicas({ ...infoBasicas, data_nascimento: e.target.value })}
                    />
                    <Input
                      label="Nome da Mãe"
                      value={infoBasicas.nome_mae}
                      onChange={(e) => setInfoBasicas({ ...infoBasicas, nome_mae: e.target.value })}
                      placeholder="Nome completo da mãe"
                    />
                    <Select
                      label="Situação"
                      value={infoBasicas.situacao}
                      onChange={(e) => setInfoBasicas({ ...infoBasicas, situacao: e.target.value })}
                      options={[
                        { value: 'ativa', label: 'Ativa' },
                        { value: 'inativa', label: 'Inativa' },
                        { value: 'falecida', label: 'Falecida' },
                      ]}
                    />
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={infoBasicas.ativo}
                          onChange={(e) => setInfoBasicas({ ...infoBasicas, ativo: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Ativo</span>
                      </label>
                    </div>
                  </div>
                </div>
                )}
              </div>
            </Card>
          </div>

          {/* Observações Gerais */}
          <div id="observacoes" ref={(el) => { sectionRefs.current['observacoes'] = el; }}>
            <Card>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Observações Gerais - {pessoa.nome}
                </label>
                <textarea
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] resize-y"
                  value={observacoesGerais}
                  onChange={e => {
                    setObservacoesGerais(e.target.value);
                  }}
                  placeholder="Digite observações gerais sobre esta pessoa: contexto, histórico, alertas, etc..."
                />
                {observacoesGerais !== lastSavedObservacoes && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={async () => {
                      const saved = await saveObservacaoGeral(observacoesGerais);
                      if (saved) {
                        setLastSavedObservacoes(observacoesGerais);
                        showToast('Observações salvas!', 'success');
                      }
                    }}
                  >
                    Salvar Observações
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Categorias dinâmicas */}
          {categoriasPessoasFisicas.map(categoria => (
            <div 
              key={categoria.id} 
              id={categoria.id}
              ref={(el) => { sectionRefs.current[categoria.id] = el; }}
            >
              <Card>
                <CompactDataManager
                  title={categoria.title}
                  entityId={pessoa.id}
                  tableName={categoria.tableName}
                  items={categoriasData[categoria.id] || []}
                  onRefresh={() => loadCategoria(categoria.id, categoria.tableName, pessoa?.id)}
                  onFetchFromAPI={pessoa?.cpf && categoria.apiType ? () => fetchFromAPI(categoria.apiType!) : undefined}
                  fields={categoria.fields}
                  displayFields={categoria.displayFields}
                  isLoading={loadingCategorias[categoria.id]}
                />
              </Card>
            </div>
          ))}

          {/* Processos Judiciais */}
          <div id="processos" ref={(el) => { sectionRefs.current['processos'] = el; }}>
            <Card>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Processos Judiciais e Informações Relevantes
                </label>
                <textarea
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[300px] resize-y font-mono"
                  value={processosTexto}
                  onChange={e => {
                    setProcessosTexto(e.target.value);
                  }}
                  placeholder="Cole aqui todos os processos e informações relevantes encontradas..."
                />
                {processosTexto !== lastSavedProcessos && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={async () => {
                      const saved = await saveProcessosTexto(processosTexto);
                      if (saved) {
                        setLastSavedProcessos(processosTexto);
                        showToast('Processos salvos!', 'success');
                      }
                    }}
                  >
                    Salvar Processos
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={() => router.push(`/pessoas-fisicas/${encodeURIComponent(cpf)}`)}>
              Voltar
            </Button>
            <Button 
              variant="primary" 
              onClick={async () => {
                await Promise.all([
                  saveInfoBasicas(),
                  saveObservacaoGeral(observacoesGerais),
                  saveProcessosTexto(processosTexto)
                ]);
                showToast('Dados salvos com sucesso!', 'success');
              }}
            >
              Salvar Tudo
            </Button>
          </div>
        </div>
      </main>

      {/* Botão Voltar ao Topo */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 hover:scale-110"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
}

