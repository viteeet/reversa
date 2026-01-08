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

interface TitulosNegociadosManagerProps {
  cedenteId: string;
}

export default function TitulosNegociadosManager({ cedenteId }: TitulosNegociadosManagerProps) {
  const { showToast } = useToast();
  const [titulos, setTitulos] = useState<TituloNegociado[]>([]);
  const [parcelamentos, setParcelamentos] = useState<Parcelamento[]>([]);
  const [sacados, setSacados] = useState<Sacado[]>([]);
  const [criticas, setCriticas] = useState<Critica[]>([]);
  const [showAddCritica, setShowAddCritica] = useState(false);
  const [novaCriticaNome, setNovaCriticaNome] = useState('');
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    ]);
    setLoading(false);
  }

  async function loadTitulos() {
    try {
      const { data, error } = await supabase
        .from('titulos_negociados')
        .select('*')
        .eq('cedente_id', cedenteId)
        .eq('ativo', true)
        .order('data_vencimento_original', { ascending: false });

      if (error) throw error;

      // Carrega informações dos sacados separadamente
      const titulosComSacado = await Promise.all(
        (data || []).map(async (titulo: any) => {
          const { data: sacadoData } = await supabase
            .from('sacados')
            .select('razao_social, nome_fantasia')
            .eq('cnpj', titulo.sacado_cnpj)
            .single();

          return {
            ...titulo,
            sacado: sacadoData || null,
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
    });

    setShowParcelar(true);
  }

  async function handleCriarParcelamento() {
    if (!formParcelamento.valor_total_negociado || !formParcelamento.data_primeira_parcela || !formParcelamento.numero_parcelas) {
      showToast('Preencha todos os campos obrigatórios', 'error');
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
      const numeroParcelas = parseInt(formParcelamento.numero_parcelas);
      const valoresIguais = formParcelamento.valores_iguais;
      const temSinal = formParcelamento.tem_sinal;
      const valorSinal = temSinal ? parseMoneyInput(formParcelamento.valor_sinal) : 0;
      const valorRestante = valorTotalNegociado - valorSinal;
      const numeroParcelasRestantes = numeroParcelas - (temSinal ? 1 : 0);

      let valoresParcelas: number[] = [];
      
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
            const workbook = XLSX.read(data, { type: 'binary' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);
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
        const possiveisNomesNormalizados = possiveisNomes.map(n => normalizarString(n));
        
        for (let i = 0; i < possiveisNomesNormalizados.length; i++) {
          const nomeNormalizado = possiveisNomesNormalizados[i];
          for (const key of rowKeys) {
            const keyNormalizado = normalizarString(key);
            if (keyNormalizado === nomeNormalizado && row[key] !== undefined && row[key] !== null && row[key] !== '') {
              return String(row[key]);
            }
          }
        }
        
        return '';
      };

      // Debug: mostra as chaves disponíveis na primeira linha
      if (data.length > 0) {
        console.log('Colunas disponíveis na planilha:', Object.keys(data[0]));
        console.log('Primeira linha de dados:', data[0]);
      }

      // Normaliza os dados - detecta colunas automaticamente
      const dadosNormalizados = data.map((row: any, index: number) => {
        // Tenta detectar CNPJ usando a função buscarColuna
        const cnpjKeys = ['cnpj', 'CNPJ', 'cnpj_sacado', 'CNPJ_Sacado', 'cpf_cnpj', 'documento', 'Documento', 'DOCUMENTO'];
        const cnpjValue = buscarColuna(row, cnpjKeys);
        let cnpj = '';
        if (cnpjValue) {
          cnpj = cnpjValue.replace(/\D+/g, '');
          if (cnpj.length !== 14 || !validarCNPJ(cnpj)) {
            cnpj = '';
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
        const dataVencimento = buscarColuna(row, dataVencimentoKeys);

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

        // Debug na primeira linha
        if (index === 0) {
          console.log('Primeira linha processada:', {
            cnpj,
            numeroTitulo,
            valorOriginal,
            dataVencimento,
            razaoSocial,
            rowKeys: Object.keys(row),
            rowValues: Object.values(row)
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
          data_vencimento_original: dataVencimento.trim(),
          telefone: String(telefone).trim(),
          critica: String(critica).trim(),
          checagem: String(checagem).trim(),
          vadu: String(vadu).trim(),
          tem_cnpj: cnpj.length === 14 && validarCNPJ(cnpj),
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
      const numerosTitulos = dadosSemDuplicatas
        .filter(d => d.tem_cnpj && d.numero_titulo)
        .map(d => d.numero_titulo.trim());

      if (numerosTitulos.length > 0) {
        const { data: titulosExistentes } = await supabase
          .from('titulos_negociados')
          .select('numero_titulo')
          .eq('cedente_id', cedenteId)
          .in('numero_titulo', numerosTitulos);

        const titulosExistentesSet = new Set(titulosExistentes?.map(t => t.numero_titulo.trim().toLowerCase()) || []);
        dadosSemDuplicatas.forEach(d => {
          if (d.tem_cnpj && d.numero_titulo) {
            d.titulo_existe = titulosExistentesSet.has(d.numero_titulo.trim().toLowerCase());
          }
        });
      }

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
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody>
            {titulosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
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
                  <td className="px-4 py-2">
                    <div className="flex gap-1">
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
                          if (!confirm(`Tem certeza que deseja excluir o título "${titulo.numero_titulo}"?`)) {
                            return;
                          }
                          
                          try {
                            const { error } = await supabase
                              .from('titulos_negociados')
                              .update({ ativo: false })
                              .eq('id', titulo.id);

                            if (error) throw error;

                            showToast('Título excluído com sucesso', 'success');
                            loadTitulos();
                          } catch (error: any) {
                            console.error('Erro ao excluir título:', error);
                            showToast('Erro ao excluir título', 'error');
                          }
                        }}
                        className="px-2 py-1 border border-red-300 bg-white hover:bg-red-50 text-red-600 text-xs font-medium"
                        title="Excluir"
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

                {!formParcelamento.valores_iguais && formParcelamento.numero_parcelas && (
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
                  const numeroParcelas = parseInt(formParcelamento.numero_parcelas) || 0;
                  const valoresIguais = formParcelamento.valores_iguais;
                  const temSinal = formParcelamento.tem_sinal;
                  const valorSinal = temSinal ? parseMoneyInput(formParcelamento.valor_sinal) : 0;
                  const valorRestante = valorTotalNegociado - valorSinal;
                  const numeroParcelasRestantes = numeroParcelas - (temSinal ? 1 : 0);
                  const dataPrimeira = formParcelamento.data_primeira_parcela;
                  const intervalo = formParcelamento.intervalo_parcelas;
                  const intervaloDias = formParcelamento.intervalo_dias ? parseInt(formParcelamento.intervalo_dias) : 0;

                  if (!numeroParcelas || !dataPrimeira) return null;

                  // Calcula valores das parcelas
                  let valoresParcelas: number[] = [];
                  
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
                                {parcelasPreview.map((parcela) => (
                                  <tr key={parcela.numero} className={`border-b border-gray-200 ${
                                    temSinal && parcela.numero === 1 ? 'bg-blue-50' : ''
                                  }`}>
                                    <td className="px-2 py-2 border-r border-gray-300 font-medium">
                                      {parcela.numero}
                                      {temSinal && parcela.numero === 1 && (
                                        <span className="ml-1 text-blue-600 font-semibold">(Sinal)</span>
                                      )}
                                    </td>
                                    <td className="px-2 py-2 border-r border-gray-300 font-semibold">
                                      {formatMoney(parcela.valor)}
                                    </td>
                                    <td className="px-2 py-2">
                                      {new Date(parcela.data).toLocaleDateString('pt-BR')}
                                    </td>
                                  </tr>
                                ))}
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
                          diferenca > 1 
                            ? 'bg-red-50 border border-red-200 text-red-800' 
                            : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                        }`}>
                          <strong>Atenção:</strong> A soma das parcelas ({formatMoney(somaParcelas)}) 
                          {somaParcelas < valorTotalNegociado ? ' é menor' : ' é maior'} que o valor total negociado ({formatMoney(valorTotalNegociado)}).
                          Diferença: {formatMoney(diferenca)}
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
                              {item.data_vencimento_original || '—'}
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
    </div>
  );
}

