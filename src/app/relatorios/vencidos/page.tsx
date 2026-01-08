'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj, formatMoney } from '@/lib/format';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastContainer';
import TitulosAtividadesManager from '@/components/atividades/TitulosAtividadesManager';
import CobrancaBulkForm from '@/components/atividades/CobrancaBulkForm';
import CriticaBulkForm from '@/components/atividades/CriticaBulkForm';

type TipoVisualizacao = 'cedentes' | 'sacados';
type TipoFiltro = 'todos' | 'titulos' | 'acordos'; // 'titulos' = apenas títulos, 'acordos' = apenas parcelas de acordos

type TituloVencido = {
  id: string;
  cedente_id: string;
  cedente_nome: string;
  cedente_razao_social: string | null;
  fundo: string | null; // Fundo do título
  sacado_cnpj: string;
  sacado_razao_social: string;
  sacado_nome_fantasia: string | null;
  numero_titulo: string;
  valor_original: number;
  valor_atualizado: number;
  data_vencimento_original: string;
  status: string;
  critica: string | null;
};


type AtividadeCobranca = {
  id: string;
  tipo: string;
  descricao: string;
  data_hora: string;
  status: string;
  proxima_acao?: string;
  observacoes?: string;
};

type Demanda = {
  tipo: 'titulo';
  id: string;
  titulo_id: string; // ID do título original
  cedente_id: string;
  cedente_nome: string;
  cedente_razao_social: string | null;
  fundo: string | null; // Fundo do título
  sacado_cnpj: string;
  sacado_razao_social: string;
  sacado_nome_fantasia: string | null;
  numero_titulo: string;
  valor: number;
  data_vencimento: string;
  status: string;
  critica?: string | null;
  dias_vencido: number;
  atividades?: AtividadeCobranca[];
};

