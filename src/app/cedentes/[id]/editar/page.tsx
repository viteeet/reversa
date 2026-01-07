'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj } from '@/lib/format';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import CompactDataManager from '@/components/shared/CompactDataManager';
import { categoriasCedentes } from '@/config/cedentesCategorias';
import { useToast } from '@/components/ui/ToastContainer';

type Cedente = {
  id: string;
  nome: string;
  razao_social: string | null;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  situacao: string | null;
  porte: string | null;
  natureza_juridica: string | null;
  data_abertura: string | null;
  capital_social: number | null;
  atividade_principal_codigo: string | null;
  atividade_principal_descricao: string | null;
  atividades_secundarias: string | null;
  simples_nacional: boolean | null;
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
  
  // Estados para informações básicas editáveis
  const [infoBasicas, setInfoBasicas] = useState({
    nome: '',
    razao_social: '',
    cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    situacao: '',
    ativo: true,
    porte: '',
    natureza_juridica: '',
    data_abertura: '',
    capital_social: '',
    atividade_principal_codigo: '',
    atividade_principal_descricao: '',
    atividades_secundarias: '',
    simples_nacional: false,
  });
  const [savingInfoBasicas, setSavingInfoBasicas] = useState(false);
  const [infoBasicasCollapsed, setInfoBasicasCollapsed] = useState(true);
  
  // Estado dinâmico para categorias (usando configuração)
  const [categoriasData, setCategoriasData] = useState<Record<string, any[]>>({});
  
  // Estados específicos (mantidos para compatibilidade)
  const [processosTexto, setProcessosTexto] = useState(''); // TEXTO SIMPLES
  const [lastSavedProcessos, setLastSavedProcessos] = useState('');
  const [savingProcessos, setSavingProcessos] = useState(false);
  
  // Observações gerais DA EMPRESA (uma única observação)
  const [observacoesGerais, setObservacoesGerais] = useState('');
  const [lastSavedObservacoes, setLastSavedObservacoes] = useState('');
  const [savingObservacoes, setSavingObservacoes] = useState(false);
  
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
  const [consultarAPIsSacado, setConsultarAPIsSacado] = useState(false);
  const [loadingAPIsSacado, setLoadingAPIsSacado] = useState(false);
  const [dadosAPIsSacado, setDadosAPIsSacado] = useState<{
    enderecos: any[];
    telefones: any[];
    emails: any[];
    qsa: any[];
  } | null>(null);

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
    { id: 'informacoes_basicas', label: 'Informações Básicas', icon: '' },
    { id: 'observacoes', label: 'Observações Gerais', icon: '' },
    { id: 'enderecos', label: 'Endereços', icon: '' },
    { id: 'telefones', label: 'Telefones', icon: '' },
    { id: 'emails', label: 'E-mails', icon: '' },
    { id: 'relacionamentos', label: 'Relacionamentos', icon: '' },
    { id: 'pessoas_ligadas', label: '  → Pessoas Ligadas / Familiares', icon: '' },
    { id: 'empresas_ligadas', label: '  → Empresas Ligadas', icon: '' },
    { id: 'qsa', label: '  → QSA', icon: '' },
    { id: 'processos', label: 'Processos', icon: '' },
    { id: 'sacados', label: 'Sacados', icon: '' },
  ];

  async function loadAllData() {
    setLoading(true);
    
    // Carrega dados do cedente
    const { data: cedenteData } = await supabase
      .from('cedentes')
      .select('id, nome, razao_social, cnpj, telefone, email, endereco, situacao, porte, natureza_juridica, data_abertura, capital_social, atividade_principal_codigo, atividade_principal_descricao, atividades_secundarias, simples_nacional')
      .eq('id', id)
      .single();
    
    setCedente(cedenteData);
    
    // Preenche o formulário de informações básicas
    if (cedenteData) {
      setInfoBasicas({
        nome: cedenteData.nome || '',
        razao_social: cedenteData.razao_social || '',
        cnpj: cedenteData.cnpj ? formatCpfCnpj(cedenteData.cnpj) : '',
        telefone: cedenteData.telefone || '',
        email: cedenteData.email || '',
        endereco: cedenteData.endereco || '',
        situacao: cedenteData.situacao || '',
        ativo: cedenteData.situacao === 'ATIVA',
        porte: cedenteData.porte || '',
        natureza_juridica: cedenteData.natureza_juridica || '',
        data_abertura: cedenteData.data_abertura ? cedenteData.data_abertura.split('T')[0] : '',
        capital_social: cedenteData.capital_social ? cedenteData.capital_social.toString() : '',
        atividade_principal_codigo: cedenteData.atividade_principal_codigo || '',
        atividade_principal_descricao: cedenteData.atividade_principal_descricao || '',
        atividades_secundarias: cedenteData.atividades_secundarias || '',
        simples_nacional: cedenteData.simples_nacional ?? false,
      });
    }

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
      // Usa BigData (mais confiável que CNPJWS)
      const res = await fetch(`/api/bigdata?cnpj=${raw}&tipo=basico`);
      const data = await res.json();
      
      if (!res.ok) {
        showToast(data?.error || 'Erro ao consultar CNPJ', 'error');
        return;
      }

      // BigData retorna no formato normalizado (mesmo formato do CNPJWS)
      const razao = data?.razao_social || '';
      const fantasia = data?.nome_fantasia || '';

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

  async function consultarAPIsSacadoFunc(cnpj: string, salvarNoBanco: boolean = false) {
    if (!cnpj || cnpj.length !== 14) return null;
    
    try {
      const tipos = ['enderecos', 'telefones', 'emails', 'qsa'];
      const resultados: any = {
        enderecos: [],
        telefones: [],
        emails: [],
        qsa: []
      };
      
      for (const tipo of tipos) {
        try {
          const res = await fetch(`/api/bigdata?cnpj=${encodeURIComponent(cnpj)}&tipo=${tipo}`);
          const response = await res.json();
          
          if (res.ok && response && Array.isArray(response) && response.length > 0) {
            resultados[tipo as keyof typeof resultados] = response;
            
            if (salvarNoBanco) {
              const tableName = tipo === 'enderecos' ? 'sacados_enderecos' :
                              tipo === 'telefones' ? 'sacados_telefones' :
                              tipo === 'emails' ? 'sacados_emails' :
                              tipo === 'qsa' ? 'sacados_qsa' : null;
              
              if (tableName) {
                // Remove dados antigos da API
                await supabase
                  .from(tableName)
                  .delete()
                  .eq('sacado_cnpj', cnpj)
                  .eq('origem', 'api');
                
                // Insere novos dados
                const dataToInsert = response.map((item: any) => ({
                  ...item,
                  sacado_cnpj: cnpj,
                  origem: 'api',
                  ativo: true
                }));
                
                await supabase.from(tableName).insert(dataToInsert);
              }
            }
          }
        } catch (err) {
          console.error(`Erro ao consultar ${tipo}:`, err);
        }
      }
      
      return resultados;
    } catch (err) {
      console.error('Erro ao consultar APIs:', err);
      return null;
    }
  }

  async function consultarAPIsAgoraSacado() {
    const cnpjLimpo = sacadoForm.cnpj.replace(/\D+/g, '');
    if (!cnpjLimpo || cnpjLimpo.length !== 14) {
      showToast('Informe um CNPJ válido com 14 dígitos para consultar as APIs', 'warning');
      return;
    }

    setLoadingAPIsSacado(true);
    try {
      const dados = await consultarAPIsSacadoFunc(cnpjLimpo, false);
      
      if (dados) {
        setDadosAPIsSacado(dados);
        showToast(`Encontrados: ${dados.enderecos.length} endereços, ${dados.telefones.length} telefones, ${dados.emails.length} emails, ${dados.qsa.length} sócios`, 'success');
      } else {
        showToast('Nenhum dado encontrado nas APIs para este CNPJ', 'warning');
      }
    } catch (e) {
      showToast('Erro ao consultar APIs', 'error');
    } finally {
      setLoadingAPIsSacado(false);
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
      // Pega o user_id do usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast('Usuário não autenticado', 'error');
        setSavingSacado(false);
        return;
      }

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
        user_id: user.id,
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
        // Se marcou para consultar APIs ou já consultou, salva os dados
        if (consultarAPIsSacado && raw && raw.length === 14) {
          await consultarAPIsSacadoFunc(raw, true);
        } else if (dadosAPIsSacado && raw && raw.length === 14) {
          // Se já consultou as APIs antes, salva os dados encontrados
          await consultarAPIsSacadoFunc(raw, true);
        }
        
        setSacadoForm({ cnpj: '', razao_social: '', nome_fantasia: '' });
        setShowAddSacado(false);
        setConsultarAPIsSacado(false);
        setDadosAPIsSacado(null);
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
    
    if (data) {
      const txt = data.processos_texto || '';
      setProcessosTexto(txt);
      setLastSavedProcessos(txt);
    } else {
      setProcessosTexto('');
      setLastSavedProcessos('');
    }
  }

  async function loadObservacoes() {
    // Carrega observação geral única da empresa
    const { data } = await supabase
      .from('cedentes_observacoes_gerais')
      .select('observacoes')
      .eq('cedente_id', id)
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
    try {
      const { error } = await supabase
        .from('cedentes_observacoes_gerais')
        .upsert({
          cedente_id: id,
          observacoes,
          processos_texto: processosTexto, // Mantém o valor atual de processos
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'cedente_id'
        });
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao salvar observação:', error);
      const errObj = error as any;
      const errMsg = errObj?.message || '';
      const errCode = errObj?.code || '';
      // Informa o usuário quando a tabela não existir
      if (errCode === 'PGRST205' || errMsg.includes('does not exist') || errMsg.includes('relation') || errMsg.includes('permission')) {
        showToast('Não foi possível salvar Observações Gerais. Rode os scripts database_schema_processos_observacoes.sql e database_schema_processos_detalhes_qsa.sql e recarregue o cache (NOTIFY pgrst, \"reload schema\").', 'error');
      }
      return false;
    }
  }

  async function saveProcessosTexto(texto: string) {
    try {
      const { error } = await supabase
        .from('cedentes_observacoes_gerais')
        .upsert({
          cedente_id: id,
          observacoes: observacoesGerais, // Mantém o valor atual de observações
          processos_texto: texto,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'cedente_id'
        });
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao salvar processos:', error);
      const errObj = error as any;
      const errMsg = errObj?.message || '';
      const errCode = errObj?.code || '';
      if (errCode === 'PGRST205' || errMsg.includes('does not exist') || errMsg.includes('column') || errMsg.includes('permission')) {
        showToast('Não foi possível salvar Processos. Garanta que a tabela/coluna existe (rode os scripts SQL) e recarregue o cache (NOTIFY pgrst, \"reload schema\").', 'error');
      }
      return false;
    }
  }

  async function saveInfoBasicas() {
    if (!infoBasicas.nome.trim()) {
      showToast('O nome é obrigatório', 'error');
      return false;
    }

    setSavingInfoBasicas(true);
    try {
      const { error } = await supabase
        .from('cedentes')
        .update({
          nome: infoBasicas.nome.trim(),
          razao_social: infoBasicas.razao_social.trim() || null,
          cnpj: infoBasicas.cnpj ? infoBasicas.cnpj.replace(/\D+/g, '') : null,
          telefone: infoBasicas.telefone.trim() || null,
          email: infoBasicas.email.trim() || null,
          endereco: infoBasicas.endereco.trim() || null,
          situacao: infoBasicas.ativo ? 'ATIVA' : (infoBasicas.situacao || null),
          porte: infoBasicas.porte.trim() || null,
          natureza_juridica: infoBasicas.natureza_juridica.trim() || null,
          data_abertura: infoBasicas.data_abertura || null,
          capital_social: infoBasicas.capital_social ? (() => {
            const cleaned = infoBasicas.capital_social.replace(/[^\d,.-]/g, '').replace(',', '.');
            const num = parseFloat(cleaned);
            return isNaN(num) ? null : num;
          })() : null,
          atividade_principal_codigo: infoBasicas.atividade_principal_codigo.trim() || null,
          atividade_principal_descricao: infoBasicas.atividade_principal_descricao.trim() || null,
          atividades_secundarias: infoBasicas.atividades_secundarias.trim() || null,
          simples_nacional: infoBasicas.simples_nacional,
          ultima_atualizacao: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;
      
      // Atualiza o estado do cedente
      setCedente(prev => prev ? {
        ...prev,
        nome: infoBasicas.nome.trim(),
        razao_social: infoBasicas.razao_social.trim() || null,
        cnpj: infoBasicas.cnpj ? infoBasicas.cnpj.replace(/\D+/g, '') : null,
        telefone: infoBasicas.telefone.trim() || null,
        email: infoBasicas.email.trim() || null,
        endereco: infoBasicas.endereco.trim() || null,
        situacao: infoBasicas.situacao || null,
        porte: infoBasicas.porte.trim() || null,
        natureza_juridica: infoBasicas.natureza_juridica.trim() || null,
        data_abertura: infoBasicas.data_abertura || null,
        capital_social: infoBasicas.capital_social ? (() => {
          const cleaned = infoBasicas.capital_social.replace(/[^\d,.-]/g, '').replace(',', '.');
          const num = parseFloat(cleaned);
          return isNaN(num) ? null : num;
        })() : null,
        atividade_principal_codigo: infoBasicas.atividade_principal_codigo.trim() || null,
        atividade_principal_descricao: infoBasicas.atividade_principal_descricao.trim() || null,
        atividades_secundarias: infoBasicas.atividades_secundarias.trim() || null,
        simples_nacional: infoBasicas.simples_nacional,
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

  async function fetchFromAPI(tipo: string, cpf?: string) {
    // Processos precisam de CPF, outros dados precisam de CNPJ
    if (tipo === 'processos') {
      if (!cpf) {
        showToast('CPF necessário para buscar processos', 'warning');
        return;
      }
    } else {
      if (!cedente?.cnpj) {
        showToast('Cedente sem CNPJ cadastrado', 'warning');
        return;
      }
    }

    try {
      let url: string;
      if (tipo === 'processos') {
        url = `/api/bigdata?cpf=${encodeURIComponent(cpf!)}&tipo=processos`;
      } else {
        url = `/api/bigdata?cnpj=${encodeURIComponent(cedente.cnpj)}&tipo=${tipo}`;
      }
      
      const res = await fetch(url);
      const response = await res.json();
      
      if (!res.ok) {
        const errorMsg = response.error || 'Erro ao buscar dados da API BigData';
        showToast(errorMsg, 'error');
        throw new Error(errorMsg);
      }

      const dados = Array.isArray(response) ? response : (response.data || []);
      
      // Para processos, adiciona ao texto existente
      if (tipo === 'processos') {
        if (Array.isArray(dados) && dados.length > 0) {
          const processoTexto = dados.map((p: any) => {
            let texto = `\n\n=== PROCESSOS ENCONTRADOS ===\n`;
            if (cpf) {
              texto += `CPF: ${cpf}\n`;
            }
            if (p.observacoes) {
              texto += p.observacoes;
            }
            return texto;
          }).join('\n\n');
          
          const novoTexto = processosTexto 
            ? `${processosTexto}\n${processoTexto}` 
            : processoTexto;
          
      setProcessosTexto(novoTexto);
      await saveProcessosTexto(novoTexto);
      // Processos adicionados silenciosamente - sem popup
        } else {
          showToast('Nenhum processo encontrado para este CPF', 'warning');
        }
        return;
      }
      
      // Para outros dados, salva normalmente
      // Verifica se há dados para salvar
      if (!Array.isArray(dados) || dados.length === 0) {
        showToast('Nenhum dado encontrado na API para este CNPJ', 'warning');
        return;
      }
      
      // Salva os dados no banco
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
        showToast('Erro ao salvar dados da API', 'error');
        throw error;
      }

      // Dados importados silenciosamente - sem popup de sucesso
      await loadCategoria(tipo, tableName);
    } catch (error) {
      console.error('Erro ao buscar da API:', error);
      // Erro já foi tratado acima, apenas propaga para o componente
      throw error;
    }
  }

  async function buscarProcessosPorCPF(cpf: string, nome: string) {
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (!cpfLimpo || cpfLimpo.length !== 11) {
      showToast('CPF inválido', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/bigdata?cpf=${encodeURIComponent(cpfLimpo)}&tipo=processos`);
      const response = await res.json();
      
      if (!res.ok) {
        const errorMsg = response.error || 'Erro ao buscar processos da API BigData';
        showToast(errorMsg, 'error');
        return;
      }

      const dados = Array.isArray(response) ? response : (response.data || []);
      
      if (!Array.isArray(dados) || dados.length === 0) {
        showToast('Nenhum processo encontrado para este CPF', 'warning');
        return;
      }

      // Formata os processos em texto
      let processosTexto = '';
      dados.forEach((p: any) => {
        processosTexto += `\n\n=== PROCESSOS JUDICIAIS (CPF: ${cpfLimpo}) ===\n`;
        if (p.observacoes) {
          processosTexto += p.observacoes;
        }
      });

      // Adiciona ao campo de detalhes do QSA
      const detalhesAtuais = qsaDetalhes || '';
      const novosDetalhes = detalhesAtuais 
        ? `${detalhesAtuais}\n${processosTexto}` 
        : processosTexto.trim();

      setQsaDetalhes(novosDetalhes);
      // Processos adicionados silenciosamente - sem popup
    } catch (error) {
      console.error('Erro ao buscar processos:', error);
      showToast('Erro ao buscar processos', 'error');
    }
  }

  function getTableNameByType(tipo: string): string {
    // Busca a tabela na configuração usando o apiType
    const categoria = categoriasCedentes.find(c => c.apiType === tipo);
    return categoria?.tableName || '';
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0369a1]"></div>
            <p className="mt-2 text-gray-600">Carregando...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!cedente) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="text-center py-8">
            <p className="text-gray-600">Cedente não encontrado</p>
            <Button variant="primary" onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push(`/cedentes/${id}`);
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
    <div className="flex min-h-screen bg-gray-50">
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
              // Se for "Relacionamentos", usa a primeira categoria do grupo para scroll
              const targetSection = secao.id === 'relacionamentos' ? 'pessoas_ligadas' : secao.id;
              const isActive = activeSection === targetSection || 
                               (secao.id === 'relacionamentos' && ['pessoas_ligadas', 'empresas_ligadas', 'qsa'].includes(activeSection));
              const categoria = categoriasCedentes.find(c => c.id === secao.id);
              const itemCount = categoria ? (categoriasData[secao.id] || []).length : 
                                secao.id === 'informacoes_basicas' ? 1 :
                                secao.id === 'observacoes' ? (observacoesGerais ? 1 : 0) : 
                                secao.id === 'processos' ? (processosTexto ? 1 : 0) :
                                secao.id === 'sacados' ? sacados.length :
                                secao.id === 'relacionamentos' ? 
                                  ((categoriasData['pessoas_ligadas'] || []).length + 
                                   (categoriasData['empresas_ligadas'] || []).length + 
                                   (categoriasData['qsa'] || []).length) : 0;

              return (
                <button
                  key={secao.id}
                  onClick={() => scrollToSection(targetSection)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  } ${secao.label.startsWith('  →') ? 'pl-6 text-xs' : ''}`}
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
        <div className="container max-w-6xl mx-auto px-4 py-6 space-y-4">
          <header className="mb-4">
            <button 
              onClick={() => {
                if (typeof window !== 'undefined' && window.history.length > 1) {
                  router.back();
                } else {
                  router.push(`/cedentes/${id}`);
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
                <h1 className="text-3xl font-bold text-[#0369a1] mb-1">
                  {cedente.nome}
                </h1>
                {cedente.razao_social && <p className="text-sm text-gray-600">{cedente.razao_social}</p>}
                {cedente.cnpj && <p className="text-xs text-gray-500 font-mono">{formatCpfCnpj(cedente.cnpj)}</p>}
              </div>
            </div>
          </header>

          {/* Informações Básicas - Formulário de Edição */}
          <div id="informacoes_basicas" ref={(el) => { sectionRefs.current['informacoes_basicas'] = el; }}>
            <div className="bg-white border border-gray-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setInfoBasicasCollapsed(!infoBasicasCollapsed)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      aria-label={infoBasicasCollapsed ? "Expandir" : "Recolher"}
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
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Informações Básicas</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Nome *"
                      value={infoBasicas.nome}
                      onChange={(e) => setInfoBasicas({ ...infoBasicas, nome: e.target.value })}
                      placeholder="Nome do cedente"
                      required
                    />
                    <Input
                      label="Razão Social"
                      value={infoBasicas.razao_social}
                      onChange={(e) => setInfoBasicas({ ...infoBasicas, razao_social: e.target.value })}
                      placeholder="Razão social"
                    />
                    <div>
                      <label className="block text-sm font-medium text-[#1e293b] mb-1">CNPJ</label>
                      <input
                        type="text"
                        value={infoBasicas.cnpj}
                        onChange={(e) => setInfoBasicas({ ...infoBasicas, cnpj: formatCpfCnpj(e.target.value) })}
                        placeholder="00.000.000/0000-00"
                        className="block w-full px-3 py-2 border border-[#cbd5e1] rounded-md shadow-sm transition-colors bg-white text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1] hover:border-[#0369a1]"
                        maxLength={18}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={infoBasicas.ativo}
                          onChange={(e) => {
                            const ativo = e.target.checked;
                            setInfoBasicas({ 
                              ...infoBasicas, 
                              ativo,
                              situacao: ativo ? 'ATIVA' : infoBasicas.situacao || 'INATIVA'
                            });
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Ativo</span>
                      </label>
                    </div>
                    <Select
                      label="Situação"
                      value={infoBasicas.situacao}
                      onChange={(e) => setInfoBasicas({ ...infoBasicas, situacao: e.target.value, ativo: e.target.value === 'ATIVA' })}
                      placeholder="Selecione a situação"
                      options={[
                        { value: 'ATIVA', label: 'ATIVA' },
                        { value: 'INATIVA', label: 'INATIVA' },
                        { value: 'SUSPENSA', label: 'SUSPENSA' },
                        { value: 'BAIXADA', label: 'BAIXADA' },
                        { value: 'INAPTA', label: 'INAPTA' },
                      ]}
                    />
                  </div>
                </div>

                {/* Contato */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Contato</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Telefone"
                      type="tel"
                      value={infoBasicas.telefone}
                      onChange={(e) => setInfoBasicas({ ...infoBasicas, telefone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                    <Input
                      label="E-mail"
                      type="email"
                      value={infoBasicas.email}
                      onChange={(e) => setInfoBasicas({ ...infoBasicas, email: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                    <Input
                      label="Endereço"
                      value={infoBasicas.endereco}
                      onChange={(e) => setInfoBasicas({ ...infoBasicas, endereco: e.target.value })}
                      placeholder="Rua, número, bairro, cidade, estado"
                      className="md:col-span-2"
                    />
                  </div>
                </div>

                {/* Informações Empresariais */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Informações Empresariais</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Porte"
                      value={infoBasicas.porte}
                      onChange={(e) => setInfoBasicas({ ...infoBasicas, porte: e.target.value })}
                      placeholder="Ex: Empresa de Pequeno Porte"
                    />
                    <Input
                      label="Natureza Jurídica"
                      value={infoBasicas.natureza_juridica}
                      onChange={(e) => setInfoBasicas({ ...infoBasicas, natureza_juridica: e.target.value })}
                      placeholder="Ex: Sociedade Empresária Limitada"
                    />
                    <Input
                      label="Data de Abertura"
                      type="date"
                      value={infoBasicas.data_abertura}
                      onChange={(e) => setInfoBasicas({ ...infoBasicas, data_abertura: e.target.value })}
                    />
                    <Input
                      label="Capital Social"
                      type="text"
                      value={infoBasicas.capital_social}
                      onChange={(e) => setInfoBasicas({ ...infoBasicas, capital_social: e.target.value })}
                      placeholder="Ex: 100000 ou 100.000,00"
                    />
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={infoBasicas.simples_nacional}
                          onChange={(e) => setInfoBasicas({ ...infoBasicas, simples_nacional: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Simples Nacional</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Atividades */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Atividades</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Código da Atividade Principal"
                      value={infoBasicas.atividade_principal_codigo}
                      onChange={(e) => setInfoBasicas({ ...infoBasicas, atividade_principal_codigo: e.target.value })}
                      placeholder="Ex: 2733-3/00"
                    />
                    <Input
                      label="Atividade Principal"
                      value={infoBasicas.atividade_principal_descricao}
                      onChange={(e) => setInfoBasicas({ ...infoBasicas, atividade_principal_descricao: e.target.value })}
                      placeholder="Descrição da atividade principal"
                    />
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#1e293b] mb-1">Atividades Secundárias</label>
                      <textarea
                        value={infoBasicas.atividades_secundarias}
                        onChange={(e) => setInfoBasicas({ ...infoBasicas, atividades_secundarias: e.target.value })}
                        placeholder="Liste as atividades secundárias separadas por ponto e vírgula"
                        rows={3}
                        className="block w-full px-3 py-2 border border-[#cbd5e1] rounded-md shadow-sm transition-colors bg-white text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1] hover:border-[#0369a1] resize-y"
                      />
                    </div>
                  </div>
                </div>
                </div>
                )}
              </div>
            </div>
          </div>

          {/* Observações Gerais da Empresa - TOPO */}
          <div id="observacoes" ref={(el) => { sectionRefs.current['observacoes'] = el; }}>
            <div className="bg-white border border-gray-300">
              <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
                <h2 className="text-xs font-semibold text-gray-700 uppercase">Observações Gerais - {cedente.nome}</h2>
              </div>
              <div className="p-4">
                <textarea
                  className="w-full px-3 py-2 text-sm border border-gray-300 min-h-[100px] resize-y"
                  value={observacoesGerais}
                  onChange={e => {
                    setObservacoesGerais(e.target.value);
                  }}
                  placeholder="Digite observações gerais sobre esta empresa: contexto, histórico, alertas, etc..."
                />
              </div>
            </div>
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
              'contatos': 'Informações de Contato',
              'relacionamentos': 'Relacionamentos',
              'outros': 'Outros'
            };

            return Object.entries(categoriasPorGrupo).map(([grupo, categorias]) => {
              // Adiciona ID de seção para o grupo "relacionamentos" para navegação
              const grupoId = grupo === 'relacionamentos' ? 'relacionamentos' : null;
              
              return (
                <div key={grupo} className="space-y-4">
                  {grupo !== 'outros' && (
                    <div 
                      id={grupoId || undefined}
                      ref={grupoId ? (el) => { sectionRefs.current[grupoId] = el; } : undefined}
                    >
                      <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                        {grupoLabels[grupo] || grupo}
                      </h2>
                    </div>
                  )}
                  <div className="space-y-4">
                    {categorias.map(categoria => (
                      <div 
                        key={categoria.id} 
                        id={categoria.id}
                        ref={(el) => { sectionRefs.current[categoria.id] = el; }}
                      >
                        <div className="bg-white border border-gray-300">
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
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            });
          })()}

          {/* Processos Judiciais - SIMPLIFICADO */}
          <div id="processos" ref={(el) => { sectionRefs.current['processos'] = el; }}>
            <div className="bg-white border border-gray-300">
              <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
                <h2 className="text-xs font-semibold text-gray-700 uppercase">Processos Judiciais e Informações Relevantes</h2>
              </div>
              <div className="p-4">
                <textarea
                  className="w-full px-3 py-2 text-sm border border-gray-300 min-h-[300px] resize-y font-mono"
                  value={processosTexto}
                  onChange={e => {
                    setProcessosTexto(e.target.value);
                  }}
                  placeholder="Cole aqui todos os processos e informações relevantes encontradas...&#10;&#10;Exemplo:&#10;PROCESSOS: 13&#10;&#10;Processo 1: ...&#10;Processo 2: ...&#10;&#10;INFORMAÇÕES:&#10;- Detalhes importantes&#10;- Endereços relacionados&#10;- Contatos úteis"
                />
              </div>
            </div>
          </div>

          {/* QSA com Botão de Detalhes (renderizado separadamente) */}
          {(() => {
            const categoriaQsa = categoriasCedentes.find(c => c.id === 'qsa');
            if (!categoriaQsa) return null;
            
            return (
              <div id="qsa" ref={(el) => { sectionRefs.current['qsa'] = el; }}>
                <div className="bg-white border border-gray-300">
                  <div className="border-b border-gray-300 bg-gray-100 px-4 py-2 flex items-center justify-between">
                    <h2 className="text-xs font-semibold text-gray-700 uppercase">{categoriaQsa.title}</h2>
                    <div className="flex gap-2">
                      {cedente.cnpj && categoriaQsa.apiType && (
                        <button
                          onClick={() => fetchFromAPI(categoriaQsa.apiType!).then(() => loadCategoria('qsa', categoriaQsa.tableName))}
                          className="px-2 py-1 text-xs border border-gray-300 bg-white hover:bg-gray-50 text-[#0369a1] font-medium"
                        >
                          API
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-4">

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
                      onOpenDetails={openQsaDetails}
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Sacados Relacionados */}
          <div id="sacados" ref={(el) => { sectionRefs.current['sacados'] = el; }}>
            <div className="bg-white border border-gray-300">
              <div className="border-b border-gray-300 bg-gray-100 px-4 py-2 flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-semibold text-gray-700 uppercase">Sacados Relacionados</h2>
                  <p className="text-xs text-gray-500 mt-1">Gerencie os sacados (devedores) deste cedente</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={sacadosQuery}
                    onChange={(e) => setSacadosQuery(e.target.value)}
                    placeholder="Buscar sacado (nome, CNPJ)"
                    className="px-3 py-1.5 text-sm border border-gray-300 w-64"
                  />
                  <button 
                    className="px-3 py-1.5 text-sm font-medium bg-[#0369a1] text-white hover:bg-[#075985]"
                    onClick={() => setShowAddSacado(true)}
                  >
                    + Adicionar
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-4">

            {sacados.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 border border-gray-300">
                <p className="text-gray-600 text-sm mb-2">Nenhum sacado cadastrado ainda</p>
                <button 
                  className="px-3 py-1.5 text-sm font-medium bg-[#0369a1] text-white hover:bg-[#075985]"
                  onClick={() => setShowAddSacado(true)}
                >
                  + Adicionar Primeiro Sacado
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
                            <button 
                              onClick={() => removerSacado(sacado.cnpj)}
                              className="px-2 py-1 border border-gray-300 bg-white hover:bg-gray-50 text-red-600 text-xs font-medium" 
                              title="Remover"
                              aria-label="Remover"
                            >
                              Remover
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
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={() => {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back();
  } else {
    router.push(`/cedentes/${id}`);
  }
}}>
              Voltar
            </Button>
            <Button 
              variant="primary" 
              onClick={async () => {
                // Salva informações básicas, observações e processos
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
                  setConsultarAPIsSacado(false);
                  setDadosAPIsSacado(null);
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
                    className="px-3 py-2 border border-blue-600 text-blue-600 rounded text-sm hover:bg-blue-50 disabled:opacity-50 whitespace-nowrap"
                    title="Consultar dados básicos na Receita"
                  >
                    {loadingSacadoCnpj ? 'Consultando...' : 'Receita'}
                  </button>
                  <button
                    onClick={consultarAPIsAgoraSacado}
                    disabled={loadingAPIsSacado || !sacadoForm.cnpj}
                    className="px-3 py-2 bg-[#0369a1] text-white rounded text-sm hover:bg-[#075985] disabled:opacity-50 whitespace-nowrap"
                    title="Consultar APIs BigData (endereços, telefones, emails, QSA)"
                  >
                    {loadingAPIsSacado ? 'Consultando...' : 'APIs'}
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

              {/* Resultados da Consulta de APIs */}
              {dadosAPIsSacado && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <h3 className="text-xs font-semibold text-green-800 mb-1">Dados encontrados nas APIs:</h3>
                      <div className="flex flex-wrap gap-1 text-xs">
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                          {dadosAPIsSacado.enderecos.length} Endereço{dadosAPIsSacado.enderecos.length !== 1 ? 's' : ''}
                        </span>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                          {dadosAPIsSacado.telefones.length} Telefone{dadosAPIsSacado.telefones.length !== 1 ? 's' : ''}
                        </span>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                          {dadosAPIsSacado.emails.length} E-mail{dadosAPIsSacado.emails.length !== 1 ? 's' : ''}
                        </span>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                          {dadosAPIsSacado.qsa.length} Sócio{dadosAPIsSacado.qsa.length !== 1 ? 's' : ''} (QSA)
                        </span>
                      </div>
                      <p className="text-xs text-green-700 mt-2">
                        Os dados serão salvos automaticamente ao adicionar o sacado.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Marcador de Consulta de APIs */}
              <div className="pt-2 border-t border-gray-200">
                <div 
                  className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                    consultarAPIsSacado 
                      ? 'border-[#0369a1] bg-blue-50' 
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                  onClick={() => setConsultarAPIsSacado(!consultarAPIsSacado)}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="consultar-apis-sacado-modal"
                      checked={consultarAPIsSacado}
                      onChange={(e) => setConsultarAPIsSacado(e.target.checked)}
                      className="mt-0.5 w-4 h-4 border-2 border-gray-300 text-[#0369a1] focus:ring-[#0369a1] cursor-pointer"
                    />
                    <div className="flex-1">
                      <label htmlFor="consultar-apis-sacado-modal" className="text-xs font-semibold text-[#0369a1] cursor-pointer block">
                        Consultar APIs após salvar (endereços, telefones, emails, QSA)
                      </label>
                      <p className="text-xs text-gray-600 mt-1">
                        {dadosAPIsSacado 
                          ? 'Dados já consultados. Serão salvos automaticamente ao adicionar o sacado.'
                          : 'Marque esta opção para que o sistema busque automaticamente dados complementares nas APIs BigData ao adicionar o sacado.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => {
                    setShowAddSacado(false);
                    setSacadoForm({ cnpj: '', razao_social: '', nome_fantasia: '' });
                    setConsultarAPIsSacado(false);
                    setDadosAPIsSacado(null);
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

      {/* Modal Detalhes QSA */}
      {showQsaDetails && selectedQsa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl border border-gray-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Detalhes: {selectedQsa.nome}
              </h2>
              <button
                onClick={() => {
                  setShowQsaDetails(false);
                  setSelectedQsa(null);
                  setQsaDetalhes('');
                }}
                className="px-2 py-1 text-gray-500 hover:text-gray-900 text-xl"
                aria-label="Fechar"
              >×</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">CPF:</span> {selectedQsa.cpf || '—'}</div>
                  <div><span className="font-medium">Qualificação:</span> {selectedQsa.qualificacao || '—'}</div>
                </div>
              </div>

              {/* Botão para buscar processos */}
              {selectedQsa.cpf && (
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      await buscarProcessosPorCPF(selectedQsa.cpf, selectedQsa.nome);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors"
                  >
                    ⚖️ Buscar Processos deste CPF
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Informações Completas (Detalhes, endereços, telefones, processos, etc.)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[400px] resize-y font-mono text-sm"
                  value={qsaDetalhes}
                  onChange={(e) => setQsaDetalhes(e.target.value)}
                  placeholder="Cole aqui todas as informações encontradas sobre esta pessoa: endereços, telefones, e-mails, processos judiciais, familiares, empresas relacionadas, etc."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 px-5 py-3 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowQsaDetails(false);
                  setSelectedQsa(null);
                  setQsaDetalhes('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={saveQsaDetalhes}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                Salvar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

