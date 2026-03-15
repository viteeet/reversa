'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj } from '@/lib/format';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import CompactDataManager from '@/components/shared/CompactDataManager';
import { categoriasCedentes } from '@/config/cedentesCategorias';
import { useToast } from '@/components/ui/ToastContainer';

const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor'), { ssr: false });

type Sacado = {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  endereco_receita: string | null;
  telefone_receita: string | null;
  email_receita: string | null;
  situacao: string | null;
  porte: string | null;
  natureza_juridica: string | null;
  data_abertura: string | null;
  capital_social: number | null;
  atividade_principal_codigo: string | null;
  atividade_principal_descricao: string | null;
  atividades_secundarias: string | null;
  simples_nacional: boolean | null;
  grupo_empresa_id: string | null;
};

// Mapeia tabelas de cedentes para sacados
const sacadoTableMapping: Record<string, string> = {
  'cedentes_qsa': 'sacados_qsa',
  'cedentes_enderecos': 'sacados_enderecos',
  'cedentes_telefones': 'sacados_telefones',
  'cedentes_emails': 'sacados_emails',
  'cedentes_pessoas_ligadas': 'sacados_pessoas_ligadas',
  'cedentes_empresas_ligadas': 'sacados_empresas_ligadas',
};

export default function EditarSacadoPage() {
  const router = useRouter();
  const params = useParams();
  const cnpj = decodeURIComponent(params.cnpj as string);
  
  const [sacado, setSacado] = useState<Sacado | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCategorias, setLoadingCategorias] = useState<Record<string, boolean>>({});
  
  // Estados para informações básicas editáveis
  const [infoBasicas, setInfoBasicas] = useState({
    razao_social: '',
    nome_fantasia: '',
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
  
  // Estados para gerenciamento de grupos
  const [grupoInfo, setGrupoInfo] = useState<{ id: string; nome_grupo: string; cnpjs_count: number } | null>(null);
  const [gruposDisponiveis, setGruposDisponiveis] = useState<{ id: string; nome_grupo: string; tipo_entidade: string }[]>([]);
  const [showGrupoModal, setShowGrupoModal] = useState(false);
  const [grupoForm, setGrupoForm] = useState({ grupo_id: '', criar_novo: false, nome_novo_grupo: '' });
  const [loadingGrupos, setLoadingGrupos] = useState(false);
  
  // Modal de detalhes de pessoa do QSA
  const [showQsaDetails, setShowQsaDetails] = useState(false);
  const [selectedQsa, setSelectedQsa] = useState<any>(null);
  const [qsaDetalhes, setQsaDetalhes] = useState('');

  // Estados para navegação lateral e botão voltar ao topo
  const [activeSection, setActiveSection] = useState<string>('');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  const { showToast } = useToast();

  useEffect(() => {
    loadAllData();
  }, [cnpj]);

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

  // Lista de seções para navegação (sem "Sacados Relacionados")
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
  ];

  async function excluirSacado() {
    if (!sacado) return;
    
    const confirmacao = confirm(
      `Tem certeza que deseja excluir o sacado "${sacado.razao_social}"?\n\n` +
      `Esta ação não pode ser desfeita e excluirá todos os dados relacionados (endereços, telefones, emails, QSA, processos, etc.).`
    );
    
    if (!confirmacao) return;

    try {
      const { error } = await supabase
        .from('sacados')
        .delete()
        .eq('cnpj', cnpj);

      if (error) {
        showToast('Erro ao excluir sacado: ' + error.message, 'error');
      } else {
        showToast('Sacado excluído com sucesso', 'success');
        router.push('/sacados');
      }
    } catch (err) {
      showToast('Erro ao excluir sacado', 'error');
      console.error(err);
    }
  }

  async function loadAllData() {
    setLoading(true);
    
    // Carrega dados do sacado
    const { data: sacadoData } = await supabase
      .from('sacados')
      .select('cnpj, razao_social, nome_fantasia, endereco_receita, telefone_receita, email_receita, situacao, porte, natureza_juridica, data_abertura, capital_social, atividade_principal_codigo, atividade_principal_descricao, atividades_secundarias, simples_nacional, grupo_empresa_id')
      .eq('cnpj', cnpj)
      .single();
    
    setSacado(sacadoData);
    
    // Preenche o formulário de informações básicas
    if (sacadoData) {
      setInfoBasicas({
        razao_social: sacadoData.razao_social || '',
        nome_fantasia: sacadoData.nome_fantasia || '',
        cnpj: sacadoData.cnpj ? formatCpfCnpj(sacadoData.cnpj) : '',
        telefone: sacadoData.telefone_receita || '',
        email: sacadoData.email_receita || '',
        endereco: sacadoData.endereco_receita || '',
        situacao: sacadoData.situacao || '',
        ativo: sacadoData.situacao === 'ATIVA',
        porte: sacadoData.porte || '',
        natureza_juridica: sacadoData.natureza_juridica || '',
        data_abertura: sacadoData.data_abertura ? sacadoData.data_abertura.split('T')[0] : '',
        capital_social: sacadoData.capital_social ? sacadoData.capital_social.toString() : '',
        atividade_principal_codigo: sacadoData.atividade_principal_codigo || '',
        atividade_principal_descricao: sacadoData.atividade_principal_descricao || '',
        atividades_secundarias: sacadoData.atividades_secundarias || '',
        simples_nacional: sacadoData.simples_nacional ?? false,
      });
    }

    // Carrega informações do grupo, se houver
    if (sacadoData?.grupo_empresa_id) {
      const { data: grupoData } = await supabase
        .from('empresas_grupo')
        .select('id, nome_grupo')
        .eq('id', sacadoData.grupo_empresa_id)
        .single();
      
      if (grupoData) {
        const { count } = await supabase
          .from('empresas_grupo_cnpjs')
          .select('*', { count: 'exact', head: true })
          .eq('grupo_id', grupoData.id)
          .eq('ativo', true);
        
        setGrupoInfo({
          id: grupoData.id,
          nome_grupo: grupoData.nome_grupo,
          cnpjs_count: count || 0
        });
      }
    } else {
      setGrupoInfo(null);
    }

    // Carrega todos os dados complementares
    await Promise.all([
      ...categoriasCedentes.map(cat => loadCategoria(cat.id, sacadoTableMapping[cat.tableName] || cat.tableName.replace('cedentes_', 'sacados_'))),
      loadProcessos(),
      loadObservacoes(),
      loadGruposDisponiveis()
    ]);
    
    setLoading(false);
  }

  async function loadGruposDisponiveis() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('empresas_grupo')
      .select('id, nome_grupo, cnpj_matriz')
      .eq('user_id', user.id)
      .order('nome_grupo', { ascending: true });

    if (data) {
      // Para cada grupo, verifica o tipo de entidade pelo CNPJ matriz
      const gruposComTipo = await Promise.all(
        data.map(async (grupo) => {
          // Verifica se o CNPJ matriz está em sacados ou cedentes
          const { data: sacadoData } = await supabase
            .from('sacados')
            .select('cnpj')
            .eq('cnpj', grupo.cnpj_matriz)
            .single();
          
          return {
            id: grupo.id,
            nome_grupo: grupo.nome_grupo,
            tipo_entidade: sacadoData ? 'sacado' : 'cedente'
          };
        })
      );

      // Filtra apenas grupos de sacados
      setGruposDisponiveis(gruposComTipo.filter(g => g.tipo_entidade === 'sacado'));
    }
  }

  async function adicionarAoGrupo() {
    if (grupoForm.criar_novo) {
      // Criar novo grupo
      if (!grupoForm.nome_novo_grupo.trim()) {
        showToast('Nome do grupo é obrigatório', 'error');
        return;
      }

      setLoadingGrupos(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autenticado');

        const cnpjLimpo = cnpj.replace(/\D+/g, '');

        // Cria o grupo
        const { data: novoGrupo, error: grupoError } = await supabase
          .from('empresas_grupo')
          .insert({
            nome_grupo: grupoForm.nome_novo_grupo.trim(),
            cnpj_matriz: cnpjLimpo,
            user_id: user.id
          })
          .select()
          .single();

        if (grupoError) throw grupoError;

        // Vincula o CNPJ matriz ao grupo
        const { error: cnpjError } = await supabase
          .from('empresas_grupo_cnpjs')
          .insert({
            grupo_id: novoGrupo.id,
            cnpj: cnpjLimpo,
            tipo_entidade: 'sacado',
            tipo_unidade: 'matriz',
            ordem: 0,
            ativo: true
          });

        if (cnpjError) throw cnpjError;

        // Atualiza o campo grupo_empresa_id
        await supabase
          .from('sacados')
          .update({ grupo_empresa_id: novoGrupo.id })
          .eq('cnpj', cnpjLimpo);

        showToast('Grupo criado e sacado vinculado com sucesso!', 'success');
        setShowGrupoModal(false);
        setGrupoForm({ grupo_id: '', criar_novo: false, nome_novo_grupo: '' });
        await loadAllData();
      } catch (error: any) {
        console.error('Erro ao criar grupo:', error);
        showToast('Erro ao criar grupo', 'error');
      } finally {
        setLoadingGrupos(false);
      }
    } else {
      // Adicionar a grupo existente
      if (!grupoForm.grupo_id) {
        showToast('Selecione um grupo', 'error');
        return;
      }

      setLoadingGrupos(true);
      try {
        const cnpjLimpo = cnpj.replace(/\D+/g, '');

        // Verifica se já está vinculado
        const { data: jaVinculado } = await supabase
          .from('empresas_grupo_cnpjs')
          .select('id')
          .eq('grupo_id', grupoForm.grupo_id)
          .eq('cnpj', cnpjLimpo)
          .eq('ativo', true)
          .single();

        if (jaVinculado) {
          showToast('Este sacado já está neste grupo', 'warning');
          setLoadingGrupos(false);
          return;
        }

        // Adiciona ao grupo
        const { error: cnpjError } = await supabase
          .from('empresas_grupo_cnpjs')
          .insert({
            grupo_id: grupoForm.grupo_id,
            cnpj: cnpjLimpo,
            tipo_entidade: 'sacado',
            tipo_unidade: 'filial',
            ordem: 0,
            ativo: true
          });

        if (cnpjError) throw cnpjError;

        // Atualiza o campo grupo_empresa_id
        await supabase
          .from('sacados')
          .update({ grupo_empresa_id: grupoForm.grupo_id })
          .eq('cnpj', cnpjLimpo);

        showToast('Sacado adicionado ao grupo com sucesso!', 'success');
        setShowGrupoModal(false);
        setGrupoForm({ grupo_id: '', criar_novo: false, nome_novo_grupo: '' });
        await loadAllData();
      } catch (error: any) {
        console.error('Erro ao adicionar ao grupo:', error);
        showToast('Erro ao adicionar ao grupo', 'error');
      } finally {
        setLoadingGrupos(false);
      }
    }
  }

  async function removerDoGrupo() {
    if (!grupoInfo) return;

    setLoadingGrupos(true);
    try {
      const cnpjLimpo = cnpj.replace(/\D+/g, '');

      // Remove o vínculo do grupo
      const { error: cnpjError } = await supabase
        .from('empresas_grupo_cnpjs')
        .update({ ativo: false })
        .eq('grupo_id', grupoInfo.id)
        .eq('cnpj', cnpjLimpo);

      if (cnpjError) throw cnpjError;

      // Remove o campo grupo_empresa_id
      await supabase
        .from('sacados')
        .update({ grupo_empresa_id: null })
        .eq('cnpj', cnpjLimpo);

      showToast('Sacado removido do grupo com sucesso!', 'success');
      await loadAllData();
    } catch (error: any) {
      console.error('Erro ao remover do grupo:', error);
      showToast('Erro ao remover do grupo', 'error');
    } finally {
      setLoadingGrupos(false);
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
        .eq('sacado_cnpj', cnpj)
        .eq('ativo', true);

      // Ordenação específica por categoria
      if (categoriaId === 'qsa' || categoriaId === 'pessoas_ligadas') {
        query = query.order('nome');
      } else if (['enderecos', 'telefones', 'emails'].includes(categoriaId)) {
        query = query.order('principal', { ascending: false });
      } else if (categoriaId === 'empresas_ligadas') {
        query = query.order('razao_social');
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

  async function loadProcessos() {
    const { data } = await supabase
      .from('sacados_observacoes_gerais')
      .select('processos_texto')
      .eq('sacado_cnpj', cnpj)
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
    const { data } = await supabase
      .from('sacados_observacoes_gerais')
      .select('observacoes')
      .eq('sacado_cnpj', cnpj)
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
        .from('sacados_observacoes_gerais')
        .upsert({
          sacado_cnpj: cnpj,
          observacoes,
          processos_texto: processosTexto,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'sacado_cnpj'
        });
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao salvar observação:', error);
      const errObj = error as any;
      const errMsg = errObj?.message || '';
      const errCode = errObj?.code || '';
      if (errCode === 'PGRST205' || errMsg.includes('does not exist') || errMsg.includes('relation') || errMsg.includes('permission')) {
        showToast('Não foi possível salvar Observações Gerais. Rode os scripts database_schema_processos_observacoes.sql e database_schema_processos_detalhes_qsa.sql e recarregue o cache (NOTIFY pgrst, \"reload schema\").', 'error');
      }
      return false;
    }
  }

  async function saveProcessosTexto(texto: string) {
    try {
      const { error } = await supabase
        .from('sacados_observacoes_gerais')
        .upsert({
          sacado_cnpj: cnpj,
          observacoes: observacoesGerais,
          processos_texto: texto,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'sacado_cnpj'
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
    if (!infoBasicas.razao_social.trim()) {
      showToast('A razão social é obrigatória', 'error');
      return false;
    }

    setSavingInfoBasicas(true);
    try {
      const { error } = await supabase
        .from('sacados')
        .update({
          razao_social: infoBasicas.razao_social.trim(),
          nome_fantasia: infoBasicas.nome_fantasia.trim() || null,
          cnpj: infoBasicas.cnpj ? infoBasicas.cnpj.replace(/\D+/g, '') : null,
          telefone_receita: infoBasicas.telefone.trim() || null,
          email_receita: infoBasicas.email.trim() || null,
          endereco_receita: infoBasicas.endereco.trim() || null,
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
        .eq('cnpj', cnpj);
      
      if (error) throw error;
      
      // Atualiza o estado do sacado
      setSacado(prev => prev ? {
        ...prev,
        razao_social: infoBasicas.razao_social.trim(),
        nome_fantasia: infoBasicas.nome_fantasia.trim() || null,
        telefone_receita: infoBasicas.telefone.trim() || null,
        email_receita: infoBasicas.email.trim() || null,
        endereco_receita: infoBasicas.endereco.trim() || null,
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
        .from('sacados_qsa_detalhes')
        .upsert({
          qsa_id: selectedQsa.id,
          sacado_cnpj: cnpj,
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
      .from('sacados_qsa_detalhes')
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
      if (!sacado?.cnpj) {
        showToast('Sacado sem CNPJ cadastrado', 'warning');
        return;
      }
    }

    try {
      let url: string;
      if (tipo === 'processos') {
        url = `/api/bigdata?cpf=${encodeURIComponent(cpf!)}&tipo=processos`;
      } else {
        url = `/api/bigdata?cnpj=${encodeURIComponent(sacado.cnpj)}&tipo=${tipo}`;
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
        } else {
          showToast('Nenhum processo encontrado para este CPF', 'warning');
        }
        return;
      }
      
      // Para outros dados, salva normalmente
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
        .eq('sacado_cnpj', cnpj)
        .eq('origem', 'api');

      if (deleteError) {
        console.error('Erro ao limpar dados antigos da API:', deleteError);
      }

      // Insere os novos dados da API
      const dataToInsert = dados.map(item => ({
        ...item,
        sacado_cnpj: cnpj,
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

      await loadCategoria(tipo, tableName);
    } catch (error) {
      console.error('Erro ao buscar da API:', error);
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
      let processosTextoFormatado = '';
      dados.forEach((p: any) => {
        processosTextoFormatado += `\n\n=== PROCESSOS JUDICIAIS (CPF: ${cpfLimpo}) ===\n`;
        if (p.observacoes) {
          processosTextoFormatado += p.observacoes;
        }
      });

      // Adiciona ao campo de detalhes do QSA
      const detalhesAtuais = qsaDetalhes || '';
      const novosDetalhes = detalhesAtuais 
        ? `${detalhesAtuais}\n${processosTextoFormatado}` 
        : processosTextoFormatado.trim();

      setQsaDetalhes(novosDetalhes);
    } catch (error) {
      console.error('Erro ao buscar processos:', error);
      showToast('Erro ao buscar processos', 'error');
    }
  }

  function getTableNameByType(tipo: string): string {
    // Busca a tabela na configuração usando o apiType e mapeia para sacados
    const categoria = categoriasCedentes.find(c => c.apiType === tipo);
    if (!categoria) return '';
    
    const cedenteTable = categoria.tableName;
    return sacadoTableMapping[cedenteTable] || cedenteTable.replace('cedentes_', 'sacados_');
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
                router.push(`/sacados/${encodeURIComponent(cnpj)}`);
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
              // Se for "Relacionamentos", usa a primeira categoria do grupo para scroll
              const targetSection = secao.id === 'relacionamentos' ? 'pessoas_ligadas' : secao.id;
              const isActive = activeSection === targetSection || 
                               (secao.id === 'relacionamentos' && ['pessoas_ligadas', 'empresas_ligadas', 'qsa'].includes(activeSection));
              const categoria = categoriasCedentes.find(c => c.id === secao.id);
              const itemCount = categoria ? (categoriasData[secao.id] || []).length : 
                                secao.id === 'informacoes_basicas' ? 1 :
                                secao.id === 'observacoes' ? (observacoesGerais ? 1 : 0) : 
                                secao.id === 'processos' ? (processosTexto ? 1 : 0) :
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
        <div className="container max-w-6xl mx-auto p-6 space-y-6">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#0369a1]">
                {sacado.razao_social}
              </h1>
              {sacado.nome_fantasia && <p className="text-[#64748b]">{sacado.nome_fantasia}</p>}
              {sacado.cnpj && <p className="text-sm text-[#64748b] font-mono">{formatCpfCnpj(sacado.cnpj)}</p>}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="error" 
                onClick={excluirSacado}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Excluir
              </Button>
              <Button variant="secondary" onClick={() => {
                if (typeof window !== 'undefined' && window.history.length > 1) {
                  router.back();
                } else {
                  router.push(`/sacados/${encodeURIComponent(cnpj)}`);
                }
              }}>
                Voltar
              </Button>
            </div>
          </header>

          {/* Modal para Adicionar ao Grupo */}
          {showGrupoModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md mx-4">
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-800">Gerenciar Grupo</h3>
                    <button
                      onClick={() => {
                        setShowGrupoModal(false);
                        setGrupoForm({ grupo_id: '', criar_novo: false, nome_novo_grupo: '' });
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-2 mb-3">
                        <input
                          type="radio"
                          checked={!grupoForm.criar_novo}
                          onChange={() => setGrupoForm({ ...grupoForm, criar_novo: false, grupo_id: '', nome_novo_grupo: '' })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium text-gray-700">Adicionar a grupo existente</span>
                      </label>
                      {!grupoForm.criar_novo && (
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={grupoForm.grupo_id}
                          onChange={(e) => setGrupoForm({ ...grupoForm, grupo_id: e.target.value })}
                        >
                          <option value="">Selecione um grupo...</option>
                          {gruposDisponiveis.map(grupo => (
                            <option key={grupo.id} value={grupo.id}>
                              {grupo.nome_grupo}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-2 mb-3">
                        <input
                          type="radio"
                          checked={grupoForm.criar_novo}
                          onChange={() => setGrupoForm({ ...grupoForm, criar_novo: true, grupo_id: '', nome_novo_grupo: '' })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium text-gray-700">Criar novo grupo (este sacado será a matriz)</span>
                      </label>
                      {grupoForm.criar_novo && (
                        <Input
                          placeholder="Nome do grupo (ex: Paradox Jeans)"
                          value={grupoForm.nome_novo_grupo}
                          onChange={(e) => setGrupoForm({ ...grupoForm, nome_novo_grupo: e.target.value })}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="primary"
                      onClick={adicionarAoGrupo}
                      disabled={loadingGrupos || (!grupoForm.criar_novo && !grupoForm.grupo_id) || (grupoForm.criar_novo && !grupoForm.nome_novo_grupo.trim())}
                      loading={loadingGrupos}
                      className="flex-1"
                    >
                      {grupoForm.criar_novo ? 'Criar Grupo' : 'Adicionar ao Grupo'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowGrupoModal(false);
                        setGrupoForm({ grupo_id: '', criar_novo: false, nome_novo_grupo: '' });
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Informações Básicas - Formulário de Edição */}
          <div id="informacoes_basicas" ref={(el) => { sectionRefs.current['informacoes_basicas'] = el; }}>
            <Card>
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
                      disabled={!infoBasicas.razao_social.trim()}
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
                      label="Razão Social *"
                      value={infoBasicas.razao_social}
                      onChange={(e) => setInfoBasicas({ ...infoBasicas, razao_social: e.target.value })}
                      placeholder="Razão social"
                      required
                    />
                    <Input
                      label="Nome Fantasia"
                      value={infoBasicas.nome_fantasia}
                      onChange={(e) => setInfoBasicas({ ...infoBasicas, nome_fantasia: e.target.value })}
                      placeholder="Nome fantasia"
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
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Contato</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Telefone"
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
                    <div className="md:col-span-2">
                      <Input
                        label="Endereço"
                        value={infoBasicas.endereco}
                        onChange={(e) => setInfoBasicas({ ...infoBasicas, endereco: e.target.value })}
                        placeholder="Endereço completo"
                      />
                    </div>
                  </div>
                </div>

                {/* Informações Empresariais */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Informações Empresariais</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Select
                      label="Porte"
                      value={infoBasicas.porte}
                      onChange={(e) => setInfoBasicas({ ...infoBasicas, porte: e.target.value })}
                      placeholder="Selecione o porte"
                      options={[
                        { value: 'MICRO EMPRESA', label: 'Micro Empresa' },
                        { value: 'EMPRESA DE PEQUENO PORTE', label: 'Empresa de Pequeno Porte' },
                        { value: 'DEMAIS', label: 'Demais' },
                      ]}
                    />
                    <Input
                      label="Natureza Jurídica"
                      value={infoBasicas.natureza_juridica}
                      onChange={(e) => setInfoBasicas({ ...infoBasicas, natureza_juridica: e.target.value })}
                      placeholder="Natureza jurídica"
                    />
                    <Input
                      label="Data de Abertura"
                      type="date"
                      value={infoBasicas.data_abertura}
                      onChange={(e) => setInfoBasicas({ ...infoBasicas, data_abertura: e.target.value })}
                    />
                    <Input
                      label="Capital Social"
                      value={infoBasicas.capital_social}
                      onChange={(e) => setInfoBasicas({ ...infoBasicas, capital_social: e.target.value })}
                      placeholder="0.00"
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
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Atividades</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Código da Atividade Principal"
                      value={infoBasicas.atividade_principal_codigo}
                      onChange={(e) => setInfoBasicas({ ...infoBasicas, atividade_principal_codigo: e.target.value })}
                      placeholder="0000-0/00"
                    />
                    <div className="md:col-span-2">
                      <Input
                        label="Atividade Principal"
                        value={infoBasicas.atividade_principal_descricao}
                        onChange={(e) => setInfoBasicas({ ...infoBasicas, atividade_principal_descricao: e.target.value })}
                        placeholder="Descrição da atividade principal"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#1e293b] mb-1">Atividades Secundárias</label>
                      <textarea
                        className="block w-full px-3 py-2 border border-[#cbd5e1] rounded-md shadow-sm transition-colors bg-white text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1] hover:border-[#0369a1] min-h-[100px] resize-y"
                        value={infoBasicas.atividades_secundarias}
                        onChange={(e) => setInfoBasicas({ ...infoBasicas, atividades_secundarias: e.target.value })}
                        placeholder="Liste as atividades secundárias, uma por linha"
                      />
                    </div>
                  </div>
                </div>
                </div>
                )}
              </div>
            </Card>
          </div>

          {/* Gerenciamento de Grupo */}
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Grupo de Empresas</h3>
              </div>
              
              {grupoInfo ? (
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <Badge variant="info" size="md">Grupo</Badge>
                    <div>
                      <p className="font-semibold text-gray-800">{grupoInfo.nome_grupo}</p>
                      <p className="text-sm text-gray-600">{grupoInfo.cnpjs_count} CNPJ(s) no grupo</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push(`/empresas-grupo/${grupoInfo.id}/editar`)}
                    >
                      Ver Grupo
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja remover este sacado do grupo?')) {
                          removerDoGrupo();
                        }
                      }}
                    >
                      Remover do Grupo
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">Este sacado não está em nenhum grupo.</p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setShowGrupoModal(true);
                      loadGruposDisponiveis();
                    }}
                  >
                    + Adicionar a um Grupo
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Observações Gerais da Empresa - TOPO */}
          <div id="observacoes" ref={(el) => { sectionRefs.current['observacoes'] = el; }}>
            <Card>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Observações Gerais - {sacado.razao_social}
                </label>
                <RichTextEditor
                  content={observacoesGerais}
                  onChange={(html) => setObservacoesGerais(html)}
                  placeholder="Digite observações gerais sobre esta empresa: contexto, histórico, alertas, etc..."
                />
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
                        <Card>
                          <CompactDataManager
                            title={categoria.title}
                            entityId={cnpj}
                            tableName={sacadoTableMapping[categoria.tableName] || categoria.tableName.replace('cedentes_', 'sacados_')}
                            items={categoriasData[categoria.id] || []}
                            onRefresh={() => loadCategoria(categoria.id, sacadoTableMapping[categoria.tableName] || categoria.tableName.replace('cedentes_', 'sacados_'))}
                            onFetchFromAPI={sacado?.cnpj && categoria.apiType ? () => fetchFromAPI(categoria.apiType!) : undefined}
                            fields={categoria.fields}
                            displayFields={categoria.displayFields}
                            isLoading={loadingCategorias[categoria.id]}
                          />
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              );
            });
          })()}

          {/* Processos Judiciais - SIMPLIFICADO */}
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
                  placeholder="Cole aqui todos os processos e informações relevantes encontradas...&#10;&#10;Exemplo:&#10;PROCESSOS: 13&#10;&#10;Processo 1: ...&#10;Processo 2: ...&#10;&#10;INFORMAÇÕES:&#10;- Detalhes importantes&#10;- Endereços relacionados&#10;- Contatos úteis"
                />
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
                        {sacado.cnpj && categoriaQsa.apiType && (
                          <button
                            onClick={() => fetchFromAPI(categoriaQsa.apiType!).then(() => loadCategoria('qsa', sacadoTableMapping[categoriaQsa.tableName] || categoriaQsa.tableName.replace('cedentes_', 'sacados_')))}
                            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
                          >
                            API
                          </button>
                        )}
                      </div>
                    </div>

                    <CompactDataManager
                      title=""
                      entityId={cnpj}
                      tableName={sacadoTableMapping[categoriaQsa.tableName] || categoriaQsa.tableName.replace('cedentes_', 'sacados_')}
                      items={categoriasData['qsa'] || []}
                      onRefresh={() => loadCategoria('qsa', sacadoTableMapping[categoriaQsa.tableName] || categoriaQsa.tableName.replace('cedentes_', 'sacados_'))}
                      fields={categoriaQsa.fields}
                      displayFields={categoriaQsa.displayFields}
                      showDetailsButton={categoriaQsa.showDetailsButton}
                      isLoading={loadingCategorias['qsa']}
                      onOpenDetails={openQsaDetails}
                    />
                  </div>
                </Card>
              </div>
            );
          })()}

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push(`/sacados/${encodeURIComponent(cnpj)}`);
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