export default function RelatorioVencidosPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [tipoVisualizacao, setTipoVisualizacao] = useState<TipoVisualizacao>('cedentes');
  const [filtroTipo, setFiltroTipo] = useState<TipoFiltro>('todos'); // 'todos', 'titulos', 'acordos'
  const [filtroFundo, setFiltroFundo] = useState<string>('all');
  const [filtroData, setFiltroData] = useState<string>('todos'); // 'hoje', 'todos', 'vencidos'
  const [dataFiltro, setDataFiltro] = useState<string>(new Date().toISOString().split('T')[0]);
  const [busca, setBusca] = useState('');
  
  const [fundos, setFundos] = useState<string[]>([]);
  const [titulosVencidos, setTitulosVencidos] = useState<TituloVencido[]>([]);
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [showCobrancaModal, setShowCobrancaModal] = useState(false);
  const [tituloSelecionado, setTituloSelecionado] = useState<Demanda | null>(null);
  const [titulosSelecionados, setTitulosSelecionados] = useState<Set<string>>(new Set());
  const [showCobrancaBulkModal, setShowCobrancaBulkModal] = useState(false);
  const [showCriticaBulkModal, setShowCriticaBulkModal] = useState(false);
  const [usuarioEmail, setUsuarioEmail] = useState<string>('');

  useEffect(() => {
    loadData();
    loadUsuarioEmail();
  }, [tipoVisualizacao, filtroFundo, filtroData, dataFiltro, filtroTipo]);

  async function loadUsuarioEmail() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      setUsuarioEmail(user.email.split('@')[0]); // Pega apenas a parte antes do @
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      // Carregar fundos únicos dos títulos
      const { data: titulosFundosData } = await supabase
        .from('titulos_negociados')
        .select('fundo')
        .not('fundo', 'is', null)
        .neq('fundo', '')
        .eq('ativo', true);

      const fundosUnicos = Array.from(
        new Set((titulosFundosData || []).map((t: any) => t.fundo).filter(Boolean))
      ).sort() as string[];
      setFundos(fundosUnicos);

      // Carregar títulos vencidos
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const dataHoje = hoje.toISOString().split('T')[0];

      let queryTitulos = supabase
        .from('titulos_negociados')
        .select(`
          id,
          cedente_id,
          sacado_cnpj,
          numero_titulo,
          valor_original,
          valor_atualizado,
          data_vencimento_original,
          status,
          critica,
          fundo,
          cedentes!titulos_negociados_cedente_id_fkey (
            id,
            nome,
            razao_social
          ),
          sacados!titulos_negociados_sacado_cnpj_fkey (
            cnpj,
            razao_social,
            nome_fantasia
          )
        `)
        .eq('ativo', true)
        .in('status', ['vencido', 'renegociado', 'titulo_original', 'parcelado']); // Inclui todos os status de títulos ativos

      const { data: titulosData, error: titulosError } = await queryTitulos;

      if (titulosError) {
        console.error('Erro ao buscar títulos:', titulosError);
        showToast('Erro ao carregar títulos', 'error');
      }

      const titulosProcessados: TituloVencido[] = (titulosData || [])
        .map((t: any) => {
          const cedente = Array.isArray(t.cedentes) ? t.cedentes[0] : t.cedentes;
          const sacado = Array.isArray(t.sacados) ? t.sacados[0] : t.sacados;
          
          // Validar se o cedente existe
          if (!cedente || !t.cedente_id) {
            console.warn('Título sem cedente válido:', t.id, t.numero_titulo, t.cedente_id);
          }
          
          return {
            id: t.id,
            cedente_id: t.cedente_id || '',
            cedente_nome: cedente?.nome || 'Sem cedente',
            cedente_razao_social: cedente?.razao_social || null,
            fundo: t.fundo || null,
            sacado_cnpj: t.sacado_cnpj,
            sacado_razao_social: sacado?.razao_social || '',
            sacado_nome_fantasia: sacado?.nome_fantasia || null,
            numero_titulo: t.numero_titulo,
            valor_original: t.valor_original,
            valor_atualizado: t.valor_atualizado,
            data_vencimento_original: t.data_vencimento_original,
            status: t.status,
            critica: t.critica
          };
        })
        .filter((t: TituloVencido) => {
          // Filtrar títulos sem cedente válido
          if (!t.cedente_id || t.cedente_nome === 'Sem cedente') {
            console.warn('Título filtrado por falta de cedente:', t.id, t.numero_titulo);
            return false;
          }
          
          // Filtrar por fundo
          if (filtroFundo !== 'all' && t.fundo !== filtroFundo) {
            return false;
          }
          
          // Filtrar por data
          if (filtroData === 'hoje') {
            return t.data_vencimento_original === dataHoje;
          } else if (filtroData === 'vencidos') {
            return t.data_vencimento_original < dataHoje;
          }
          return true; // 'todos'
        });

      setTitulosVencidos(titulosProcessados);

      // Apenas títulos originais - sem parcelas
      const todasDemandas: Demanda[] = titulosProcessados.map(t => ({
        tipo: 'titulo' as const,
        id: t.id,
        titulo_id: t.id, // ID do título original
        cedente_id: t.cedente_id,
        cedente_nome: t.cedente_nome,
        cedente_razao_social: t.cedente_razao_social,
        fundo: t.fundo,
        sacado_cnpj: t.sacado_cnpj,
        sacado_razao_social: t.sacado_razao_social,
        sacado_nome_fantasia: t.sacado_nome_fantasia,
        numero_titulo: t.numero_titulo,
        valor: t.valor_atualizado,
        data_vencimento: t.data_vencimento_original,
        status: t.status,
        critica: t.critica,
        dias_vencido: Math.floor(
          (new Date().getTime() - new Date(t.data_vencimento_original).getTime()) / 
          (1000 * 60 * 60 * 24)
        ),
        atividades: []
      }));

      // Carregar atividades de cobrança vinculadas diretamente aos títulos
      const titulosIds = todasDemandas.map(d => d.titulo_id);
      const atividadesMap = new Map<string, AtividadeCobranca[]>();
      
      if (titulosIds.length > 0) {
        const { data: atividadesTitulos } = await supabase
          .from('titulos_atividades')
          .select('*')
          .in('titulo_id', titulosIds)
          .order('data_hora', { ascending: false })
          .limit(1000); // Limite para performance

        (atividadesTitulos || []).forEach((atividade: any) => {
          if (!atividadesMap.has(atividade.titulo_id)) {
            atividadesMap.set(atividade.titulo_id, []);
          }
          atividadesMap.get(atividade.titulo_id)!.push({
            id: atividade.id,
            tipo: atividade.tipo,
            descricao: atividade.descricao,
            data_hora: atividade.data_hora,
            status: atividade.status,
            proxima_acao: atividade.proxima_acao,
            observacoes: atividade.observacoes
          });
        });
      }

      // Associar atividades diretamente aos títulos
      const demandasComAtividades = todasDemandas.map(demanda => {
        const atividadesTitulo = atividadesMap.get(demanda.titulo_id) || [];
        
        return {
          ...demanda,
          atividades: atividadesTitulo
            .sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime())
            .slice(0, 5) // Últimas 5 atividades
        };
      });

      setDemandas(demandasComAtividades);

    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      showToast('Erro ao carregar relatório de vencidos', 'error');
    } finally {
      setLoading(false);
    }
  }

  const demandasFiltradas = useMemo(() => {
    let result = demandas;

    // Filtrar por tipo de visualização
    if (tipoVisualizacao === 'cedentes') {
      // Agrupar por cedente
      const agrupado = new Map<string, Demanda[]>();
      result.forEach(d => {
        const key = d.cedente_id;
        if (!agrupado.has(key)) {
          agrupado.set(key, []);
        }
        agrupado.get(key)!.push(d);
      });
      // Retornar todas as demandas (agrupamento será feito na renderização)
      return result;
    } else {
      // Agrupar por sacado
      const agrupado = new Map<string, Demanda[]>();
      result.forEach(d => {
        const key = d.sacado_cnpj;
        if (!agrupado.has(key)) {
          agrupado.set(key, []);
        }
        agrupado.get(key)!.push(d);
      });
      return result;
    }
  }, [demandas, tipoVisualizacao]);

  const demandasAgrupadas = useMemo(() => {
    const agrupado = new Map<string, Demanda[]>();
    
    demandasFiltradas.forEach(d => {
      const key = tipoVisualizacao === 'cedentes' 
        ? d.cedente_id 
        : d.sacado_cnpj;
      
      if (!agrupado.has(key)) {
        agrupado.set(key, []);
      }
      agrupado.get(key)!.push(d);
    });

    return Array.from(agrupado.entries()).map(([key, items]) => ({
      key,
      items,
      total: items.reduce((sum, d) => sum + d.valor, 0),
      nome: tipoVisualizacao === 'cedentes'
        ? items[0].cedente_razao_social || items[0].cedente_nome
        : items[0].sacado_nome_fantasia || items[0].sacado_razao_social,
      fundo: items[0].fundo || null
    }));
  }, [demandasFiltradas, tipoVisualizacao]);

  const totalGeral = useMemo(() => {
    return demandas.reduce((sum, d) => sum + d.valor, 0);
  }, [demandas]);

  const totalHoje = useMemo(() => {
    const hoje = new Date().toISOString().split('T')[0];
    return demandas
      .filter(d => d.data_vencimento === hoje)
      .reduce((sum, d) => sum + d.valor, 0);
  }, [demandas]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-gray-300 p-8 text-center">
            <p className="text-gray-600">Carregando relatório...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Cabeçalho */}
        <div className="bg-white border border-gray-300 p-4">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Relatório de Vencidos</h1>
          
          {/* Filtros */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as TipoFiltro)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos (Títulos + Acordos)</option>
                <option value="titulos">Apenas Títulos</option>
                <option value="acordos">Apenas Acordos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Visualizar por
              </label>
              <select
                value={tipoVisualizacao}
                onChange={(e) => setTipoVisualizacao(e.target.value as TipoVisualizacao)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cedentes">Cedentes</option>
                <option value="sacados">Sacados</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Fundo
              </label>
              <select
                value={filtroFundo}
                onChange={(e) => setFiltroFundo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos os fundos</option>
                {fundos.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Período
              </label>
              <select
                value={filtroData}
                onChange={(e) => setFiltroData(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="hoje">Vencendo hoje</option>
                <option value="vencidos">Vencidos</option>
                <option value="todos">Todos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <Input
                placeholder="Nome, CNPJ..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>

          {/* Resumo Compacto */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="bg-blue-50 border border-blue-200 p-2 rounded">
              <p className="text-xs text-blue-600 uppercase mb-0.5">Total Geral</p>
              <p className="text-sm font-bold text-blue-900">{formatMoney(totalGeral)}</p>
            </div>
            <div className="bg-green-50 border border-green-200 p-2 rounded">
              <p className="text-xs text-green-600 uppercase mb-0.5">Vencendo Hoje</p>
              <p className="text-sm font-bold text-green-900">{formatMoney(totalHoje)}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-2 rounded">
              <p className="text-xs text-gray-600 uppercase mb-0.5">Total Demandas</p>
              <p className="text-sm font-bold text-gray-900">{demandas.length}</p>
            </div>
          </div>
        </div>

        {/* Tabela Compacta Estilo Excel */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-50 px-2 py-1.5">
              <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-gray-700 uppercase">
                {tipoVisualizacao === 'cedentes' ? 'Cedentes com Dívidas' : 'Sacados com Dívidas'} 
                ({demandasAgrupadas.length})
              </h2>
              <div className="flex items-center gap-2">
                {titulosSelecionados.size > 0 && (
                  <>
                    <span className="text-xs text-blue-600 font-medium">
                      {titulosSelecionados.size} selecionado(s)
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowCobrancaBulkModal(true)}
                      className="text-xs px-2 py-1 !text-white"
                    >
                      Cobrança em Massa
                    </Button>
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() => setShowCriticaBulkModal(true)}
                      className="text-xs px-2 py-1 !text-white"
                    >
                      Crítica em Massa
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setTitulosSelecionados(new Set())}
                      className="text-xs px-2 py-1"
                    >
                      Limpar
                    </Button>
                  </>
                )}
                <span className="text-xs text-gray-600">
                  Total: {formatMoney(totalGeral)} | {demandas.length} demanda(s)
                </span>
              </div>
            </div>
          </div>

          {demandasAgrupadas.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              Nenhuma demanda encontrada com os filtros aplicados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-300 sticky top-0">
                  <tr>
                    <th className="px-2 py-1.5 text-center border-r border-gray-300 font-semibold text-gray-700 whitespace-nowrap w-8">
                      <input
                        type="checkbox"
                        checked={titulosSelecionados.size === demandas.length && demandas.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTitulosSelecionados(new Set(demandas.map(d => d.titulo_id)));
                          } else {
                            setTitulosSelecionados(new Set());
                          }
                        }}
                        className="cursor-pointer"
                      />
                    </th>
                    <th className="px-2 py-1.5 text-left border-r border-gray-300 font-semibold text-gray-700 whitespace-nowrap">
                      {tipoVisualizacao === 'cedentes' ? 'Cedente' : 'Sacado'}
                    </th>
                    {tipoVisualizacao === 'cedentes' && (
                      <th className="px-2 py-1.5 text-left border-r border-gray-300 font-semibold text-gray-700 whitespace-nowrap">
                        Sacado
                      </th>
                    )}
                    {tipoVisualizacao === 'cedentes' && (
                      <th className="px-2 py-1.5 text-left border-r border-gray-300 font-semibold text-gray-700 whitespace-nowrap">
                        Fundo
                      </th>
                    )}
                    <th className="px-2 py-1.5 text-left border-r border-gray-300 font-semibold text-gray-700 whitespace-nowrap">
                      Tipo
                    </th>
                    <th className="px-2 py-1.5 text-left border-r border-gray-300 font-semibold text-gray-700 whitespace-nowrap">
                      Título/Parcela
                    </th>
                    <th className="px-2 py-1.5 text-left border-r border-gray-300 font-semibold text-gray-700 whitespace-nowrap">
                      Vencimento
                    </th>
                    <th className="px-2 py-1.5 text-right border-r border-gray-300 font-semibold text-gray-700 whitespace-nowrap">
                      Valor
                    </th>
                    <th className="px-2 py-1.5 text-center border-r border-gray-300 font-semibold text-gray-700 whitespace-nowrap">
                      Dias
                    </th>
                    <th className="px-2 py-1.5 text-left border-r border-gray-300 font-semibold text-gray-700 whitespace-nowrap">
                      Crítica
                    </th>
                    <th className="px-2 py-1.5 text-center border-r border-gray-300 font-semibold text-gray-700 whitespace-nowrap">
                      Atividades
                    </th>
                    <th className="px-2 py-1.5 text-center font-semibold text-gray-700 whitespace-nowrap">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {demandasAgrupadas.flatMap((grupo) => 
                    grupo.items.map((demanda, index) => (
                      <tr 
                        key={demanda.id} 
                        className={`hover:bg-blue-50 border-b border-gray-200 ${titulosSelecionados.has(demanda.titulo_id) ? 'bg-blue-100' : ''}`}
                      >
                        {/* Checkbox */}
                        <td className="px-2 py-1 border-r border-gray-200 text-center">
                          <input
                            type="checkbox"
                            checked={titulosSelecionados.has(demanda.titulo_id)}
                            onChange={(e) => {
                              const newSet = new Set(titulosSelecionados);
                              if (e.target.checked) {
                                newSet.add(demanda.titulo_id);
                              } else {
                                newSet.delete(demanda.titulo_id);
                              }
                              setTitulosSelecionados(newSet);
                            }}
                            className="cursor-pointer"
                          />
                        </td>
                        {/* Cedente/Sacado */}
                        <td className="px-2 py-1 border-r border-gray-200">
                          {index === 0 ? (
                            <div>
                              <Link
                                href={
                                  tipoVisualizacao === 'cedentes'
                                    ? `/cedentes/${grupo.key}`
                                    : `/sacados/${demanda.sacado_cnpj}`
                                }
                                className="text-blue-600 hover:underline font-medium"
                              >
                                {grupo.nome}
                              </Link>
                              {tipoVisualizacao === 'sacados' && (
                                <div className="text-gray-500 text-xs mt-0.5">
                                  {formatCpfCnpj(demanda.sacado_cnpj)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs italic">↳ {grupo.nome}</span>
                          )}
                        </td>
                        
                        {/* Sacado (apenas quando visualizando por cedentes) */}
                        {tipoVisualizacao === 'cedentes' && (
                          <td className="px-2 py-1 border-r border-gray-200">
                            <Link
                              href={`/sacados/${demanda.sacado_cnpj}`}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {demanda.sacado_nome_fantasia || demanda.sacado_razao_social}
                            </Link>
                            <div className="text-gray-500 text-xs mt-0.5">
                              {formatCpfCnpj(demanda.sacado_cnpj)}
                            </div>
                          </td>
                        )}
                        
                        {/* Fundo (apenas para cedentes) */}
                        {tipoVisualizacao === 'cedentes' && (
                          <td className="px-2 py-1 border-r border-gray-200">
                            {index === 0 ? (
                              demanda.fundo ? (
                                <Badge variant="info" size="sm" className="text-xs">
                                  {demanda.fundo}
                                </Badge>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                        )}
                        
                        {/* Tipo */}
                        <td className="px-2 py-1 border-r border-gray-200">
                          {demanda.numero_titulo.startsWith('Acordo -') ? (
                            <Badge variant="info" size="sm" className="text-xs">Acordo</Badge>
                          ) : (
                            <Badge variant="warning" size="sm" className="text-xs">Título</Badge>
                          )}
                        </td>
                        
                        {/* Título/Parcela */}
                        <td className="px-2 py-1 border-r border-gray-200 font-medium">
                          {demanda.numero_titulo.startsWith('Acordo -') 
                            ? demanda.numero_titulo 
                            : `#${demanda.numero_titulo}`}
                        </td>
                        
                        {/* Vencimento */}
                        <td className="px-2 py-1 border-r border-gray-200">
                          {new Date(demanda.data_vencimento).toLocaleDateString('pt-BR')}
                        </td>
                        
                        {/* Valor */}
                        <td className="px-2 py-1 border-r border-gray-200 text-right font-semibold">
                          {formatMoney(demanda.valor)}
                        </td>
                        
                        {/* Dias Vencido */}
                        <td className="px-2 py-1 border-r border-gray-200 text-center">
                          {demanda.dias_vencido > 0 ? (
                            <Badge variant="error" size="sm" className="text-xs">
                              {demanda.dias_vencido}d
                            </Badge>
                          ) : demanda.dias_vencido === 0 ? (
                            <Badge variant="success" size="sm" className="text-xs">
                              Hoje
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        
                        {/* Crítica */}
                        <td className="px-2 py-1 border-r border-gray-200">
                          {demanda.critica ? (
                            <Badge variant="warning" size="sm" className="text-xs">
                              {demanda.critica}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        
                        {/* Atividades */}
                        <td className="px-2 py-1 border-r border-gray-200 text-center">
                          {demanda.atividades && demanda.atividades.length > 0 ? (
                            <span className="text-xs font-medium text-gray-700">
                              {demanda.atividades.length}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        
                        {/* Ações */}
                        <td className="px-2 py-1">
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => {
                                setTituloSelecionado(demanda);
                                setShowCobrancaModal(true);
                              }}
                              className="px-2 py-0.5 text-xs border border-blue-300 bg-white hover:bg-blue-50 text-blue-600 font-medium"
                              title="Registrar Cobrança"
                            >
                              Cobrança
                            </button>
                            <Link
                              href={`/cedentes/${demanda.cedente_id}?titulo=${demanda.titulo_id}&tab=titulos`}
                              className="px-2 py-0.5 text-xs border border-gray-300 bg-white hover:bg-gray-50 text-gray-600 font-medium"
                              title="Ver Detalhes"
                            >
                              Ver
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal de Cobrança */}
        {showCobrancaModal && tituloSelecionado && (
          <Modal
            isOpen={showCobrancaModal}
            onClose={() => {
              setShowCobrancaModal(false);
              setTituloSelecionado(null);
              // Recarregar dados para atualizar atividades
              loadData();
            }}
            title={`Histórico de Cobrança - Título #${tituloSelecionado.numero_titulo}`}
            size="2xl"
          >
            <TitulosAtividadesManager
              tituloId={tituloSelecionado.titulo_id}
              numeroTitulo={tituloSelecionado.numero_titulo}
              sacadoNome={tituloSelecionado.sacado_razao_social || tituloSelecionado.sacado_nome_fantasia || tituloSelecionado.sacado_cnpj}
            />
          </Modal>
        )}
      </div>
    </main>
  );
}

