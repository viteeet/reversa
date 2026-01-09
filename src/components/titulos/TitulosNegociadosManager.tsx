'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj, parseMoneyInput, formatMoneyInput, formatMoney } from '@/lib/format';
import { validarCNPJ } from '@/lib/validations';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/ToastContainer';
import * as XLSX from 'xlsx';
import TitulosAtividadesManager from '@/components/atividades/TitulosAtividadesManager';

type TituloNegociado = {
  id: string;
  cedente_id: string;
  sacado_cnpj: string;
  numero_titulo: string;
  valor_original: number;
  valor_atualizado: number;
  data_vencimento_original: string;
  data_entrada_sistema: string;
  telefone: string | null;
  status: string;
  critica: string | null;
  checagem: string | null;
  vadu: string | null;
  fundo: string | null;
  quantidade_atividades?: number;
  sacado?: {
    razao_social: string;
    nome_fantasia: string | null;
  };
};

type Parcelamento = {
  id: string;
  cedente_id: string;
  descricao: string | null;
  valor_total_negociado: number;
  taxa_juros: number | null;
  data_primeira_parcela: string;
  intervalo_parcelas: string;
  intervalo_dias: number | null;
  status: string;
  observacoes: string | null;
  created_at: string;
  titulos?: TituloNegociado[];
  parcelas?: Parcela[];
};

type Parcela = {
  id: string;
  parcelamento_id: string;
  numero_parcela: number;
  valor: number;
  data_vencimento: string;
  status: string;
  data_pagamento: string | null;
  valor_pago: number | null;
  observacoes: string | null;
};

type Sacado = {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
};

type Critica = {
  id: string;
  nome: string;
  descricao: string | null;
  ordem: number;
};

type Fundo = {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
};

interface TitulosNegociadosManagerProps {
  cedenteId: string;
}

