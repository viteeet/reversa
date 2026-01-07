'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import FinanceLineChart from '@/components/financeiro/LineChart';

type FluxoCaixaData = {
  data: string;
  receitas: number;
  despesas: number;
  saldo: number;
  saldo_acumulado: number;
};

type Cedente = {
  id: string;
  nome: string;
  razao_social: string;
};

export default function FluxoCaixaPage() {
  const router = useRouter();
  const [data, setData] = useState<FluxoCaixaData[]>([]);
  const [cedentes, setCedentes] = useState<Cedente[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodoPreset, setPeriodoPreset] = useState<7 | 30 | 90 | 'custom' | null>(30);
  const [periodoCustom, setPeriodoCustom] = useState<{ inicio: string; fim: string }>(() => {
    const hoje = new Date();
    const inicio = new Date(hoje);
    inicio.setDate(inicio.getDate() - 30);
    return {
      inicio: inicio.toISOString().split('T')[0],
      fim: hoje.toISOString().split('T')[0]
    };
  });
  const [filtros, setFiltros] = useState({
    cedente_id: 'todos',
    status: 'pago', // Por padrão, mostra apenas pagos/recebidos
    categoria_id: 'todos'
  });
  const [categorias, setCategorias] = useState<{ id: string; nome: string; natureza: string }[]>([]);
  const [limiteTabela, setLimiteTabela] = useState<'ultimos-7' | 'ultimos-15' | 'ultimos-30' | 'ultimos-60' | 'proximos-7' | 'proximos-15' | 'proximos-30' | 'proximos-60' | 'todos'>('ultimos-30');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) { router.replace('/login'); return; }
      loadCedentes();
      loadCategorias();
    });
  }, [router]);

  useEffect(() => {
    loadData();
  }, [periodoPreset, periodoCustom, filtros.status, filtros.categoria_id]);

  async function loadCedentes() {
    try {
      const { data: cedentesData } = await supabase
        .from('cedentes')
        .select('id, nome, razao_social')
        .order('nome', { ascending: true });
      
      setCedentes(cedentesData || []);
    } catch (error) {
      console.error('Erro ao carregar cedentes:', error);
    }
  }

  async function loadCategorias() {
    try {
      const { data: categoriasData } = await supabase
        .from('categorias')
        .select('id, nome, natureza')
        .order('nome', { ascending: true });
      
      setCategorias(categoriasData || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  }

  const loadData = async () => {
    setLoading(true);
    try {
      let dataFim: Date;
      let dataInicio: Date;
      
      if (periodoPreset === 'custom') {
        dataInicio = new Date(periodoCustom.inicio);
        dataFim = new Date(periodoCustom.fim);
      } else if (periodoPreset) {
        dataFim = new Date();
        dataInicio = new Date();
        dataInicio.setDate(dataInicio.getDate() - periodoPreset);
      } else {
        dataFim = new Date();
        dataInicio = new Date();
        dataInicio.setDate(1);
      }

      let query = supabase
        .from('lancamentos')
        .select('*')
        .gte('data_competencia', dataInicio.toISOString().split('T')[0])
        .lte('data_competencia', dataFim.toISOString().split('T')[0])
        .order('data_competencia', { ascending: true });

      // Filtro por status
      if (filtros.status !== 'todos') {
        query = query.eq('status', filtros.status);
      }

      // Filtro por categoria
      if (filtros.categoria_id !== 'todos') {
        query = query.eq('categoria_id', filtros.categoria_id);
      }

      const { data: lancamentos, error } = await query;

      if (error) {
        // Não loga erro se a tabela não existir
        if (error.code !== 'PGRST116' && error.code !== '42P01' && error.code !== '42501') {
          console.error('Erro ao carregar lançamentos:', error);
        }
        setData([]);
        return;
      }

      // Por enquanto, não filtramos por cedente pois elementos não têm relação direta
      // TODO: Implementar filtro por cedente quando houver relação no banco
      const lancamentosFiltrados = lancamentos || [];

      // Agrupar por data
      const fluxoPorData = new Map<string, { receitas: number; despesas: number }>();
      
      lancamentosFiltrados.forEach(lanc => {
        const data = lanc.data_competencia?.split('T')[0];
        if (!data) return;
        
        const atual = fluxoPorData.get(data) || { receitas: 0, despesas: 0 };
        
        if (lanc.natureza === 'receita') {
          atual.receitas += lanc.valor || 0;
        } else if (lanc.natureza === 'despesa') {
          atual.despesas += lanc.valor || 0;
        }
        
        fluxoPorData.set(data, atual);
      });

      // Criar array com todas as datas do período
      const fluxoData: FluxoCaixaData[] = [];
      const dataAtual = new Date(dataInicio);
      let saldoAcumulado = 0;

      while (dataAtual <= dataFim) {
        const dataStr = dataAtual.toISOString().split('T')[0];
        const totais = fluxoPorData.get(dataStr) || { receitas: 0, despesas: 0 };
        const saldo = totais.receitas - totais.despesas;
        saldoAcumulado += saldo;

        fluxoData.push({
          data: dataStr,
          receitas: totais.receitas,
          despesas: totais.despesas,
          saldo,
          saldo_acumulado: saldoAcumulado
        });

        dataAtual.setDate(dataAtual.getDate() + 1);
      }

      setData(fluxoData);
    } catch (error) {
      // Silenciosamente trata erros - tabela pode não existir ainda
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const totalReceitas = useMemo(() => data.reduce((acc, item) => acc + item.receitas, 0), [data]);
  const totalDespesas = useMemo(() => data.reduce((acc, item) => acc + item.despesas, 0), [data]);
  const saldoFinal = useMemo(() => totalReceitas - totalDespesas, [totalReceitas, totalDespesas]);
  const saldoAcumulado = useMemo(() => data.length > 0 ? data[data.length - 1].saldo_acumulado : 0, [data]);

  const chartData = useMemo(() => {
    return data.map(item => ({
      periodo: new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      receitas: item.receitas,
      despesas: item.despesas,
      saldo: item.saldo,
      saldo_acumulado: item.saldo_acumulado // Adiciona saldo acumulado
    }));
  }, [data]);

  // Dados filtrados para a tabela
  const dadosTabela = useMemo(() => {
    if (limiteTabela === 'todos') return data;
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeStr = hoje.toISOString().split('T')[0];
    
    // Encontrar o índice da data de hoje
    const hojeIndex = data.findIndex(item => item.data === hojeStr);
    
    if (hojeIndex === -1) {
      // Se não encontrar hoje, retorna os últimos registros
      if (limiteTabela.startsWith('ultimos-')) {
        const num = parseInt(limiteTabela.split('-')[1]);
        return data.slice(-num);
      }
      return data;
    }
    
    if (limiteTabela.startsWith('ultimos-')) {
      // Últimos X dias: pega desde hoje para trás
      const num = parseInt(limiteTabela.split('-')[1]);
      return data.slice(Math.max(0, hojeIndex - num + 1), hojeIndex + 1);
    } else if (limiteTabela.startsWith('proximos-')) {
      // Próximos X dias: pega desde hoje para frente
      const num = parseInt(limiteTabela.split('-')[1]);
      return data.slice(hojeIndex, hojeIndex + num);
    }
    
    return data;
  }, [data, limiteTabela]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container max-w-7xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <header className="mb-4">
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/menu/financeiro');
              }
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 bg-white border border-gray-300 hover:bg-gray-50 text-[#0369a1] text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
          <div className="border-b-2 border-[#0369a1] pb-3">
            <h1 className="text-3xl font-bold text-[#0369a1] mb-1">Fluxo de Caixa</h1>
            <p className="text-sm text-gray-600">Análise de entradas e saídas de caixa</p>
          </div>
        </header>

        {/* Cards de Resumo */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">Resumo</h2>
          </div>
          <div className="grid grid-cols-4 divide-x divide-gray-300">
            <div className="px-4 py-3">
              <p className="text-xs text-gray-500 uppercase mb-1">Total Receitas</p>
              <p className="text-lg font-semibold text-green-700">
                {totalReceitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs text-gray-500 uppercase mb-1">Total Despesas</p>
              <p className="text-lg font-semibold text-red-700">
                {totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs text-gray-500 uppercase mb-1">Saldo Final</p>
              <p className={`text-lg font-semibold ${saldoFinal > 0 ? 'text-green-700' : 'text-red-700'}`}>
                {saldoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs text-gray-500 uppercase mb-1">Saldo Acumulado</p>
              <p className={`text-lg font-semibold ${saldoAcumulado > 0 ? 'text-green-700' : 'text-red-700'}`}>
                {saldoAcumulado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>
        </div>

        {/* Presets de Período */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">Período</h2>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-[#64748b]">Período</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPeriodoPreset(7)}
                    className={`px-3 py-1.5 text-xs font-medium border border-gray-300 ${
                      periodoPreset === 7
                        ? 'bg-[#0369a1] text-white border-[#0369a1]'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    7 dias
                  </button>
                  <button
                    onClick={() => setPeriodoPreset(30)}
                    className={`px-3 py-1.5 text-xs font-medium border border-gray-300 ${
                      periodoPreset === 30
                        ? 'bg-[#0369a1] text-white border-[#0369a1]'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    30 dias
                  </button>
                  <button
                    onClick={() => setPeriodoPreset(90)}
                    className={`px-3 py-1.5 text-xs font-medium border border-gray-300 ${
                      periodoPreset === 90
                        ? 'bg-[#0369a1] text-white border-[#0369a1]'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    90 dias
                  </button>
                  <button
                    onClick={() => setPeriodoPreset('custom')}
                    className={`px-3 py-1.5 text-xs font-medium border border-gray-300 ${
                      periodoPreset === 'custom'
                        ? 'bg-[#0369a1] text-white border-[#0369a1]'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Personalizado
                  </button>
                </div>
              </div>
              {periodoPreset === 'custom' && (
                <div className="flex gap-4 items-center">
                  <div>
                    <label className="block text-xs text-[#64748b] mb-1">Data Início</label>
                    <input
                      type="date"
                      value={periodoCustom.inicio}
                      onChange={(e) => setPeriodoCustom({ ...periodoCustom, inicio: e.target.value })}
                      className="px-2 py-1 border border-gray-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Data Fim</label>
                    <input
                      type="date"
                      value={periodoCustom.fim}
                      onChange={(e) => setPeriodoCustom({ ...periodoCustom, fim: e.target.value })}
                      className="px-2 py-1 border border-gray-300 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">Filtros</h2>
          </div>
          <div className="p-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                <select 
                  value={filtros.status}
                  onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 text-sm"
                >
                  <option value="todos">Todos</option>
                  <option value="pago">Pago/Recebido</option>
                  <option value="pendente">Pendente</option>
                  <option value="previsto">Previsto</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Categoria</label>
                <select 
                  value={filtros.categoria_id}
                  onChange={(e) => setFiltros({ ...filtros, categoria_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 text-sm"
                >
                  <option value="todos">Todas as Categorias</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Cedente</label>
                <select 
                  value={filtros.cedente_id}
                  onChange={(e) => setFiltros({ ...filtros, cedente_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 text-sm"
                  disabled
                >
                  <option value="todos">Todos os Cedentes</option>
                  {cedentes.map((cedente) => (
                    <option key={cedente.id} value={cedente.id}>
                      {cedente.nome || cedente.razao_social}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Filtro por cedente em breve</p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" onClick={() => setFiltros({ cedente_id: 'todos', status: 'pago', categoria_id: 'todos' })}>
                Limpar Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Gráfico de Linha */}
        {loading ? (
          <div className="bg-white border border-gray-300">
            <div className="p-6 flex items-center justify-center h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0369a1] mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando dados...</p>
              </div>
            </div>
          </div>
        ) : chartData.length > 0 ? (
          <div className="bg-white border border-gray-300">
            <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
              <h2 className="text-sm font-semibold text-gray-700 uppercase">Evolução do Fluxo de Caixa</h2>
            </div>
            <div className="p-6">
              <FinanceLineChart 
                data={chartData} 
                title="Evolução do Fluxo de Caixa"
                height={400}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-300">
            <div className="p-6 flex items-center justify-center h-[400px]">
              <div className="text-center">
                <p className="text-gray-600 text-lg">Nenhum dado encontrado para o período selecionado</p>
                <p className="text-gray-500 text-sm mt-2">Tente ajustar os filtros ou selecionar outro período</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabela de Dados */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">Fluxo de Caixa Diário</h2>
            <div className="flex items-center gap-2">
              <label className="text-sm text-[#64748b]">Mostrar:</label>
              <select
                value={limiteTabela}
                onChange={(e) => setLimiteTabela(e.target.value as typeof limiteTabela)}
                className="px-3 py-1.5 border border-gray-300 text-sm"
              >
                <optgroup label="Últimos dias">
                  <option value="ultimos-7">Últimos 7 dias</option>
                  <option value="ultimos-15">Últimos 15 dias</option>
                  <option value="ultimos-30">Últimos 30 dias</option>
                  <option value="ultimos-60">Últimos 60 dias</option>
                </optgroup>
                <optgroup label="Próximos dias">
                  <option value="proximos-7">Próximos 7 dias</option>
                  <option value="proximos-15">Próximos 15 dias</option>
                  <option value="proximos-30">Próximos 30 dias</option>
                  <option value="proximos-60">Próximos 60 dias</option>
                </optgroup>
                <option value="todos">Todos</option>
              </select>
            </div>
          </div>
          {loading ? (
            <div className="p-6 flex items-center justify-center h-[200px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0369a1] mx-auto mb-2"></div>
                <p className="text-[#64748b] text-sm">Carregando...</p>
              </div>
            </div>
          ) : dadosTabela.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Data</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Receitas</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Despesas</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Saldo do Dia</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Saldo Acumulado</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosTabela.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 border-b border-gray-300">
                      <td className="px-4 py-2 text-sm font-medium text-gray-900 border-r border-gray-300">
                        {new Date(item.data).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-2 text-sm text-green-700 font-semibold border-r border-gray-300">
                        {item.receitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="px-4 py-2 text-sm text-red-700 font-semibold border-r border-gray-300">
                        {item.despesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className={`px-4 py-2 text-sm font-semibold border-r border-gray-300 ${item.saldo > 0 ? 'text-green-700' : item.saldo < 0 ? 'text-red-700' : 'text-gray-600'}`}>
                        {item.saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className={`px-4 py-2 text-sm font-semibold ${item.saldo_acumulado > 0 ? 'text-green-700' : item.saldo_acumulado < 0 ? 'text-red-700' : 'text-gray-600'}`}>
                        {item.saldo_acumulado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 flex items-center justify-center h-[200px]">
              <div className="text-center">
                <p className="text-gray-600">Nenhum dado encontrado</p>
                <p className="text-gray-500 text-sm mt-1">Ajuste os filtros para ver os dados</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