export default function TitulosNegociadosManager({ cedenteId }: TitulosNegociadosManagerProps) {
  const { showToast } = useToast();
  const [titulos, setTitulos] = useState<TituloNegociado[]>([]);
  const [parcelamentos, setParcelamentos] = useState<Parcelamento[]>([]);
  const [sacados, setSacados] = useState<Sacado[]>([]);
  const [criticas, setCriticas] = useState<Critica[]>([]);
  const [fundos, setFundos] = useState<Fundo[]>([]);
  const [showAddCritica, setShowAddCritica] = useState(false);
  const [novaCriticaNome, setNovaCriticaNome] = useState('');
  const [showAddFundo, setShowAddFundo] = useState(false);
  const [novoFundoNome, setNovoFundoNome] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddTitulo, setShowAddTitulo] = useState(false);
  const [showEditTitulo, setShowEditTitulo] = useState(false);
  const [tituloEditando, setTituloEditando] = useState<TituloNegociado | null>(null);
  const [showParcelar, setShowParcelar] = useState(false);
  const [selectedTitulos, setSelectedTitulos] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportar, setShowImportar] = useState(false);
  const [importando, setImportando] = useState(false);
  const [dadosImportados, setDadosImportados] = useState<any[]>([]);
  const [consultarAPIsImportacao, setConsultarAPIsImportacao] = useState(false);
  const [fundoImportacao, setFundoImportacao] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tituloSelecionadoParaAtividades, setTituloSelecionadoParaAtividades] = useState<TituloNegociado | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Formulário de novo título
  const [formTitulo, setFormTitulo] = useState({
    sacado_cnpj: '',
    numero_titulo: '',
    valor_original: '',
    valor_atualizado: '',
    data_vencimento_original: '',
    data_entrada_sistema: new Date().toISOString().split('T')[0],
    telefone: '',
    critica: '',
    checagem: '',
    vadu: '',
    fundo: '',
  });

  // Formulário de parcelamento
  const [formParcelamento, setFormParcelamento] = useState({
    descricao: '',
    valor_total_negociado: '',
    data_primeira_parcela: '',
    intervalo_parcelas: 'mensal',
    intervalo_dias: '',
    numero_parcelas: '',
    valores_iguais: true,
    valores_parcelas: [] as string[],
    tem_sinal: false,
    valor_sinal: '',
    modo: 'simples' as 'simples' | 'grupos', // 'simples' ou 'grupos'
    grupos: [] as Array<{ quantidade: string; valor: string }>, // Para modo grupos
  });

  useEffect(() => {
    loadData();
  }, [cedenteId]);

  async function loadData() {
    setLoading(true);
    await Promise.all([
      loadTitulos(),
      loadParcelamentos(),
      loadSacados(),
      loadCriticas(),
      loadFundos(),
    ]);
    setLoading(false);
  }

  async function loadTitulos() {
    try {
      const { data, error } = await supabase
        .from('titulos_negociados')
        .select('*')
        .eq('cedente_id', cedenteId)
        .order('data_vencimento_original', { ascending: false });

      if (error) throw error;

      // Carrega informações dos sacados e contagem de atividades separadamente
      const titulosComSacado = await Promise.all(
        (data || []).map(async (titulo: any) => {
          const [sacadoResult, atividadesResult] = await Promise.all([
            supabase
              .from('sacados')
              .select('razao_social, nome_fantasia')
              .eq('cnpj', titulo.sacado_cnpj)
              .single(),
            supabase
              .from('titulos_atividades')
              .select('id', { count: 'exact', head: true })
              .eq('titulo_id', titulo.id)
          ]);

          return {
            ...titulo,
            sacado: sacadoResult.data || null,
            quantidade_atividades: atividadesResult.count || 0,
          };
        })
      );

      setTitulos(titulosComSacado);
    } catch (error) {
      console.error('Erro ao carregar títulos:', error);
      showToast('Erro ao carregar títulos', 'error');
    }
  }

  async function loadParcelamentos() {
    try {
      const { data, error } = await supabase
        .from('parcelamentos')
        .select('*')
        .eq('cedente_id', cedenteId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Carrega títulos e parcelas de cada parcelamento
      const parcelamentosCompleto = await Promise.all(
        (data || []).map(async (parc: Parcelamento) => {
          // Carrega títulos do parcelamento
          const { data: titulosRelData } = await supabase
            .from('parcelamentos_titulos')
            .select('titulo_id')
            .eq('parcelamento_id', parc.id);

          const titulosIds = titulosRelData?.map((t: any) => t.titulo_id) || [];
          const titulosData = titulosIds.length > 0
            ? await supabase
                .from('titulos_negociados')
                .select('*')
                .in('id', titulosIds)
            : { data: [] };

          // Carrega parcelas
          const { data: parcelasData } = await supabase
            .from('parcelas')
            .select('*')
            .eq('parcelamento_id', parc.id)
            .order('numero_parcela', { ascending: true });

          return {
            ...parc,
            titulos: titulosData.data || [],
            parcelas: parcelasData || [],
          };
        })
      );

      setParcelamentos(parcelamentosCompleto);
    } catch (error) {
      console.error('Erro ao carregar parcelamentos:', error);
    }
  }

  async function loadSacados() {
    try {
      const { data, error } = await supabase
        .from('sacados')
        .select('cnpj, razao_social, nome_fantasia')
        .eq('cedente_id', cedenteId)
        .order('razao_social', { ascending: true });

      if (error) throw error;
      setSacados(data || []);
    } catch (error) {
      console.error('Erro ao carregar sacados:', error);
    }
  }

  async function loadCriticas() {
    try {
      const { data, error } = await supabase
        .from('criticas_titulos')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true })
        .order('nome', { ascending: true });

      if (error) throw error;
      setCriticas(data || []);
    } catch (error) {
      console.error('Erro ao carregar críticas:', error);
    }
  }

  async function loadFundos() {
    try {
      const { data, error } = await supabase
        .from('fundos')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (error) throw error;
      setFundos(data || []);
    } catch (error) {
      console.error('Erro ao carregar fundos:', error);
    }
  }

  async function handleAddFundo() {
    if (!novoFundoNome.trim()) {
      showToast('Informe o nome do fundo', 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('fundos')
        .insert({
          nome: novoFundoNome.trim(),
          ativo: true,
        });

      if (error) throw error;

      showToast('Fundo adicionado com sucesso', 'success');
      setNovoFundoNome('');
      setShowAddFundo(false);
      loadFundos();
    } catch (error: any) {
      console.error('Erro ao adicionar fundo:', error);
      if (error.code === '23505') {
        showToast('Este fundo já existe', 'error');
      } else {
        showToast('Erro ao adicionar fundo', 'error');
      }
    }
  }

  async function handleAddCritica() {
    if (!novaCriticaNome.trim()) {
      showToast('Informe o nome da crítica', 'error');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast('Usuário não autenticado', 'error');
        return;
      }

      const { data, error } = await supabase
        .from('criticas_titulos')
        .insert({
          nome: novaCriticaNome.trim(),
          descricao: null,
          ordem: criticas.length + 1,
          ativo: true,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      showToast('Crítica adicionada com sucesso', 'success');
      setNovaCriticaNome('');
      setShowAddCritica(false);
      loadCriticas();
    } catch (error: any) {
      console.error('Erro ao adicionar crítica:', error);
      if (error.code === '23505') {
        showToast('Esta crítica já existe', 'error');
      } else {
        showToast('Erro ao adicionar crítica', 'error');
      }
    }
  }

  async function handleAddTitulo() {
    if (!formTitulo.sacado_cnpj || !formTitulo.numero_titulo || !formTitulo.valor_original || !formTitulo.data_vencimento_original) {
      showToast('Preencha todos os campos obrigatórios', 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('titulos_negociados')
        .insert({
          cedente_id: cedenteId,
          sacado_cnpj: formTitulo.sacado_cnpj,
          numero_titulo: formTitulo.numero_titulo,
          valor_original: parseFloat(formTitulo.valor_original),
          valor_atualizado: parseFloat(formTitulo.valor_atualizado || formTitulo.valor_original),
          data_vencimento_original: formTitulo.data_vencimento_original,
          data_entrada_sistema: formTitulo.data_entrada_sistema,
          telefone: formTitulo.telefone || null,
          critica: formTitulo.critica || null,
          checagem: formTitulo.checagem || null,
          vadu: formTitulo.vadu || null,
          fundo: formTitulo.fundo || null,
          status: 'titulo_original',
        });

      if (error) throw error;

      showToast('Título adicionado com sucesso', 'success');
      setShowAddTitulo(false);
      setFormTitulo({
        sacado_cnpj: '',
        numero_titulo: '',
        valor_original: '',
        valor_atualizado: '',
        data_vencimento_original: '',
        data_entrada_sistema: new Date().toISOString().split('T')[0],
        telefone: '',
        critica: '',
        checagem: '',
        vadu: '',
        fundo: '',
      });
      loadTitulos();
    } catch (error: any) {
      console.error('Erro ao adicionar título:', error);
      if (error.code === '23505') {
        showToast('Este título já existe para este cedente', 'error');
      } else {
        showToast('Erro ao adicionar título', 'error');
      }
    }
  }

  async function handleEditTitulo() {
    if (!tituloEditando) return;
    
    if (!formTitulo.sacado_cnpj || !formTitulo.numero_titulo || !formTitulo.valor_original || !formTitulo.data_vencimento_original) {
      showToast('Preencha todos os campos obrigatórios', 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('titulos_negociados')
        .update({
          sacado_cnpj: formTitulo.sacado_cnpj,
          numero_titulo: formTitulo.numero_titulo,
          valor_original: parseFloat(formTitulo.valor_original),
          valor_atualizado: parseFloat(formTitulo.valor_atualizado || formTitulo.valor_original),
          data_vencimento_original: formTitulo.data_vencimento_original,
          data_entrada_sistema: formTitulo.data_entrada_sistema,
          telefone: formTitulo.telefone || null,
          critica: formTitulo.critica || null,
          checagem: formTitulo.checagem || null,
          vadu: formTitulo.vadu || null,
          fundo: formTitulo.fundo || null,
        })
        .eq('id', tituloEditando.id);

      if (error) throw error;

      showToast('Título atualizado com sucesso', 'success');
      setShowEditTitulo(false);
      setTituloEditando(null);
      setFormTitulo({
        sacado_cnpj: '',
        numero_titulo: '',
        valor_original: '',
        valor_atualizado: '',
        data_vencimento_original: '',
        data_entrada_sistema: new Date().toISOString().split('T')[0],
        telefone: '',
        critica: '',
        checagem: '',
        vadu: '',
        fundo: '',
      });
      loadTitulos();
    } catch (error: any) {
      console.error('Erro ao atualizar título:', error);
      if (error.code === '23505') {
        showToast('Este número de título já existe para este cedente', 'error');
      } else {
        showToast('Erro ao atualizar título', 'error');
      }
    }
  }

  function toggleSelectTitulo(tituloId: string) {
    const newSelected = new Set(selectedTitulos);
    if (newSelected.has(tituloId)) {
      newSelected.delete(tituloId);
    } else {
      newSelected.add(tituloId);
    }
    setSelectedTitulos(newSelected);
  }

  function handleIniciarParcelamento() {
    if (selectedTitulos.size === 0) {
      showToast('Selecione pelo menos um título', 'error');
      return;
    }

    // Calcula valor total dos títulos selecionados
    const titulosSelecionados = titulos.filter(t => selectedTitulos.has(t.id));
    const valorTotal = titulosSelecionados.reduce((sum, t) => sum + t.valor_atualizado, 0);

    setFormParcelamento({
      ...formParcelamento,
      valor_total_negociado: formatMoneyInput(Math.round(valorTotal * 100).toString()),
      data_primeira_parcela: new Date().toISOString().split('T')[0],
      modo: 'simples',
      grupos: [],
    });

    setShowParcelar(true);
  }

  async function handleCriarParcelamento() {
    if (!formParcelamento.valor_total_negociado || !formParcelamento.data_primeira_parcela) {
      showToast('Preencha todos os campos obrigatórios', 'error');
      return;
    }

    // Validação para modo grupos
    if (formParcelamento.modo === 'grupos') {
      if (formParcelamento.grupos.length === 0) {
        showToast('Adicione pelo menos um grupo de parcelas', 'error');
        return;
      }
      
      // Valida se todos os grupos têm quantidade e valor
      const gruposInvalidos = formParcelamento.grupos.some(g => 
        !g.quantidade || parseInt(g.quantidade) <= 0 || !g.valor || parseMoneyInput(g.valor) <= 0
      );
      
      if (gruposInvalidos) {
        showToast('Preencha quantidade e valor em todos os grupos', 'error');
        return;
      }

      // Calcula total dos grupos
      const totalGrupos = formParcelamento.grupos.reduce((sum, grupo) => {
        const quantidade = parseInt(grupo.quantidade) || 0;
        const valor = parseMoneyInput(grupo.valor);
        return sum + (quantidade * valor);
      }, 0);
      
      const valorTotal = parseMoneyInput(formParcelamento.valor_total_negociado);
      const diferenca = valorTotal - totalGrupos;
      
      // Se faltar valor (parcelas somam menos que o total), pergunta se é desconto
      if (diferenca > 0.01) {
        const confirmarDesconto = confirm(
          `As parcelas somam ${formatMoney(totalGrupos)}, mas o valor total negociado é ${formatMoney(valorTotal)}.\n\n` +
          `Faltam ${formatMoney(diferenca)}.\n\n` +
          `Isso é um DESCONTO? Se sim, clique OK para continuar. Se não, clique Cancelar para ajustar os valores.`
        );
        
        if (!confirmarDesconto) {
          return;
        }
      }
    } else {
      // Validação para modo simples
      if (!formParcelamento.numero_parcelas) {
        showToast('Informe o número de parcelas', 'error');
        return;
      }

      // Validação: se tem sinal, o valor do sinal é obrigatório
      if (formParcelamento.tem_sinal && !formParcelamento.valor_sinal) {
        showToast('Informe o valor do sinal', 'error');
        return;
      }

      // Validação: valor do sinal não pode ser maior que o valor total
      if (formParcelamento.tem_sinal) {
        const valorTotal = parseMoneyInput(formParcelamento.valor_total_negociado);
        const valorSinal = parseMoneyInput(formParcelamento.valor_sinal);
        
        if (valorSinal > valorTotal) {
          showToast('O valor do sinal não pode ser maior que o valor total negociado', 'error');
          return;
        }
        
        if (valorSinal <= 0) {
          showToast('O valor do sinal deve ser maior que zero', 'error');
          return;
        }
      }
    }

    try {
      // Cria o parcelamento
      const valorTotalNegociado = parseMoneyInput(formParcelamento.valor_total_negociado);
      
      const { data: parcelamentoData, error: parcError } = await supabase
        .from('parcelamentos')
        .insert({
          cedente_id: cedenteId,
          descricao: formParcelamento.descricao || null,
          valor_total_negociado: valorTotalNegociado,
          taxa_juros: null,
          data_primeira_parcela: formParcelamento.data_primeira_parcela,
          intervalo_parcelas: formParcelamento.intervalo_parcelas,
          intervalo_dias: formParcelamento.intervalo_parcelas === 'personalizado' && formParcelamento.intervalo_dias
            ? parseInt(formParcelamento.intervalo_dias)
            : null,
          status: 'ativo',
        })
        .select()
        .single();

      if (parcError) throw parcError;

      // Vincula os títulos ao parcelamento
      const titulosIds = Array.from(selectedTitulos);
      const { error: titulosError } = await supabase
        .from('parcelamentos_titulos')
        .insert(
          titulosIds.map(tituloId => ({
            parcelamento_id: parcelamentoData.id,
            titulo_id: tituloId,
          }))
        );

      if (titulosError) throw titulosError;

      // Calcula e cria as parcelas
      let valoresParcelas: number[] = [];
      let numeroParcelas = 0;

      if (formParcelamento.modo === 'grupos') {
        // Modo Grupos: gera parcelas baseado nos grupos
        formParcelamento.grupos.forEach(grupo => {
          const quantidade = parseInt(grupo.quantidade) || 0;
          const valor = parseMoneyInput(grupo.valor);
          for (let i = 0; i < quantidade; i++) {
            valoresParcelas.push(valor);
          }
        });
        numeroParcelas = valoresParcelas.length;
        
        // Verifica se há diferença (excedente - juros)
        const totalGrupos = valoresParcelas.reduce((sum, v) => sum + v, 0);
        const diferenca = valorTotalNegociado - totalGrupos;
        
        // Se SOBRAR (parcelas somam mais que o total) - adiciona parcela de ajuste (juros)
        // Se FALTAR (parcelas somam menos) - não cria parcela (é desconto, já validado)
        if (diferenca < -0.01) {
          // Sobra valor = juros, adiciona parcela de ajuste positiva
          valoresParcelas.push(Math.abs(diferenca));
          numeroParcelas++;
        }
        // Se faltar (diferenca > 0.01), não cria parcela de ajuste - é desconto
      } else {
        // Modo Simples (lógica original)
        numeroParcelas = parseInt(formParcelamento.numero_parcelas);
        const valoresIguais = formParcelamento.valores_iguais;
        const temSinal = formParcelamento.tem_sinal;
        const valorSinal = temSinal ? parseMoneyInput(formParcelamento.valor_sinal) : 0;
        const valorRestante = valorTotalNegociado - valorSinal;
        const numeroParcelasRestantes = numeroParcelas - (temSinal ? 1 : 0);
        
        if (temSinal) {
          // Primeira parcela é o sinal
          valoresParcelas.push(valorSinal);
          
          // Calcula as parcelas restantes
          if (valoresIguais && numeroParcelasRestantes > 0) {
            const valorParcela = valorRestante / numeroParcelasRestantes;
            for (let i = 0; i < numeroParcelasRestantes; i++) {
              valoresParcelas.push(valorParcela);
            }
          } else {
            // Usa os valores informados manualmente (pula a primeira que já é o sinal)
            const valoresManuais = formParcelamento.valores_parcelas.slice(1).map(v => parseMoneyInput(v || '0'));
            valoresParcelas.push(...valoresManuais);
          }
        } else {
          // Sem sinal, cálculo normal
          if (valoresIguais) {
            const valorParcela = valorTotalNegociado / numeroParcelas;
            valoresParcelas = Array(numeroParcelas).fill(valorParcela);
          } else {
            valoresParcelas = formParcelamento.valores_parcelas.map(v => parseMoneyInput(v || '0'));
          }
        }
      }

      // Calcula datas das parcelas
      const dataPrimeira = new Date(formParcelamento.data_primeira_parcela);
      const parcelas = [];
      for (let i = 0; i < numeroParcelas; i++) {
        const dataVencimento = new Date(dataPrimeira);
        
        if (formParcelamento.intervalo_parcelas === 'mensal') {
          dataVencimento.setMonth(dataVencimento.getMonth() + i);
        } else if (formParcelamento.intervalo_parcelas === 'quinzenal') {
          dataVencimento.setDate(dataVencimento.getDate() + (i * 15));
        } else if (formParcelamento.intervalo_parcelas === 'personalizado' && formParcelamento.intervalo_dias) {
          dataVencimento.setDate(dataVencimento.getDate() + (i * parseInt(formParcelamento.intervalo_dias)));
        }

        parcelas.push({
          parcelamento_id: parcelamentoData.id,
          numero_parcela: i + 1,
          valor: valoresParcelas[i],
          data_vencimento: dataVencimento.toISOString().split('T')[0],
          status: 'a_vencer',
        });
      }

      const { error: parcelasError } = await supabase
        .from('parcelas')
        .insert(parcelas);

      if (parcelasError) throw parcelasError;

      // Atualiza o status dos títulos para "titulo_de_acordo"
      const { error: updateTitulosError } = await supabase
        .from('titulos_negociados')
        .update({ status: 'titulo_de_acordo' })
        .in('id', titulosIds);

      if (updateTitulosError) {
        console.error('Erro ao atualizar status dos títulos:', updateTitulosError);
        // Não bloqueia o processo, apenas loga o erro
      }

      showToast('Parcelamento criado com sucesso', 'success');
      setShowParcelar(false);
      setSelectedTitulos(new Set());
      setFormParcelamento({
        descricao: '',
        valor_total_negociado: '',
        data_primeira_parcela: '',
        intervalo_parcelas: 'mensal',
        intervalo_dias: '',
        numero_parcelas: '',
        valores_iguais: true,
        valores_parcelas: [],
        tem_sinal: false,
        valor_sinal: '',
        modo: 'simples',
        grupos: [],
      });
      loadData();
    } catch (error: any) {
      console.error('Erro ao criar parcelamento:', error);
      showToast('Erro ao criar parcelamento', 'error');
    }
  }

  const titulosFiltrados = titulos.filter(t => {
    // Filtro de status
    if (filterStatus !== 'todos' && t.status !== filterStatus) return false;
    
    // Busca
    const query = searchQuery.toLowerCase();
    if (query) {
      return (
        t.numero_titulo.toLowerCase().includes(query) ||
        (t.sacado?.razao_social || '').toLowerCase().includes(query) ||
        t.sacado_cnpj.replace(/\D+/g, '').includes(query.replace(/\D+/g, ''))
      );
    }
    
    return true;
  });

  const titulosSelecionados = titulos.filter(t => selectedTitulos.has(t.id));
  const valorTotalSelecionado = titulosSelecionados.reduce((sum, t) => sum + t.valor_atualizado, 0);

  // Função para consultar APIs do sacado (similar ao cadastro de sacados)
  async function consultarAPIsSacado(cnpj: string, salvarNoBanco: boolean = false) {
    if (!cnpj || cnpj.replace(/\D+/g, '').length !== 14) return null;
    
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

  // Converte número serial do Excel para data
  function excelSerialToDate(serial: any): string {
    // Se é um número (serial do Excel) - números grandes geralmente são datas
    if (typeof serial === 'number') {
      // Excel conta a partir de 01/01/1900
      // 1 = 01/01/1900, mas Excel tem bug: considera 1900 como bissexto
      // Então 1 = 31/12/1899, mas precisamos ajustar
      if (serial > 0 && serial < 1000000) { // Números muito grandes provavelmente não são datas
        // Excel epoch: 30 de dezembro de 1899
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + (serial - 1) * 24 * 60 * 60 * 1000);
        
        // Ajuste para o bug do Excel (1900 foi considerado bissexto)
        if (serial >= 60) {
          date.setTime(date.getTime() - 24 * 60 * 60 * 1000);
        }
        
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
      return '';
    }
    
    // Se é uma string
    if (typeof serial === 'string' && serial.trim() !== '') {
      const trimmed = serial.trim();
      
      // Se é um número como string (pode ser serial do Excel)
      const numValue = parseFloat(trimmed);
      if (!isNaN(numValue) && numValue > 0 && numValue < 1000000) {
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + (numValue - 1) * 24 * 60 * 60 * 1000);
        
        if (numValue >= 60) {
          date.setTime(date.getTime() - 24 * 60 * 60 * 1000);
        }
        
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
      
      // Tenta formatos DD/MM/YYYY
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
        const [day, month, year] = trimmed.split('/');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
      
      // Tenta formato YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
      }
      
      // Tenta parsear como data ISO
      const parsedDate = new Date(trimmed);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString().split('T')[0];
      }
      
      return trimmed; // Retorna como está se não conseguir parsear
    }
    
    return '';
  }

  // Formata data para exibição DD/MM/YYYY
  function formatarDataExibicao(dataStr: string): string {
    if (!dataStr || dataStr.trim() === '') return '—';
    
    try {
      // Se já está no formato DD/MM/YYYY, retorna
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataStr.trim())) {
        return dataStr.trim();
      }
      
      // Tenta parsear como ISO ou outro formato
      const date = new Date(dataStr);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
      
      return dataStr;
    } catch (e) {
      return dataStr;
    }
  }

  // Gera e baixa modelo Excel
  function downloadModeloExcel() {
    // Usando CNPJs válidos de exemplo (gerados corretamente)
    const dados = [
      {
        'CNPJ': '11.222.333/0001-81',
        'Razão Social': 'Empresa ABC LTDA',
        'Nome Fantasia': 'ABC',
        'Número do Título': '001',
        'Valor Original': 1000.00,
        'Valor Atualizado': 1200.00,
        'Data Vencimento': '15/01/2024',
        'Telefone': '(11) 99999-9999',
        'Crítica': 'Protestado',
        'Checagem': 'Confirmado',
        'VADU': 'Autorizado'
      },
      {
        'CNPJ': '11.222.333/0001-81',
        'Razão Social': 'Empresa ABC LTDA',
        'Nome Fantasia': 'ABC',
        'Número do Título': '002',
        'Valor Original': 2000.00,
        'Valor Atualizado': 2400.00,
        'Data Vencimento': '20/02/2024',
        'Telefone': '(11) 99999-9999',
        'Crítica': 'Enviado a Cartório',
        'Checagem': 'Pendente',
        'VADU': ''
      },
      {
        'CNPJ': '44.555.666/0001-77',
        'Razão Social': 'Empresa XYZ EIRELI',
        'Nome Fantasia': 'XYZ',
        'Número do Título': '003',
        'Valor Original': 1500.00,
        'Valor Atualizado': 1500.00,
        'Data Vencimento': '10/03/2024',
        'Telefone': '(21) 88888-8888',
        'Crítica': '',
        'Checagem': '',
        'VADU': ''
      }
    ];

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Títulos');
    
    // Ajusta largura das colunas
    const colWidths = [
      { wch: 20 }, // CNPJ
      { wch: 25 }, // Razão Social
      { wch: 15 }, // Nome Fantasia
      { wch: 18 }, // Número do Título
      { wch: 15 }, // Valor Original
      { wch: 15 }, // Valor Atualizado
      { wch: 18 }, // Data Vencimento
      { wch: 18 }, // Telefone
      { wch: 20 }, // Crítica
      { wch: 15 }, // Checagem
      { wch: 12 }  // VADU
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, 'modelo_importacao_titulos.xlsx');
    showToast('Modelo Excel baixado com sucesso!', 'success');
  }

  // Processa arquivo Excel/CSV
  async function handleFileImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await new Promise<any[]>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary', cellDates: false });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            // Lê com raw: true para manter números serial do Excel para conversão manual
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { raw: true, defval: null });
            resolve(jsonData);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsBinaryString(file);
      });

      // Função auxiliar para buscar valor em coluna (case-insensitive, remove espaços e acentos)
      const normalizarString = (str: string): string => {
        return str
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove acentos
          .replace(/\s+/g, '') // Remove espaços
          .replace(/[._-]/g, ''); // Remove pontos, underscores e hífens
      };

      const buscarColuna = (row: any, possiveisNomes: string[]): string => {
        // Primeiro tenta busca exata
        for (const nome of possiveisNomes) {
          if (row[nome] !== undefined && row[nome] !== null && row[nome] !== '') {
            return String(row[nome]);
          }
        }
        
        // Depois tenta busca case-insensitive, sem espaços e sem acentos
        const rowKeys = Object.keys(row);
        const possiveisNomesNormalizados = possiveisNomes.map(n => normalizarString(n.trim()));
        
        for (let i = 0; i < possiveisNomesNormalizados.length; i++) {
          const nomeNormalizado = possiveisNomesNormalizados[i];
          for (const key of rowKeys) {
            // Remove espaços e caracteres invisíveis das chaves também
            const keyTrimmed = key.trim();
            const keyNormalizado = normalizarString(keyTrimmed);
            if (keyNormalizado === nomeNormalizado && row[key] !== undefined && row[key] !== null && row[key] !== '') {
              return String(row[key]);
            }
          }
        }
        
        return '';
      };

      // Debug: mostra as chaves disponíveis na primeira linha
      if (data.length > 0) {
        console.log('=== DEBUG IMPORTACAO ===');
        console.log('Colunas disponíveis na planilha:', Object.keys(data[0]));
        console.log('Primeira linha de dados:', data[0]);
        console.log('Valor CNPJ direto:', data[0]['CNPJ']);
        console.log('Tipo do valor CNPJ:', typeof data[0]['CNPJ']);
        console.log('Valor CNPJ após String():', String(data[0]['CNPJ']));
      }

      // Normaliza os dados - detecta colunas automaticamente
      const dadosNormalizados = data.map((row: any, index: number) => {
        // Tenta detectar CNPJ usando a função buscarColuna
        const cnpjKeys = ['cnpj', 'CNPJ', 'cnpj_sacado', 'CNPJ_Sacado', 'cpf_cnpj', 'documento', 'Documento', 'DOCUMENTO'];
        const cnpjValue = buscarColuna(row, cnpjKeys);
        let cnpj = '';
        let tem_cnpj = false;
        if (cnpjValue) {
          const cnpjLimpo = cnpjValue.replace(/\D+/g, '');
          if (cnpjLimpo.length === 14 && validarCNPJ(cnpjLimpo)) {
            cnpj = cnpjLimpo;
            tem_cnpj = true;
          } else {
            // Debug: log quando CNPJ encontrado mas inválido
            if (index < 3) {
              console.log(`Linha ${index + 2}: CNPJ encontrado mas inválido - Valor: "${cnpjValue}", Limpo: "${cnpjLimpo}", Tamanho: ${cnpjLimpo.length}, Válido: ${cnpjLimpo.length === 14 ? validarCNPJ(cnpjLimpo) : false}`);
            }
          }
        } else {
          // Debug: log quando CNPJ não encontrado
          if (index < 3) {
            console.log(`Linha ${index + 2}: CNPJ não encontrado. Chaves na linha:`, Object.keys(row));
            console.log(`Linha ${index + 2}: Tentativas:`, cnpjKeys);
          }
        }

        // Tenta detectar outros campos com mais variações
        const numeroTituloKeys = [
          'numero_titulo', 'Número do Título', 'Duplicata', 'Nº Título', 'numero', 'Numero',
          'numero_título', 'Número Título', 'Nº Título', 'N° Título', 'N° Título',
          'titulo', 'Título', 'TITULO', 'TÍTULO', 'numero_duplicata', 'Número Duplicata',
          'duplicata_numero', 'Duplicata Número', 'doc', 'Documento', 'DOCUMENTO'
        ];
        const numeroTitulo = buscarColuna(row, numeroTituloKeys);

        const valorOriginalKeys = [
          'valor_original', 'Valor Original', 'valor', 'Valor', 'VALOR',
          'valor_principal', 'Valor Principal', 'valor_titulo', 'Valor Título',
          'valor_duplicata', 'Valor Duplicata', 'vlr', 'VLR', 'vlr_original'
        ];
        const valorOriginalStr = buscarColuna(row, valorOriginalKeys);
        const valorOriginal = valorOriginalStr ? parseFloat(valorOriginalStr.replace(',', '.')) : 0;

        const valorAtualizadoKeys = [
          'valor_atualizado', 'Valor Atualizado', 'valor_total', 'Valor Total',
          'valor_com_juros', 'Valor com Juros', 'vlr_atualizado', 'VLR Atualizado'
        ];
        const valorAtualizadoStr = buscarColuna(row, valorAtualizadoKeys);
        const valorAtualizado = valorAtualizadoStr ? parseFloat(valorAtualizadoStr.replace(',', '.')) : valorOriginal;

        const dataVencimentoKeys = [
          'data_vencimento', 'Data Vencimento', 'vencimento', 'Vencimento', 'VENCIMENTO',
          'data_venc', 'Data Venc', 'dt_vencimento', 'DT Vencimento', 'venc', 'Venc',
          'data_vencimento_original', 'Data Vencimento Original'
        ];
        const dataVencimentoRaw = buscarColuna(row, dataVencimentoKeys);
        // Converte número serial do Excel para data ou mantém string
        const dataVencimento = dataVencimentoRaw ? excelSerialToDate(dataVencimentoRaw) : '';

        const telefoneKeys = ['telefone', 'Telefone', 'TELEFONE', 'tel', 'Tel', 'fone', 'Fone'];
        const telefone = buscarColuna(row, telefoneKeys);

        const criticaKeys = ['critica', 'Crítica', 'CRÍTICA', 'status', 'Status', 'STATUS', 'situacao', 'Situação'];
        const critica = buscarColuna(row, criticaKeys);

        const checagemKeys = ['checagem', 'Checagem', 'CHECAGEM', 'observacoes', 'Observações', 'obs', 'Obs', 'observacao', 'Observação'];
        const checagem = buscarColuna(row, checagemKeys);

        const vaduKeys = ['vadu', 'VADU', 'Vadu', 'autorizacao', 'Autorização', 'AUTORIZACAO'];
        const vadu = buscarColuna(row, vaduKeys);

        const razaoSocialKeys = [
          'razao_social', 'Razão Social', 'RAZÃO SOCIAL', 'razao', 'Razão', 'RAZÃO',
          'sacado', 'Sacado', 'SACADO', 'nome_empresa', 'Nome Empresa', 'empresa', 'Empresa'
        ];
        const razaoSocial = buscarColuna(row, razaoSocialKeys);

        const nomeFantasiaKeys = ['nome_fantasia', 'Nome Fantasia', 'NOME FANTASIA', 'fantasia', 'Fantasia', 'FANTASIA'];
        const nomeFantasia = buscarColuna(row, nomeFantasiaKeys);

        // Debug nas primeiras linhas
        if (index < 3) {
          console.log(`=== Linha ${index + 2} ===`);
          console.log('Chaves na linha:', Object.keys(row));
          console.log('CNPJ Value encontrado:', cnpjValue);
          console.log('CNPJ após limpar:', cnpj || '(vazio ou inválido)');
          console.log('tem_cnpj:', tem_cnpj);
          console.log('Dados processados:', {
            cnpj,
            numeroTitulo,
            valorOriginal,
            dataVencimento,
            tem_cnpj
          });
        }

        return {
          linha: index + 2, // +2 porque começa na linha 2 (linha 1 é cabeçalho)
          cnpj: cnpj,
          razao_social: razaoSocial,
          nome_fantasia: nomeFantasia,
          numero_titulo: String(numeroTitulo).trim(),
          valor_original: valorOriginal,
          valor_atualizado: valorAtualizado || valorOriginal,
          data_vencimento_original: dataVencimento || '',
          telefone: String(telefone).trim(),
          critica: String(critica).trim(),
          checagem: String(checagem).trim(),
          vadu: String(vadu).trim(),
          tem_cnpj: tem_cnpj,
          sacado_existe: false, // será verificado depois
          titulo_existe: false, // será verificado depois
        };
      });

      // Verifica quais sacados já existem
      const cnpjsUnicos = [...new Set(dadosNormalizados.filter(d => d.tem_cnpj).map(d => d.cnpj))];
      if (cnpjsUnicos.length > 0) {
        const { data: sacadosExistentes } = await supabase
          .from('sacados')
          .select('cnpj')
          .in('cnpj', cnpjsUnicos);

        const cnpjsExistentes = new Set(sacadosExistentes?.map(s => s.cnpj) || []);
        dadosNormalizados.forEach(d => {
          if (d.tem_cnpj) {
            d.sacado_existe = cnpjsExistentes.has(d.cnpj);
          }
        });
      }

      // Remove duplicatas na planilha (mesmo numero_titulo)
      // Mantém apenas o primeiro de cada duplicata
      const titulosVistos = new Set<string>();
      const dadosSemDuplicatas: any[] = [];
      let duplicatasCount = 0;

      dadosNormalizados.forEach(d => {
        if (!d.tem_cnpj || !d.numero_titulo) {
          dadosSemDuplicatas.push(d);
          return;
        }

        const chaveTitulo = `${d.numero_titulo.trim().toLowerCase()}`;
        if (titulosVistos.has(chaveTitulo)) {
          // É duplicata na planilha - NÃO adiciona ao array
          duplicatasCount++;
        } else {
          titulosVistos.add(chaveTitulo);
          dadosSemDuplicatas.push(d);
        }
      });

      // Verifica quais títulos já existem no banco
      // Busca todos os títulos do cedente para verificar duplicatas
      const { data: todosTitulosExistentes, error: titulosError } = await supabase
        .from('titulos_negociados')
        .select('numero_titulo, sacado_cnpj')
        .eq('cedente_id', cedenteId);
      
      if (titulosError) {
        console.error('Erro ao buscar títulos existentes:', titulosError);
      }
      
      console.log(`Títulos ativos encontrados no banco para este cedente: ${(todosTitulosExistentes || []).length}`);

      // Cria um Set com combinações normalizadas de numero_titulo + sacado_cnpj
      // Normaliza removendo espaços e convertendo para lowercase para comparação mais robusta
      const titulosExistentesSet = new Set(
        (todosTitulosExistentes || []).map(t => {
          const numNormalizado = (t.numero_titulo || '').trim().toLowerCase().replace(/\s+/g, ' ');
          const cnpjNormalizado = (t.sacado_cnpj || '').replace(/\D+/g, '');
          return `${cnpjNormalizado}|${numNormalizado}`;
        })
      );

      // Marca títulos como existentes comparando com normalização
      dadosSemDuplicatas.forEach(d => {
        if (d.tem_cnpj && d.numero_titulo) {
          const numNormalizado = d.numero_titulo.trim().toLowerCase().replace(/\s+/g, ' ');
          const cnpjNormalizado = d.cnpj.replace(/\D+/g, '');
          const chaveBusca = `${cnpjNormalizado}|${numNormalizado}`;
          d.titulo_existe = titulosExistentesSet.has(chaveBusca);
          
          // Debug para primeiras linhas
          if (d.linha <= 7) {
            console.log(`Linha ${d.linha}: Verificando título - Num: "${d.numero_titulo}" (normalizado: "${numNormalizado}"), CNPJ: ${cnpjNormalizado}, Existe: ${d.titulo_existe}`);
          }
        } else {
          d.titulo_existe = false;
        }
      });

      setDadosImportados(dadosSemDuplicatas);
      setShowImportar(true);
      
      const mensagem = duplicatasCount > 0
        ? `Arquivo importado: ${dadosSemDuplicatas.length} linha(s) válida(s), ${duplicatasCount} duplicata(s) removida(s)`
        : `Arquivo importado: ${dadosSemDuplicatas.length} linha(s) processada(s)`;
      showToast(mensagem, 'success');
    } catch (error) {
      console.error('Erro ao importar arquivo:', error);
      showToast('Erro ao importar arquivo. Verifique o formato.', 'error');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  // Salva os dados importados
  async function handleSalvarImportacao() {
    if (dadosImportados.length === 0) return;

    setImportando(true);
    let sucessos = 0;
    let erros = 0;
    const sacadosCriados = new Set<string>();
    const sacadosComAPIConsultada = new Set<string>(); // Controla quais CNPJs já tiveram API consultada

    try {
      // PRIMEIRO PASSO: Identifica CNPJs únicos que precisam ser criados
      const cnpjsParaCriar = new Set<string>();
      dadosImportados.forEach(item => {
        if (item.tem_cnpj && !item.sacado_existe) {
          cnpjsParaCriar.add(item.cnpj);
        }
      });

      // SEGUNDO PASSO: Cria sacados únicos e consulta APIs uma vez por CNPJ
      for (const cnpjUnico of cnpjsParaCriar) {
        // Encontra o primeiro item com este CNPJ para pegar dados (razao_social, etc)
        const primeiroItemComEsteCNPJ = dadosImportados.find(item => item.tem_cnpj && item.cnpj === cnpjUnico);
        
        if (!primeiroItemComEsteCNPJ) continue;

        try {
          // Verifica se o sacado já existe (double-check)
          const { data: sacadoExistente } = await supabase
            .from('sacados')
            .select('cnpj')
            .eq('cnpj', cnpjUnico)
            .single();

          if (sacadoExistente) {
            // Sacado já existe - marca como criado para não tentar criar novamente
            sacadosCriados.add(cnpjUnico);
            continue;
          }

          // Cria o sacado
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.error('Usuário não autenticado');
            erros++;
            continue;
          }

          const { data: sacadoCriado, error: sacadoError } = await supabase
            .from('sacados')
            .insert({
              cedente_id: cedenteId,
              cnpj: cnpjUnico,
              razao_social: primeiroItemComEsteCNPJ.razao_social || 'Sacado Importado',
              nome_fantasia: primeiroItemComEsteCNPJ.nome_fantasia || null,
              ultima_atualizacao: new Date().toISOString(),
              user_id: user.id,
            })
            .select();

          if (sacadoError) {
            // Se o erro for de duplicata (23505), o sacado já existe - marca como criado
            if (sacadoError.code === '23505' || sacadoError.message?.includes('duplicate') || sacadoError.message?.includes('unique')) {
              console.log(`Sacado ${cnpjUnico} já existe, continuando...`);
              sacadosCriados.add(cnpjUnico);
              
              // Se marcou para consultar APIs e ainda não consultou, consulta agora
              if (consultarAPIsImportacao && !sacadosComAPIConsultada.has(cnpjUnico)) {
                await consultarAPIsSacado(cnpjUnico, true);
                sacadosComAPIConsultada.add(cnpjUnico);
              }
              continue;
            }
            
            console.error(`Erro ao criar sacado ${cnpjUnico}:`, {
              error: sacadoError,
              message: sacadoError.message,
              code: sacadoError.code,
              details: sacadoError.details,
              hint: sacadoError.hint,
              fullError: JSON.stringify(sacadoError, null, 2)
            });
            
            // Não incrementa erro se o sacado já existe (será tratado como sucesso)
            // Mas continua tentando criar os títulos mesmo se o sacado falhou
            // (pode ser que o sacado já exista mas não foi detectado)
            erros++;
            continue;
          }

          if (sacadoCriado && sacadoCriado.length > 0) {
            sacadosCriados.add(cnpjUnico);

            // Se marcou para consultar APIs, consulta UMA VEZ por CNPJ único
            if (consultarAPIsImportacao && !sacadosComAPIConsultada.has(cnpjUnico)) {
              await consultarAPIsSacado(cnpjUnico, true);
              sacadosComAPIConsultada.add(cnpjUnico);
            }
          }
        } catch (err: any) {
          console.error(`Erro ao processar sacado ${cnpjUnico}:`, {
            error: err,
            message: err?.message,
            stack: err?.stack
          });
          erros++;
        }
      }

      // TERCEIRO PASSO: Cria todos os títulos
      // Primeiro, garante que todos os sacados necessários existem
      const cnpjsNecessarios = new Set(
        dadosImportados
          .filter(d => d.tem_cnpj && !d.titulo_existe)
          .map(d => d.cnpj)
      );

      // Verifica quais sacados realmente existem no banco
      const cnpjsExistentesNoBanco = new Set<string>();
      if (cnpjsNecessarios.size > 0) {
        const { data: sacadosVerificados } = await supabase
          .from('sacados')
          .select('cnpj')
          .in('cnpj', Array.from(cnpjsNecessarios));

        sacadosVerificados?.forEach(s => cnpjsExistentesNoBanco.add(s.cnpj));
      }

      // Adiciona os sacados criados nesta importação
      sacadosCriados.forEach(cnpj => cnpjsExistentesNoBanco.add(cnpj));

      for (const item of dadosImportados) {
        try {
          // Cria o título (apenas se tiver CNPJ válido)
          if (!item.tem_cnpj) {
            // Título sem CNPJ - não pode criar porque sacado_cnpj é obrigatório
            erros++;
            continue;
          }

          if (!item.numero_titulo || !item.valor_original || !item.data_vencimento_original) {
            erros++;
            continue;
          }

          // Verifica se título já existe no banco (duplicata)
          if (item.titulo_existe) {
            // Título já existe - ignora (não conta como erro)
            continue;
          }

          // VERIFICA CRÍTICA: O sacado DEVE existir antes de criar o título
          if (!cnpjsExistentesNoBanco.has(item.cnpj)) {
            console.error(`ERRO CRÍTICO: Sacado ${item.cnpj} não existe no banco! Não é possível criar título ${item.numero_titulo} (linha ${item.linha})`);
            console.error(`CNPJs existentes no banco:`, Array.from(cnpjsExistentesNoBanco));
            console.error(`Sacados criados nesta importação:`, Array.from(sacadosCriados));
            erros++;
            continue;
          }

          // Validação adicional dos dados antes de inserir
          if (!item.numero_titulo || item.numero_titulo.trim() === '') {
            console.warn(`Título sem número na linha ${item.linha}, pulando...`);
            erros++;
            continue;
          }

          if (!item.valor_original || item.valor_original <= 0) {
            console.warn(`Título sem valor válido na linha ${item.linha}, pulando...`);
            erros++;
            continue;
          }

          if (!item.data_vencimento_original || item.data_vencimento_original.trim() === '') {
            console.warn(`Título sem data de vencimento na linha ${item.linha}, pulando...`);
            erros++;
            continue;
          }

          const { data: tituloCriado, error: tituloError } = await supabase
            .from('titulos_negociados')
            .insert({
              cedente_id: cedenteId,
              sacado_cnpj: item.cnpj,
              numero_titulo: item.numero_titulo.trim(),
              valor_original: item.valor_original,
              valor_atualizado: item.valor_atualizado || item.valor_original,
              data_vencimento_original: item.data_vencimento_original.trim(),
              data_entrada_sistema: new Date().toISOString().split('T')[0],
              telefone: item.telefone && item.telefone.trim() !== '' ? item.telefone.trim() : null,
              critica: item.critica && item.critica.trim() !== '' ? item.critica.trim() : null,
              checagem: item.checagem && item.checagem.trim() !== '' ? item.checagem.trim() : null,
              vadu: item.vadu && item.vadu.trim() !== '' ? item.vadu.trim() : null,
              fundo: fundoImportacao || null,
              status: 'titulo_original',
            })
            .select();

          if (tituloError) {
            if (tituloError.code === '23505') {
              // Título duplicado - ignora (não conta como erro)
              continue;
            }
            
            // Erro de foreign key (sacado não existe)
            if (tituloError.code === '23503' || tituloError.message?.includes('foreign key') || tituloError.message?.includes('sacado')) {
              console.error(`Erro: Sacado ${item.cnpj} não existe no banco (linha ${item.linha})`);
              erros++;
              continue;
            }
            
            console.error(`Erro ao criar título linha ${item.linha}:`, {
              error: tituloError,
              message: tituloError.message,
              code: tituloError.code,
              details: tituloError.details,
              hint: tituloError.hint,
              fullError: JSON.stringify(tituloError, null, 2),
              dadosTentados: {
                cedente_id: cedenteId,
                sacado_cnpj: item.cnpj,
                numero_titulo: item.numero_titulo,
                valor_original: item.valor_original,
                data_vencimento_original: item.data_vencimento_original
              }
            });
            erros++;
          } else if (tituloCriado && tituloCriado.length > 0) {
            sucessos++;
          } else {
            // Inserção não retornou dados mas também não deu erro
            console.warn(`Título linha ${item.linha} pode não ter sido criado (sem retorno)`);
            erros++;
          }
        } catch (err) {
          console.error(`Erro na linha ${item.linha}:`, err);
          erros++;
        }
      }

      showToast(
        `Importação concluída: ${sucessos} título(s) importado(s)${erros > 0 ? `, ${erros} erro(s)` : ''}`,
        sucessos > 0 ? 'success' : 'error'
      );

      setShowImportar(false);
      setDadosImportados([]);
      setConsultarAPIsImportacao(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar importação:', error);
      showToast('Erro ao salvar importação', 'error');
    } finally {
      setImportando(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0369a1]"></div>
        <p className="mt-2 text-[#64748b]">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com ações */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-gray-300">
        <div>
          <h2 className="text-base font-semibold text-gray-700">Títulos Negociados</h2>
          <p className="text-xs text-gray-600">Gerencie os títulos vencidos e parcelamentos deste cedente</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar título ou sacado"
            className="px-3 py-2 border border-gray-300 text-sm"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 text-sm"
          >
            <option value="todos">Todos os status</option>
            <option value="titulo_original">Título Original</option>
            <option value="titulo_de_acordo">Título de Acordo</option>
            <option value="pago">Pago</option>
          </select>
          {selectedTitulos.size > 0 && (
            <Button
              variant="primary"
              onClick={handleIniciarParcelamento}
              className="text-sm"
            >
              Parcelar ({selectedTitulos.size})
            </Button>
          )}
          <div className="relative">
            <button
              className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-[#0369a1] text-sm font-medium"
              onClick={() => setShowHelp(!showHelp)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ajuda
            </button>
            {showHelp && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50 max-h-[600px] overflow-y-auto">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">ℹ️</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#0369a1] mb-2">Modelo de Importação de Títulos</h3>
                    
                    <div className="text-sm text-[#64748b] space-y-3">
                      <div className="bg-blue-50 p-2 rounded text-xs mb-3">
                        <p className="font-semibold text-blue-800 mb-1">📥 Baixar Modelo Excel</p>
                        <button
                          onClick={downloadModeloExcel}
                          className="mt-1 w-full px-4 py-2.5 bg-[#0369a1] !text-white text-sm font-bold rounded hover:bg-[#0284c7] transition-colors shadow-sm"
                          style={{ color: '#ffffff' }}
                        >
                          ⬇️ Baixar modelo_importacao_titulos.xlsx
                        </button>
                      </div>

                      <div>
                        <p className="font-semibold text-gray-700 mb-1">Nomes das Colunas Obrigatórias:</p>
                        <p className="text-xs text-gray-600 mb-2">A primeira linha do Excel deve conter os nomes das colunas. O sistema aceita qualquer um destes nomes:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
                          <li><strong>CNPJ do Sacado:</strong> "cnpj", "CNPJ", "cnpj_sacado", "CNPJ_Sacado", "cpf_cnpj", "documento"</li>
                          <li><strong>Número do Título:</strong> "numero_titulo", "Número do Título", "Duplicata", "Nº Título", "numero"</li>
                          <li><strong>Valor Original:</strong> "valor_original", "Valor Original", "valor", "Valor"</li>
                          <li><strong>Data de Vencimento:</strong> "data_vencimento", "Data Vencimento", "vencimento", "Vencimento"</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-gray-700 mb-1">Nomes das Colunas Opcionais:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
                          <li><strong>Valor Atualizado:</strong> "valor_atualizado", "Valor Atualizado", "valor_total"</li>
                          <li><strong>Razão Social:</strong> "razao_social", "Razão Social", "sacado", "Sacado"</li>
                          <li><strong>Nome Fantasia:</strong> "nome_fantasia", "Nome Fantasia"</li>
                          <li><strong>Telefone:</strong> "telefone", "Telefone"</li>
                          <li><strong>Crítica:</strong> "critica", "Crítica", "status"</li>
                          <li><strong>Checagem:</strong> "checagem", "Checagem", "observacoes"</li>
                          <li><strong>VADU:</strong> "vadu", "VADU"</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-gray-700 mb-1">Formatos Aceitos:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
                          <li><strong>CNPJ:</strong> Com ou sem formatação (12.345.678/0001-90 ou 12345678000190)</li>
                          <li><strong>Data:</strong> YYYY-MM-DD ou DD/MM/YYYY</li>
                          <li><strong>Valor:</strong> Ponto ou vírgula como separador decimal (1000.50 ou 1000,50)</li>
                        </ul>
                      </div>

                      <div className="bg-yellow-50 p-2 rounded text-xs">
                        <p className="font-semibold text-yellow-800 mb-1">⚠️ Importante:</p>
                        <p className="text-yellow-700">• A primeira linha deve conter os nomes das colunas (cabeçalhos)</p>
                        <p className="text-yellow-700">• Títulos sem CNPJ válido não serão importados</p>
                        <p className="text-yellow-700">• O sistema detecta automaticamente os nomes das colunas (case-insensitive)</p>
                      </div>

                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          <strong>Dica:</strong> Use o modelo Excel acima como referência. Você pode usar qualquer variação dos nomes de colunas listados - o sistema detecta automaticamente.
                        </p>
                      </div>
                    </div>
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
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileImport}
            className="hidden"
            id="file-import"
          />
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            className="text-sm"
          >
            📥 Importar Excel/CSV
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowAddTitulo(true)}
            className="text-sm"
          >
            + Adicionar Título
          </Button>
        </div>
      </div>

      {/* Resumo de seleção */}
      {selectedTitulos.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded">
          <p className="text-sm text-blue-800">
            <strong>{selectedTitulos.size}</strong> título(s) selecionado(s) - 
            Total: <strong>R$ {valorTotalSelecionado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
          </p>
        </div>
      )}

      {/* Tabela de títulos */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 border-b-2 border-gray-300">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300 w-12">
                <input
                  type="checkbox"
                  checked={titulosFiltrados.length > 0 && titulosFiltrados.every(t => selectedTitulos.has(t.id))}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTitulos(new Set(titulosFiltrados.map(t => t.id)));
                    } else {
                      setSelectedTitulos(new Set());
                    }
                  }}
                />
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Nº Título</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Sacado</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Valor Original</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Valor Atualizado</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Vencimento</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Status</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Crítica</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Atividades</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody>
            {titulosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                  Nenhum título encontrado
                </td>
              </tr>
            ) : (
              titulosFiltrados.map(titulo => (
                <tr key={titulo.id} className="hover:bg-gray-50 border-b border-gray-300">
                  <td className="px-4 py-2 border-r border-gray-300">
                    <input
                      type="checkbox"
                      checked={selectedTitulos.has(titulo.id)}
                      onChange={() => toggleSelectTitulo(titulo.id)}
                      disabled={titulo.status === 'titulo_de_acordo' || titulo.status === 'pago'}
                    />
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 font-medium border-r border-gray-300">{titulo.numero_titulo}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 border-r border-gray-300">
                    <Link href={`/sacados/${encodeURIComponent(titulo.sacado_cnpj)}`} className="text-[#0369a1] hover:underline font-medium">{titulo.sacado?.razao_social || '—'}</Link>
                    <br />
                    <span className="text-xs text-gray-500 font-mono">{formatCpfCnpj(titulo.sacado_cnpj)}</span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 border-r border-gray-300">
                    R$ {titulo.valor_original.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 font-semibold border-r border-gray-300">
                    R$ {titulo.valor_atualizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600 border-r border-gray-300">
                    {new Date(titulo.data_vencimento_original).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-2 border-r border-gray-300">
                    <Badge
                      variant={
                        titulo.status === 'titulo_original' ? 'error' :
                        titulo.status === 'titulo_de_acordo' ? 'warning' :
                        titulo.status === 'pago' ? 'success' :
                        'neutral'
                      }
                      size="sm"
                    >
                      {titulo.status === 'titulo_original' ? 'Título Original' :
                       titulo.status === 'titulo_de_acordo' ? 'Título de Acordo' :
                       titulo.status === 'pago' ? 'Pago' :
                       titulo.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600 border-r border-gray-300">
                    {titulo.critica || '—'}
                  </td>
                  <td className="px-4 py-2 text-center border-r border-gray-300">
                    {titulo.quantidade_atividades !== undefined ? (
                      <Badge variant="info" size="sm" className="text-xs">
                        {titulo.quantidade_atividades}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setTituloSelecionadoParaAtividades(titulo);
                        }}
                        className="px-2 py-1 border border-blue-300 bg-white hover:bg-blue-50 text-blue-600 text-xs font-medium"
                        title="Histórico de Cobrança"
                      >
                        Cobrança
                      </button>
                      <button
                        onClick={() => {
                          setTituloEditando(titulo);
                          setFormTitulo({
                            sacado_cnpj: titulo.sacado_cnpj,
                            numero_titulo: titulo.numero_titulo,
                            valor_original: titulo.valor_original.toString(),
                            valor_atualizado: titulo.valor_atualizado.toString(),
                            data_vencimento_original: titulo.data_vencimento_original,
                            data_entrada_sistema: titulo.data_entrada_sistema,
                            telefone: titulo.telefone || '',
                            critica: titulo.critica || '',
                            checagem: titulo.checagem || '',
                            vadu: titulo.vadu || '',
                            fundo: titulo.fundo || '',
                          });
                          setShowEditTitulo(true);
                        }}
                        className="px-2 py-1 border border-gray-300 bg-white hover:bg-gray-50 text-[#0369a1] text-xs font-medium"
                        title="Editar"
                      >
                        Editar
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`Tem certeza que deseja excluir PERMANENTEMENTE o título "${titulo.numero_titulo}"?\n\nEsta ação não pode ser desfeita.`)) {
                            return;
                          }
                          
                          try {
                            // Verifica se o título está em algum parcelamento
                            const { data: parcelamentosTitulo } = await supabase
                              .from('parcelamentos_titulos')
                              .select('parcelamento_id')
                              .eq('titulo_id', titulo.id);

                            if (parcelamentosTitulo && parcelamentosTitulo.length > 0) {
                              const parcelamentoIds = parcelamentosTitulo.map(p => p.parcelamento_id);
                              showToast(`Não é possível excluir: título está vinculado a ${parcelamentoIds.length} parcelamento(s). Primeiro remova o título do parcelamento.`, 'error');
                              return;
                            }

                            // Deleta as atividades relacionadas primeiro (se houver)
                            await supabase
                              .from('titulos_atividades')
                              .delete()
                              .eq('titulo_id', titulo.id);

                            // Deleta o histórico de críticas relacionadas (se houver)
                            await supabase
                              .from('titulos_criticas_historico')
                              .delete()
                              .eq('titulo_id', titulo.id);

                            // Deleta o título (CASCADE vai deletar parcelamentos_titulos automaticamente)
                            const { error } = await supabase
                              .from('titulos_negociados')
                              .delete()
                              .eq('id', titulo.id);

                            if (error) throw error;

                            showToast('Título excluído permanentemente com sucesso', 'success');
                            loadTitulos();
                          } catch (error: any) {
                            console.error('Erro ao excluir título:', error);
                            showToast(`Erro ao excluir título: ${error.message || 'Erro desconhecido'}`, 'error');
                          }
                        }}
                        className="px-2 py-1 border border-red-300 bg-white hover:bg-red-50 text-red-600 text-xs font-medium"
                        title="Excluir permanentemente"
                        disabled={titulo.status === 'titulo_de_acordo' || titulo.status === 'pago'}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Adicionar Título */}
      {showAddTitulo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Adicionar Título</h3>
                <button
                  onClick={() => setShowAddTitulo(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sacado <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formTitulo.sacado_cnpj}
                    onChange={(e) => setFormTitulo({ ...formTitulo, sacado_cnpj: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-sm"
                    required
                  >
                    <option value="">Selecione um sacado</option>
                    {sacados.map(s => (
                      <option key={s.cnpj} value={s.cnpj}>
                        {s.razao_social} - {formatCpfCnpj(s.cnpj)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nº Título <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formTitulo.numero_titulo}
                      onChange={(e) => setFormTitulo({ ...formTitulo, numero_titulo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Vencimento <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formTitulo.data_vencimento_original}
                      onChange={(e) => setFormTitulo({ ...formTitulo, data_vencimento_original: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor Original <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formTitulo.valor_original}
                      onChange={(e) => setFormTitulo({ ...formTitulo, valor_original: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor Atualizado
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formTitulo.valor_atualizado}
                      onChange={(e) => setFormTitulo({ ...formTitulo, valor_atualizado: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm"
                      placeholder="Igual ao original se não informado"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Entrada Sistema
                    </label>
                    <input
                      type="date"
                      value={formTitulo.data_entrada_sistema}
                      onChange={(e) => setFormTitulo({ ...formTitulo, data_entrada_sistema: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone
                    </label>
                    <input
                      type="text"
                      value={formTitulo.telefone}
                      onChange={(e) => setFormTitulo({ ...formTitulo, telefone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Crítica
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddCritica(true)}
                      className="text-xs text-[#0369a1] hover:underline"
                    >
                      + Nova crítica
                    </button>
                  </div>
                  <select
                    value={formTitulo.critica}
                    onChange={(e) => setFormTitulo({ ...formTitulo, critica: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-sm"
                  >
                    <option value="">Selecione...</option>
                    {criticas.map(c => (
                      <option key={c.id} value={c.nome}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Checagem
                  </label>
                  <textarea
                    value={formTitulo.checagem}
                    onChange={(e) => setFormTitulo({ ...formTitulo, checagem: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-sm"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    VADU
                  </label>
                  <input
                    type="text"
                    value={formTitulo.vadu}
                    onChange={(e) => setFormTitulo({ ...formTitulo, vadu: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Fundo
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddFundo(true)}
                      className="text-xs text-[#0369a1] hover:underline"
                    >
                      + Novo fundo
                    </button>
                  </div>
                  <select
                    value={formTitulo.fundo}
                    onChange={(e) => setFormTitulo({ ...formTitulo, fundo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-sm"
                  >
                    <option value="">Selecione...</option>
                    {fundos.map(f => (
                      <option key={f.id} value={f.nome}>
                        {f.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  variant="primary"
                  onClick={handleAddTitulo}
                  className="flex-1"
                >
                  Salvar
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowAddTitulo(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Título */}
      {showEditTitulo && tituloEditando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Editar Título</h3>
                <button
                  onClick={() => {
                    setShowEditTitulo(false);
                    setTituloEditando(null);
                    setFormTitulo({
                      sacado_cnpj: '',
                      numero_titulo: '',
                      valor_original: '',
                      valor_atualizado: '',
                      data_vencimento_original: '',
                      data_entrada_sistema: new Date().toISOString().split('T')[0],
                      telefone: '',
                      critica: '',
                      checagem: '',
                      vadu: '',
                      fundo: '',
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sacado <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formTitulo.sacado_cnpj}
                    onChange={(e) => setFormTitulo({ ...formTitulo, sacado_cnpj: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-sm"
                    required
                  >
                    <option value="">Selecione um sacado</option>
                    {sacados.map(s => (
                      <option key={s.cnpj} value={s.cnpj}>
                        {s.razao_social} - {formatCpfCnpj(s.cnpj)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nº Título <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formTitulo.numero_titulo}
                      onChange={(e) => setFormTitulo({ ...formTitulo, numero_titulo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Vencimento <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formTitulo.data_vencimento_original}
                      onChange={(e) => setFormTitulo({ ...formTitulo, data_vencimento_original: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor Original <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formTitulo.valor_original}
                      onChange={(e) => setFormTitulo({ ...formTitulo, valor_original: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor Atualizado
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formTitulo.valor_atualizado}
                      onChange={(e) => setFormTitulo({ ...formTitulo, valor_atualizado: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm"
                      placeholder="Igual ao original se não informado"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Entrada Sistema
                    </label>
                    <input
                      type="date"
                      value={formTitulo.data_entrada_sistema}
                      onChange={(e) => setFormTitulo({ ...formTitulo, data_entrada_sistema: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone
                    </label>
                    <input
                      type="text"
                      value={formTitulo.telefone}
                      onChange={(e) => setFormTitulo({ ...formTitulo, telefone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Crítica
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddCritica(true)}
                      className="text-xs text-[#0369a1] hover:underline"
                    >
                      + Nova crítica
                    </button>
                  </div>
                  <select
                    value={formTitulo.critica}
                    onChange={(e) => setFormTitulo({ ...formTitulo, critica: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-sm"
                  >
                    <option value="">Selecione...</option>
                    {criticas.map(c => (
                      <option key={c.id} value={c.nome}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Checagem
                  </label>
                  <textarea
                    value={formTitulo.checagem}
                    onChange={(e) => setFormTitulo({ ...formTitulo, checagem: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-sm"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    VADU
                  </label>
                  <input
                    type="text"
                    value={formTitulo.vadu}
                    onChange={(e) => setFormTitulo({ ...formTitulo, vadu: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Fundo
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddFundo(true)}
                      className="text-xs text-[#0369a1] hover:underline"
                    >
                      + Novo fundo
                    </button>
                  </div>
                  <select
                    value={formTitulo.fundo}
                    onChange={(e) => setFormTitulo({ ...formTitulo, fundo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-sm"
                  >
                    <option value="">Selecione...</option>
                    {fundos.map(f => (
                      <option key={f.id} value={f.nome}>
                        {f.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  variant="primary"
                  onClick={handleEditTitulo}
                  className="flex-1"
                >
                  Salvar Alterações
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowEditTitulo(false);
                    setTituloEditando(null);
                    setFormTitulo({
                      sacado_cnpj: '',
                      numero_titulo: '',
                      valor_original: '',
                      valor_atualizado: '',
                      data_vencimento_original: '',
                      data_entrada_sistema: new Date().toISOString().split('T')[0],
                      telefone: '',
                      critica: '',
                      checagem: '',
                      vadu: '',
                      fundo: '',
                    });
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Parcelar Títulos */}
      {showParcelar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Criar Parcelamento</h3>
                <button
                  onClick={() => setShowParcelar(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>{selectedTitulos.size}</strong> título(s) selecionado(s) - 
                    Total: <strong>R$ {valorTotalSelecionado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição (opcional)
                  </label>
                  <input
                    type="text"
                    value={formParcelamento.descricao}
                    onChange={(e) => setFormParcelamento({ ...formParcelamento, descricao: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Total Negociado <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formParcelamento.valor_total_negociado}
                    onChange={(e) => {
                      const formatted = formatMoneyInput(e.target.value);
                      setFormParcelamento({ ...formParcelamento, valor_total_negociado: formatted });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 text-sm"
                    placeholder="R$ 0,00"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Primeira Parcela <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formParcelamento.data_primeira_parcela}
                      onChange={(e) => setFormParcelamento({ ...formParcelamento, data_primeira_parcela: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Intervalo <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formParcelamento.intervalo_parcelas}
                      onChange={(e) => setFormParcelamento({ ...formParcelamento, intervalo_parcelas: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm"
                      required
                    >
                      <option value="mensal">Mensal</option>
                      <option value="quinzenal">Quinzenal</option>
                      <option value="personalizado">Personalizado</option>
                    </select>
                  </div>
                </div>

                {formParcelamento.intervalo_parcelas === 'personalizado' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Intervalo em Dias <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formParcelamento.intervalo_dias}
                      onChange={(e) => setFormParcelamento({ ...formParcelamento, intervalo_dias: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm"
                      required
                    />
                  </div>
                )}

                {/* Seletor de Modo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modo de Parcelamento
                  </label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="modo_parcelamento"
                        value="simples"
                        checked={formParcelamento.modo === 'simples'}
                        onChange={(e) => setFormParcelamento({ ...formParcelamento, modo: 'simples' })}
                      />
                      <span className="text-sm text-gray-700">Simples</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="modo_parcelamento"
                        value="grupos"
                        checked={formParcelamento.modo === 'grupos'}
                        onChange={(e) => setFormParcelamento({ ...formParcelamento, modo: 'grupos' })}
                      />
                      <span className="text-sm text-gray-700">Grupos</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formParcelamento.modo === 'simples' 
                      ? 'Parcelas iguais ou valores individuais'
                      : 'Defina grupos de parcelas com valores iguais (ex: 5 parcelas de R$ 150,00)'}
                  </p>
                </div>

                {/* Número de Parcelas (apenas modo simples) */}
                {formParcelamento.modo === 'simples' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Parcelas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formParcelamento.numero_parcelas}
                      onChange={(e) => {
                        const num = parseInt(e.target.value) || 0;
                        const numParcelasParaArray = formParcelamento.tem_sinal ? num - 1 : num;
                        setFormParcelamento({
                          ...formParcelamento,
                          numero_parcelas: e.target.value,
                          valores_parcelas: formParcelamento.valores_iguais
                            ? []
                            : Array(numParcelasParaArray > 0 ? numParcelasParaArray : 0).fill(''),
                        });
                      }}
                    className="w-full px-3 py-2 border border-gray-300 text-sm"
                    required
                  />
                </div>
                )}

                {/* Modo Grupos */}
                {formParcelamento.modo === 'grupos' && (
                  <div className="space-y-3 border border-gray-300 p-4 rounded bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Grupos de Parcelas
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setFormParcelamento({
                            ...formParcelamento,
                            grupos: [...formParcelamento.grupos, { quantidade: '', valor: '' }]
                          });
                        }}
                        className="px-3 py-1 bg-[#0369a1] text-white text-xs font-medium rounded hover:bg-[#0284c7]"
                      >
                        + Adicionar Grupo
                      </button>
                    </div>

                    <div className="space-y-2">
                      {formParcelamento.grupos.map((grupo, index) => {
                        const quantidade = parseInt(grupo.quantidade) || 0;
                        const valor = parseMoneyInput(grupo.valor);
                        const subtotal = quantidade * valor;
                        
                        return (
                          <div key={index} className="bg-white p-3 rounded border border-gray-200">
                            <div className="flex items-start gap-2">
                              <div className="flex-1 grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">
                                    Quantidade de Parcelas
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={grupo.quantidade}
                                    onChange={(e) => {
                                      const novosGrupos = [...formParcelamento.grupos];
                                      novosGrupos[index].quantidade = e.target.value;
                                      setFormParcelamento({ ...formParcelamento, grupos: novosGrupos });
                                    }}
                                    className="w-full px-2 py-1.5 border border-gray-300 text-sm rounded"
                                    placeholder="Ex: 5"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">
                                    Valor de Cada Parcela
                                  </label>
                                  <input
                                    type="text"
                                    value={grupo.valor}
                                    onChange={(e) => {
                                      const formatted = formatMoneyInput(e.target.value);
                                      const novosGrupos = [...formParcelamento.grupos];
                                      novosGrupos[index].valor = formatted;
                                      setFormParcelamento({ ...formParcelamento, grupos: novosGrupos });
                                    }}
                                    className="w-full px-2 py-1.5 border border-gray-300 text-sm rounded"
                                    placeholder="R$ 0,00"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const novosGrupos = formParcelamento.grupos.filter((_, i) => i !== index);
                                  setFormParcelamento({ ...formParcelamento, grupos: novosGrupos });
                                }}
                                className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                                title="Remover grupo"
                              >
                                ✕
                              </button>
                            </div>
                            {quantidade > 0 && valor > 0 && (
                              <div className="mt-2 text-xs text-gray-600">
                                <strong>{quantidade}</strong> parcela(s) × <strong>{formatMoney(valor)}</strong> = <strong className="text-[#0369a1]">{formatMoney(subtotal)}</strong>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {formParcelamento.grupos.length === 0 && (
                      <p className="text-xs text-gray-500 text-center py-2">
                        Clique em "Adicionar Grupo" para começar
                      </p>
                    )}

                    {/* Total calculado dos grupos */}
                    {formParcelamento.grupos.length > 0 && (() => {
                      const totalGrupos = formParcelamento.grupos.reduce((sum, grupo) => {
                        const quantidade = parseInt(grupo.quantidade) || 0;
                        const valor = parseMoneyInput(grupo.valor);
                        return sum + (quantidade * valor);
                      }, 0);
                      const totalParcelas = formParcelamento.grupos.reduce((sum, grupo) => {
                        return sum + (parseInt(grupo.quantidade) || 0);
                      }, 0);

                      return (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-700">
                              <strong>{totalParcelas}</strong> parcela(s) no total
                            </span>
                            <span className="text-[#0369a1] font-semibold">
                              Total: {formatMoney(totalGrupos)}
                            </span>
                          </div>
                          {formParcelamento.valor_total_negociado && (
                            (() => {
                              const valorTotal = parseMoneyInput(formParcelamento.valor_total_negociado);
                              const diferenca = valorTotal - totalGrupos;
                              return (
                                <div className="mt-2 text-xs">
                                  {Math.abs(diferenca) > 0.01 ? (
                                    diferenca > 0 ? (
                                      // Faltam (parcelas somam menos) - pode ser desconto
                                      <span className="text-orange-600">
                                        Faltam {formatMoney(diferenca)} do valor total negociado. 
                                        Se for desconto, pode continuar.
                                      </span>
                                    ) : (
                                      // Sobram (parcelas somam mais) - são juros, tudo bem
                                      <span className="text-blue-600">
                                        ✓ Excedente de {formatMoney(Math.abs(diferenca))} (juros)
                                      </span>
                                    )
                                  ) : (
                                    <span className="text-green-600">✓ Valores conferem!</span>
                                  )}
                                </div>
                              );
                            })()
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Modo Simples */}
                {formParcelamento.modo === 'simples' && (
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formParcelamento.tem_sinal}
                      onChange={(e) => {
                        const temSinal = e.target.checked;
                        const numParcelas = parseInt(formParcelamento.numero_parcelas) || 0;
                        const numParcelasParaArray = temSinal ? numParcelas - 1 : numParcelas;
                        
                        setFormParcelamento({
                          ...formParcelamento,
                          tem_sinal: temSinal,
                          valor_sinal: temSinal ? formParcelamento.valor_sinal : '',
                          valores_parcelas: formParcelamento.valores_iguais
                            ? []
                            : Array(numParcelasParaArray > 0 ? numParcelasParaArray : 0).fill(''),
                        });
                      }}
                    />
                    <span className="text-sm font-medium text-gray-700">Incluir sinal na primeira parcela</span>
                  </label>

                  {formParcelamento.tem_sinal && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor do Sinal (1ª Parcela) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formParcelamento.valor_sinal}
                        onChange={(e) => {
                          const formatted = formatMoneyInput(e.target.value);
                          setFormParcelamento({ ...formParcelamento, valor_sinal: formatted });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 text-sm"
                        placeholder="R$ 0,00"
                        required
                      />
                    </div>
                  )}

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formParcelamento.valores_iguais}
                      onChange={(e) => {
                        const iguais = e.target.checked;
                        const numParcelas = parseInt(formParcelamento.numero_parcelas) || 0;
                        const numParcelasParaArray = formParcelamento.tem_sinal ? numParcelas - 1 : numParcelas;
                        setFormParcelamento({
                          ...formParcelamento,
                          valores_iguais: iguais,
                          valores_parcelas: iguais ? [] : Array(numParcelasParaArray > 0 ? numParcelasParaArray : 0).fill(''),
                        });
                      }}
                    />
                    <span className="text-sm text-gray-700">Valores iguais (nas parcelas restantes)</span>
                  </label>
                </div>
                )}

                {formParcelamento.modo === 'simples' && !formParcelamento.valores_iguais && formParcelamento.numero_parcelas && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valores das Parcelas {formParcelamento.tem_sinal && '(a partir da 2ª parcela)'}
                    </label>
                    <div className="space-y-2">
                      {Array(parseInt(formParcelamento.numero_parcelas) || 0).fill(0).map((_, i) => {
                        // Se tem sinal, a primeira parcela não aparece aqui (já está no campo de sinal)
                        if (formParcelamento.tem_sinal && i === 0) return null;
                        
                        const indiceArray = formParcelamento.tem_sinal ? i - 1 : i;
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 w-20">
                              Parcela {i + 1}:
                            </span>
                            <input
                              type="text"
                              value={formParcelamento.valores_parcelas[indiceArray] || ''}
                              onChange={(e) => {
                                const formatted = formatMoneyInput(e.target.value);
                                const novosValores = [...formParcelamento.valores_parcelas];
                                novosValores[indiceArray] = formatted;
                                setFormParcelamento({ ...formParcelamento, valores_parcelas: novosValores });
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 text-sm"
                              placeholder="R$ 0,00"
                            />
                          </div>
                        );
                      })}
                    </div>
                    {formParcelamento.tem_sinal && (
                      <p className="text-xs text-gray-500 mt-2">
                        💡 A 1ª parcela (sinal) já está definida acima. Configure aqui as parcelas restantes.
                      </p>
                    )}
                  </div>
                )}

                {/* Preview das Parcelas */}
                {(() => {
                  const valorTotalNegociado = parseMoneyInput(formParcelamento.valor_total_negociado);
                  const dataPrimeira = formParcelamento.data_primeira_parcela;
                  const intervalo = formParcelamento.intervalo_parcelas;
                  const intervaloDias = formParcelamento.intervalo_dias ? parseInt(formParcelamento.intervalo_dias) : 0;

                  if (!dataPrimeira) return null;

                  // Calcula valores das parcelas baseado no modo
                  let valoresParcelas: number[] = [];
                  let numeroParcelas = 0;
                  const temSinal = formParcelamento.modo === 'simples' && formParcelamento.tem_sinal;
                  const valorSinal = temSinal ? parseMoneyInput(formParcelamento.valor_sinal) : 0;

                  if (formParcelamento.modo === 'grupos') {
                    // Modo Grupos: gera parcelas baseado nos grupos
                    formParcelamento.grupos.forEach(grupo => {
                      const quantidade = parseInt(grupo.quantidade) || 0;
                      const valor = parseMoneyInput(grupo.valor);
                      for (let i = 0; i < quantidade; i++) {
                        valoresParcelas.push(valor);
                      }
                    });
                    numeroParcelas = valoresParcelas.length;
                    
                    // Verifica se há diferença (excedente - juros)
                    const totalGrupos = valoresParcelas.reduce((sum, v) => sum + v, 0);
                    const diferenca = valorTotalNegociado - totalGrupos;
                    
                    // Se SOBRAR (parcelas somam mais que o total) - adiciona parcela de ajuste (juros)
                    // Se FALTAR (parcelas somam menos) - não cria parcela (é desconto)
                    if (diferenca < -0.01) {
                      // Sobra valor = juros, adiciona parcela de ajuste positiva
                      valoresParcelas.push(Math.abs(diferenca));
                      numeroParcelas++;
                    }
                    // Se faltar (diferenca > 0.01), não cria parcela de ajuste - é desconto
                  } else {
                    // Modo Simples (lógica original)
                    numeroParcelas = parseInt(formParcelamento.numero_parcelas) || 0;
                    if (!numeroParcelas) return null;
                    
                    const valoresIguais = formParcelamento.valores_iguais;
                    const valorRestante = valorTotalNegociado - valorSinal;
                    const numeroParcelasRestantes = numeroParcelas - (temSinal ? 1 : 0);
                    
                    if (temSinal) {
                      // Primeira parcela é o sinal
                      valoresParcelas.push(valorSinal);
                      
                      // Calcula as parcelas restantes
                      if (valoresIguais && numeroParcelasRestantes > 0) {
                        const valorParcela = valorRestante / numeroParcelasRestantes;
                        for (let i = 0; i < numeroParcelasRestantes; i++) {
                          valoresParcelas.push(valorParcela);
                        }
                      } else {
                        // Usa os valores informados manualmente (pula a primeira que já é o sinal)
                        const valoresManuais = formParcelamento.valores_parcelas.slice(1).map(v => parseMoneyInput(v || '0'));
                        valoresParcelas.push(...valoresManuais);
                      }
                    } else {
                      // Sem sinal, cálculo normal
                      if (valoresIguais) {
                        const valorParcela = valorTotalNegociado / numeroParcelas;
                        valoresParcelas = Array(numeroParcelas).fill(valorParcela);
                      } else {
                        valoresParcelas = formParcelamento.valores_parcelas.map(v => parseMoneyInput(v || '0'));
                      }
                    }
                  }

                  // Calcula datas das parcelas
                  const parcelasPreview: Array<{ numero: number; valor: number; data: string }> = [];
                  if (dataPrimeira) {
                    const dataPrimeiraObj = new Date(dataPrimeira);
                    for (let i = 0; i < numeroParcelas; i++) {
                      const dataVencimento = new Date(dataPrimeiraObj);
                      
                      if (intervalo === 'mensal') {
                        dataVencimento.setMonth(dataVencimento.getMonth() + i);
                      } else if (intervalo === 'quinzenal') {
                        dataVencimento.setDate(dataVencimento.getDate() + (i * 15));
                      } else if (intervalo === 'personalizado' && intervaloDias > 0) {
                        dataVencimento.setDate(dataVencimento.getDate() + (i * intervaloDias));
                      }

                      parcelasPreview.push({
                        numero: i + 1,
                        valor: valoresParcelas[i] || 0,
                        data: dataVencimento.toISOString().split('T')[0],
                      });
                    }
                  }

                  const somaParcelas = valoresParcelas.reduce((sum, v) => sum + v, 0);
                  const diferenca = Math.abs(somaParcelas - valorTotalNegociado);

                  return (
                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Preview das Parcelas</h4>
                      
                      {parcelasPreview.length > 0 && (
                        <div className="space-y-2 mb-3">
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-2 py-2 text-left border-r border-gray-300">Parcela</th>
                                  <th className="px-2 py-2 text-left border-r border-gray-300">Valor</th>
                                  <th className="px-2 py-2 text-left">Vencimento</th>
                                </tr>
                              </thead>
                              <tbody>
                                {parcelasPreview.map((parcela) => {
                                  // Verifica se é parcela de ajuste (última e valor diferente dos grupos - apenas se SOBRAR)
                                  const isAjuste = formParcelamento.modo === 'grupos' && 
                                    parcela.numero === parcelasPreview.length &&
                                    formParcelamento.grupos.length > 0 &&
                                    (() => {
                                      const totalGrupos = formParcelamento.grupos.reduce((sum, grupo) => {
                                        const quantidade = parseInt(grupo.quantidade) || 0;
                                        const valor = parseMoneyInput(grupo.valor);
                                        return sum + (quantidade * valor);
                                      }, 0);
                                      const diferenca = valorTotalNegociado - totalGrupos;
                                      // Só é ajuste se SOBRAR valor (diferenca negativa, ou seja, parcelas somam mais)
                                      // E se a última parcela tem o valor do excedente
                                      if (diferenca < -0.01) {
                                        return Math.abs(parcela.valor - Math.abs(diferenca)) < 0.01;
                                      }
                                      return false;
                                    })();
                                  
                                  return (
                                  <tr key={parcela.numero} className={`border-b border-gray-200 ${
                                    temSinal && parcela.numero === 1 ? 'bg-blue-50' : 
                                    isAjuste ? 'bg-yellow-50' : ''
                                  }`}>
                                    <td className="px-2 py-2 border-r border-gray-300 font-medium">
                                      {parcela.numero}
                                      {temSinal && parcela.numero === 1 && (
                                        <span className="ml-1 text-blue-600 font-semibold">(Sinal)</span>
                                      )}
                                      {isAjuste && (
                                        <span className="ml-1 text-yellow-600 font-semibold">(Juros/Ajuste)</span>
                                      )}
                                    </td>
                                    <td className="px-2 py-2 border-r border-gray-300 font-semibold">
                                      {formatMoney(parcela.valor)}
                                    </td>
                                    <td className="px-2 py-2">
                                      {new Date(parcela.data).toLocaleDateString('pt-BR')}
                                    </td>
                                  </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm pt-3 border-t border-gray-300">
                        <div>
                          <span className="text-gray-600">Total das Parcelas:</span>
                          <p className="font-semibold text-gray-900">
                            {formatMoney(somaParcelas)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Valor Total Negociado:</span>
                          <p className="font-semibold text-gray-900">
                            {formatMoney(valorTotalNegociado)}
                          </p>
                        </div>
                      </div>

                      {diferenca > 0.01 && (
                        <div className={`mt-3 p-2 rounded text-xs ${
                          somaParcelas < valorTotalNegociado
                            ? 'bg-orange-50 border border-orange-200 text-orange-800' 
                            : 'bg-blue-50 border border-blue-200 text-blue-800'
                        }`}>
                          {somaParcelas < valorTotalNegociado ? (
                            <>
                              <strong>Desconto:</strong> A soma das parcelas ({formatMoney(somaParcelas)}) 
                              é menor que o valor total negociado ({formatMoney(valorTotalNegociado)}).
                              Diferença: <strong>{formatMoney(diferenca)}</strong> (será confirmado antes de salvar)
                            </>
                          ) : (
                            <>
                              <strong>Juros:</strong> A soma das parcelas ({formatMoney(somaParcelas)}) 
                              é maior que o valor total negociado ({formatMoney(valorTotalNegociado)}).
                              Excedente: <strong>{formatMoney(diferenca)}</strong> (juros)
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="flex gap-2 mt-6">
                  <Button
                    variant="primary"
                    onClick={handleCriarParcelamento}
                    className="flex-1"
                  >
                    Criar Parcelamento
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowParcelar(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Importar Excel/CSV */}
      {showImportar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Importar Títulos</h3>
                <button
                  onClick={() => {
                    setShowImportar(false);
                    setDadosImportados([]);
                    setConsultarAPIsImportacao(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>{dadosImportados.length}</strong> linha(s) válida(s)
                    {dadosImportados.filter(d => d.tem_cnpj).length > 0 && (
                      <> - <strong>{dadosImportados.filter(d => d.tem_cnpj).length}</strong> com CNPJ</>
                    )}
                    {dadosImportados.filter(d => !d.tem_cnpj).length > 0 && (
                      <> - <strong>{dadosImportados.filter(d => !d.tem_cnpj).length}</strong> sem CNPJ</>
                    )}
                    {dadosImportados.filter(d => d.titulo_existe).length > 0 && (
                      <> - <strong>{dadosImportados.filter(d => d.titulo_existe).length}</strong> já existem no banco</>
                    )}
                  </p>
                </div>

                {/* Checkbox para consultar APIs (apenas se tiver CNPJ) */}
                {(() => {
                  // Conta CNPJs únicos que serão criados (não linhas)
                  const cnpjsUnicosNovos = new Set(
                    dadosImportados
                      .filter(d => d.tem_cnpj && !d.sacado_existe)
                      .map(d => d.cnpj)
                  );
                  const quantidadeCNPJsUnicos = cnpjsUnicosNovos.size;
                  
                  if (quantidadeCNPJsUnicos === 0) return null;
                  
                  return (
                    <div className="bg-[#fff7ed] border border-[#fed7aa] rounded-lg p-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consultarAPIsImportacao}
                          onChange={(e) => setConsultarAPIsImportacao(e.target.checked)}
                          className="mt-1"
                        />
                        <div>
                          <p className="text-sm font-medium text-[#9a3412]">
                            Consultar APIs após salvar (endereços, telefones, emails, QSA)
                          </p>
                          <p className="text-xs text-[#9a3412] mt-1">
                            Será aplicado aos <strong>{quantidadeCNPJsUnicos}</strong> CNPJ(s) único(s) que serão criados
                            {dadosImportados.filter(d => d.tem_cnpj && !d.sacado_existe).length > quantidadeCNPJsUnicos && (
                              <> (de {dadosImportados.filter(d => d.tem_cnpj && !d.sacado_existe).length} linha(s) com CNPJ)</>
                            )}
                          </p>
                        </div>
                      </label>
                    </div>
                  );
                })()}

                {/* Preview dos dados */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Preview dos Dados:</h4>
                  <div className="overflow-x-auto border border-gray-300 rounded">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-2 py-2 text-left border-r border-gray-300">Linha</th>
                          <th className="px-2 py-2 text-left border-r border-gray-300">CNPJ</th>
                          <th className="px-2 py-2 text-left border-r border-gray-300">Sacado</th>
                          <th className="px-2 py-2 text-left border-r border-gray-300">Nº Título</th>
                          <th className="px-2 py-2 text-left border-r border-gray-300">Valor</th>
                          <th className="px-2 py-2 text-left border-r border-gray-300">Vencimento</th>
                          <th className="px-2 py-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dadosImportados.slice(0, 20).map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-2 py-2 border-r border-gray-300">{item.linha}</td>
                            <td className="px-2 py-2 border-r border-gray-300 font-mono text-xs">
                              {item.tem_cnpj ? formatCpfCnpj(item.cnpj) : '—'}
                            </td>
                            <td className="px-2 py-2 border-r border-gray-300">
                              {item.razao_social || '—'}
                              {item.tem_cnpj && (
                                <Badge
                                  variant={item.sacado_existe ? 'success' : 'warning'}
                                  size="sm"
                                  className="ml-2"
                                >
                                  {item.sacado_existe ? 'Existe' : 'Novo'}
                                </Badge>
                              )}
                            </td>
                            <td className="px-2 py-2 border-r border-gray-300">{item.numero_titulo || '—'}</td>
                            <td className="px-2 py-2 border-r border-gray-300">
                              R$ {item.valor_original.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-2 py-2 border-r border-gray-300">
                              {formatarDataExibicao(item.data_vencimento_original)}
                            </td>
                            <td className="px-2 py-2">
                              {!item.tem_cnpj && (
                                <Badge variant="error" size="sm">Sem CNPJ</Badge>
                              )}
                              {item.tem_cnpj && !item.numero_titulo && (
                                <Badge variant="error" size="sm">Sem Nº Título</Badge>
                              )}
                              {item.tem_cnpj && item.numero_titulo && item.titulo_existe && (
                                <Badge variant="warning" size="sm">Já Existe</Badge>
                              )}
                              {item.tem_cnpj && item.numero_titulo && !item.titulo_existe && (
                                <Badge variant="success" size="sm">OK</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {dadosImportados.length > 20 && (
                      <div className="p-2 text-xs text-gray-600 text-center bg-gray-50">
                        ... e mais {dadosImportados.length - 20} linha(s)
                      </div>
                    )}
                  </div>
                </div>

                {/* Aviso sobre títulos sem CNPJ */}
                {dadosImportados.filter(d => !d.tem_cnpj).length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                    <p className="text-sm text-yellow-800">
                      <strong>Atenção:</strong> {dadosImportados.filter(d => !d.tem_cnpj).length} título(s) não possuem CNPJ válido.
                      Estes títulos <strong>não serão importados</strong>. Adicione o CNPJ na planilha ou cadastre os títulos manualmente.
                    </p>
                  </div>
                )}

                {/* Aviso sobre títulos já existentes */}
                {dadosImportados.filter(d => d.titulo_existe).length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 p-3 rounded">
                    <p className="text-sm text-orange-800">
                      <strong>Info:</strong> {dadosImportados.filter(d => d.titulo_existe).length} título(s) já existem no banco de dados.
                      Estes títulos <strong>não serão importados novamente</strong> (serão ignorados).
                    </p>
                  </div>
                )}

                {/* Seleção de Fundo */}
                <div className="bg-white border border-gray-300 p-4 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Fundo para os títulos importados
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddFundo(true)}
                      className="text-xs text-[#0369a1] hover:underline"
                    >
                      + Novo fundo
                    </button>
                  </div>
                  <select
                    value={fundoImportacao}
                    onChange={(e) => setFundoImportacao(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 text-sm"
                  >
                    <option value="">Selecione um fundo...</option>
                    {fundos.map(f => (
                      <option key={f.id} value={f.nome}>
                        {f.nome}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Todos os títulos importados serão associados a este fundo
                  </p>
                </div>

                <div className="flex gap-2 mt-6">
                  <Button
                    variant="primary"
                    onClick={handleSalvarImportacao}
                    className="flex-1"
                    disabled={importando || dadosImportados.length === 0}
                  >
                    {importando ? 'Importando...' : 'Salvar Importação'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowImportar(false);
                      setDadosImportados([]);
                      setConsultarAPIsImportacao(false);
                      setFundoImportacao('');
                    }}
                    className="flex-1"
                    disabled={importando}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Adicionar Nova Crítica */}
      {showAddCritica && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Nova Crítica</h3>
                <button
                  onClick={() => {
                    setShowAddCritica(false);
                    setNovaCriticaNome('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Crítica <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={novaCriticaNome}
                    onChange={(e) => setNovaCriticaNome(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 text-sm"
                    placeholder="Ex: Em Cobrança Judicial"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  variant="primary"
                  onClick={handleAddCritica}
                  className="flex-1"
                >
                  Adicionar
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowAddCritica(false);
                    setNovaCriticaNome('');
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Adicionar Novo Fundo */}
      {showAddFundo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Novo Fundo</h3>
                <button
                  onClick={() => {
                    setShowAddFundo(false);
                    setNovoFundoNome('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Fundo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={novoFundoNome}
                    onChange={(e) => setNovoFundoNome(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 text-sm"
                    placeholder="Ex: Fundo ABC"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  variant="primary"
                  onClick={handleAddFundo}
                  className="flex-1"
                >
                  Adicionar
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowAddFundo(false);
                    setNovoFundoNome('');
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Parcelamentos */}
      {parcelamentos.length > 0 && (
        <div className="mt-8">
          <h3 className="text-base font-semibold text-gray-700 mb-4">Parcelamentos</h3>
          <div className="space-y-4">
            {parcelamentos.map(parc => (
              <div key={parc.id} className="bg-white border border-gray-300 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {parc.descricao || `Parcelamento #${parc.id.slice(0, 8)}`}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Criado em {new Date(parc.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Badge
                    variant={parc.status === 'ativo' ? 'success' : 'neutral'}
                    size="sm"
                  >
                    {parc.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                  <div>
                    <span className="text-gray-600">Valor Total:</span>
                    <p className="font-semibold text-gray-900">
                      R$ {parc.valor_total_negociado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Primeira Parcela:</span>
                    <p className="font-semibold text-gray-900">
                      {new Date(parc.data_primeira_parcela).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Intervalo:</span>
                    <p className="font-semibold text-gray-900">
                      {parc.intervalo_parcelas === 'mensal' ? 'Mensal' :
                       parc.intervalo_parcelas === 'quinzenal' ? 'Quinzenal' :
                       `Personalizado (${parc.intervalo_dias} dias)`}
                    </p>
                  </div>
                </div>

                {parc.parcelas && parc.parcelas.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Parcelas:</h5>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left border-r border-gray-300">Parcela</th>
                            <th className="px-3 py-2 text-left border-r border-gray-300">Valor</th>
                            <th className="px-3 py-2 text-left border-r border-gray-300">Vencimento</th>
                            <th className="px-3 py-2 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parc.parcelas.map(parcela => (
                            <tr key={parcela.id} className="border-b border-gray-200">
                              <td className="px-3 py-2 border-r border-gray-300">{parcela.numero_parcela}</td>
                              <td className="px-3 py-2 border-r border-gray-300">
                                R$ {parcela.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-3 py-2 border-r border-gray-300">
                                {new Date(parcela.data_vencimento).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="px-3 py-2">
                                <Badge
                                  variant={
                                    parcela.status === 'vencida' ? 'error' :
                                    parcela.status === 'paga' ? 'success' :
                                    'neutral'
                                  }
                                  size="sm"
                                >
                                  {parcela.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Histórico de Cobrança do Título */}
      {tituloSelecionadoParaAtividades && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">
                Histórico de Cobrança - Título #{tituloSelecionadoParaAtividades.numero_titulo}
              </h3>
              <button
                onClick={() => {
                  setTituloSelecionadoParaAtividades(null);
                  // Recarregar títulos para atualizar contagem de atividades
                  loadTitulos();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <TitulosAtividadesManager
                tituloId={tituloSelecionadoParaAtividades.id}
                numeroTitulo={tituloSelecionadoParaAtividades.numero_titulo}
                sacadoNome={tituloSelecionadoParaAtividades.sacado?.razao_social || tituloSelecionadoParaAtividades.sacado?.nome_fantasia || tituloSelecionadoParaAtividades.sacado_cnpj}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

