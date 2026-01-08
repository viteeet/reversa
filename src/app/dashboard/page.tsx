'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Stats = {
  totalCedentes: number;
  totalSacados: number;
  cedentesAtivos: number;
  cedentesInativos: number;
  aReceber: number;
  aPagar: number;
};

type FluxoCaixaData = {
  data: string;
  receitas: number;
  despesas: number;
  saldo: number;
};

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalCedentes: 0,
    totalSacados: 0,
    cedentesAtivos: 0,
    cedentesInativos: 0,
    aReceber: 0,
    aPagar: 0,
  });
  const [fluxoCaixa, setFluxoCaixa] = useState<FluxoCaixaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodoPreset, setPeriodoPreset] = useState<7 | 30 | 90>(30);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) { router.replace('/login'); return; }
      loadStats();
      loadFluxoCaixa();
    });
  }, [router, periodoPreset]);

  async function loadStats() {
    try {
      setLoading(true);
      
      // Buscar estatísticas dos cedentes
      const { count: totalCedentes } = await supabase
        .from('cedentes')
        .select('*', { count: 'exact', head: true });

      const { count: cedentesAtivos } = await supabase
        .from('cedentes')
        .select('*', { count: 'exact', head: true })
        .eq('situacao', 'ATIVA');

      const { count: cedentesInativos } = await supabase
        .from('cedentes')
        .select('*', { count: 'exact', head: true })
        .neq('situacao', 'ATIVA');

      // Buscar estatísticas dos sacados
      const { count: totalSacados } = await supabase
        .from('sacados')
        .select('*', { count: 'exact', head: true });

      // Buscar contas a receber
      const { data: contasReceber } = await supabase
        .from('contas_receber')
        .select('valor')
        .eq('status', 'pendente');

      // Buscar contas a pagar
      const { data: contasPagar } = await supabase
        .from('contas_pagar')
        .select('valor')
        .eq('status', 'pendente');

      const aReceber = contasReceber?.reduce((sum, c) => sum + (c.valor || 0), 0) || 0;
      const aPagar = contasPagar?.reduce((sum, c) => sum + (c.valor || 0), 0) || 0;

      setStats({
        totalCedentes: totalCedentes || 0,
        totalSacados: totalSacados || 0,
        cedentesAtivos: cedentesAtivos || 0,
        cedentesInativos: cedentesInativos || 0,
        aReceber,
        aPagar,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadFluxoCaixa() {
    try {
      const dataFim = new Date();
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - periodoPreset);

      const { data: lancamentos } = await supabase
        .from('lancamentos')
        .select('*')
        .gte('data_competencia', dataInicio.toISOString().split('T')[0])
        .lte('data_competencia', dataFim.toISOString().split('T')[0]);

      if (!lancamentos) return;

      // Agrupar por data
      const fluxoPorData = new Map<string, { receitas: number; despesas: number }>();
      
      lancamentos.forEach(lanc => {
        const data = lanc.data_competencia.split('T')[0];
        const atual = fluxoPorData.get(data) || { receitas: 0, despesas: 0 };
        
        if (lanc.natureza === 'receita') {
          atual.receitas += lanc.valor || 0;
        } else {
          atual.despesas += lanc.valor || 0;
        }
        
        fluxoPorData.set(data, atual);
      });

      const fluxoData: FluxoCaixaData[] = Array.from(fluxoPorData.entries())
        .map(([data, totais]) => ({
          data,
          receitas: totais.receitas,
          despesas: totais.despesas,
          saldo: totais.receitas - totais.despesas
        }))
        .sort((a, b) => a.data.localeCompare(b.data))
        .slice(-periodoPreset);

      setFluxoCaixa(fluxoData);
    } catch (error) {
      console.error('Erro ao carregar fluxo de caixa:', error);
    }
  }

  const totalReceitas = useMemo(() => fluxoCaixa.reduce((acc, item) => acc + item.receitas, 0), [fluxoCaixa]);
  const totalDespesas = useMemo(() => fluxoCaixa.reduce((acc, item) => acc + item.despesas, 0), [fluxoCaixa]);
  const saldoFinal = totalReceitas - totalDespesas;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="border-b-2 border-[#0369a1] pb-3 mb-6">
          <h1 className="text-3xl font-bold text-[#0369a1]">REVERSA</h1>
          <p className="text-sm text-gray-600 mt-1">Recuperação de Recebíveis e Ativos</p>
        </header>

        {/* Estatísticas em formato tabular */}
        <div className="bg-white border border-gray-300 mb-6">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">Resumo Geral</h2>
          </div>
          <div className="grid grid-cols-4 divide-x divide-gray-300">
            <div className="px-4 py-3">
              <p className="text-xs text-gray-500 uppercase mb-1">Cedentes</p>
              <p className="text-lg font-semibold text-[#0369a1]">
                {stats.totalCedentes}
                <span className="text-xs font-normal text-gray-600 ml-2">
                  ({stats.cedentesAtivos} ativos)
                </span>
              </p>
            </div>
            
            <div className="px-4 py-3">
              <p className="text-xs text-gray-500 uppercase mb-1">Sacados</p>
              <p className="text-lg font-semibold text-[#0369a1]">{stats.totalSacados}</p>
            </div>
            
            <div className="px-4 py-3">
              <p className="text-xs text-gray-500 uppercase mb-1">A Receber</p>
              <p className="text-lg font-semibold text-green-700">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.aReceber)}
              </p>
            </div>
            
            <div className="px-4 py-3">
              <p className="text-xs text-gray-500 uppercase mb-1">A Pagar</p>
              <p className="text-lg font-semibold text-orange-700">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.aPagar)}
              </p>
            </div>
          </div>
        </div>

        {/* Fluxo de Caixa em formato tabular */}
        <div className="bg-white border border-gray-300 mb-6">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 uppercase">Fluxo de Caixa</h3>
            <div className="flex gap-1">
              <button
                onClick={() => setPeriodoPreset(7)}
                className={`px-3 py-1 text-xs font-medium border border-gray-400 ${
                  periodoPreset === 7
                    ? 'bg-[#0369a1] text-white border-[#0369a1]'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                7 dias
              </button>
              <button
                onClick={() => setPeriodoPreset(30)}
                className={`px-3 py-1 text-xs font-medium border border-gray-400 ${
                  periodoPreset === 30
                    ? 'bg-[#0369a1] text-white border-[#0369a1]'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                30 dias
              </button>
              <button
                onClick={() => setPeriodoPreset(90)}
                className={`px-3 py-1 text-xs font-medium border border-gray-400 ${
                  periodoPreset === 90
                    ? 'bg-[#0369a1] text-white border-[#0369a1]'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                90 dias
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-4 divide-x divide-gray-300">
            <div className="px-4 py-3 bg-green-50">
              <p className="text-xs text-gray-500 uppercase mb-1">Receitas</p>
              <p className="text-lg font-semibold text-green-700">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReceitas)}
              </p>
            </div>
            <div className="px-4 py-3 bg-red-50">
              <p className="text-xs text-gray-500 uppercase mb-1">Despesas</p>
              <p className="text-lg font-semibold text-red-700">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDespesas)}
              </p>
            </div>
            <div className={`px-4 py-3 ${saldoFinal >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-xs text-gray-500 uppercase mb-1">Saldo</p>
              <p className={`text-lg font-semibold ${saldoFinal >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldoFinal)}
              </p>
            </div>
            <div className="px-4 py-3 flex items-center justify-end">
              <Link href="/financeiro/fluxo-caixa">
                <button className="text-xs text-[#0369a1] hover:underline font-medium">
                  Ver detalhes →
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Menu Principal - Organizado por Categorias */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
            <h3 className="text-sm font-semibold text-gray-700 uppercase">Menu Principal</h3>
          </div>
          
          <div className="divide-y divide-gray-300">
            {/* Categoria Operacional */}
            <div className="p-4">
              <h4 className="text-xs font-semibold text-gray-600 uppercase mb-3 px-2">Operacional</h4>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                <Link href="/menu/operacional" className="flex items-center gap-3 p-3 border border-gray-300 hover:bg-blue-50 hover:border-[#0369a1] transition-colors">
                  <div className="w-8 h-8 bg-blue-100 flex items-center justify-center border border-gray-300">
                    <span className="text-sm">🏢</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0369a1]">Menu Operacional</p>
                    <p className="text-xs text-gray-600">Cedentes e Sacados</p>
                  </div>
                </Link>

                <Link href="/cedentes" className="flex items-center gap-3 p-3 border border-gray-300 hover:bg-blue-50 hover:border-[#0369a1] transition-colors">
                  <div className="w-8 h-8 bg-blue-100 flex items-center justify-center border border-gray-300">
                    <span className="text-sm">🏢</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0369a1]">Cedentes</p>
                    <p className="text-xs text-gray-600">Gerenciar cadastros</p>
                  </div>
                </Link>

                <Link href="/sacados" className="flex items-center gap-3 p-3 border border-gray-300 hover:bg-indigo-50 hover:border-[#0369a1] transition-colors">
                  <div className="w-8 h-8 bg-indigo-100 flex items-center justify-center border border-gray-300">
                    <span className="text-sm">👥</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0369a1]">Sacados</p>
                    <p className="text-xs text-gray-600">Visualizar todos</p>
                  </div>
                </Link>

                <Link href="/empresas-grupo" className="flex items-center gap-3 p-3 border border-gray-300 hover:bg-green-50 hover:border-[#0369a1] transition-colors">
                  <div className="w-8 h-8 bg-green-100 flex items-center justify-center border border-gray-300">
                    <span className="text-sm">🏭</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0369a1]">Grupos de Empresas</p>
                    <p className="text-xs text-gray-600">Múltiplos CNPJs</p>
                  </div>
                </Link>

                <Link href="/atividades-agendadas" className="flex items-center gap-3 p-3 border border-gray-300 hover:bg-purple-50 hover:border-[#0369a1] transition-colors">
                  <div className="w-8 h-8 bg-purple-100 flex items-center justify-center border border-gray-300">
                    <span className="text-sm">📅</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0369a1]">Atividades</p>
                    <p className="text-xs text-gray-600">Agendadas por data</p>
                  </div>
                </Link>

                <Link href="/operacional/acordos" className="flex items-center gap-3 p-3 border border-gray-300 hover:bg-yellow-50 hover:border-[#0369a1] transition-colors">
                  <div className="w-8 h-8 bg-yellow-100 flex items-center justify-center border border-gray-300">
                    <span className="text-sm">📋</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0369a1]">Acordos</p>
                    <p className="text-xs text-gray-600">Visão geral de parcelas</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Categoria Financeiro */}
            <div className="p-4">
              <h4 className="text-xs font-semibold text-gray-600 uppercase mb-3 px-2">Financeiro</h4>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                <Link href="/menu/financeiro" className="flex items-center gap-3 p-3 border border-gray-300 hover:bg-green-50 hover:border-[#0369a1] transition-colors">
                  <div className="w-8 h-8 bg-green-100 flex items-center justify-center border border-gray-300">
                    <span className="text-sm">💰</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0369a1]">Menu Financeiro</p>
                    <p className="text-xs text-gray-600">Contas e Relatórios</p>
                  </div>
                </Link>

                <Link href="/financeiro/a-receber" className="flex items-center gap-3 p-3 border border-gray-300 hover:bg-green-50 hover:border-[#0369a1] transition-colors">
                  <div className="w-8 h-8 bg-green-100 flex items-center justify-center border border-gray-300">
                    <span className="text-sm">💰</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0369a1]">A Receber</p>
                    <p className="text-xs text-gray-600">Contas pendentes</p>
                  </div>
                </Link>

                <Link href="/financeiro/a-pagar" className="flex items-center gap-3 p-3 border border-gray-300 hover:bg-orange-50 hover:border-[#0369a1] transition-colors">
                  <div className="w-8 h-8 bg-orange-100 flex items-center justify-center border border-gray-300">
                    <span className="text-sm">📤</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0369a1]">A Pagar</p>
                    <p className="text-xs text-gray-600">Contas pendentes</p>
                  </div>
                </Link>

                <Link href="/financeiro/fluxo-caixa" className="flex items-center gap-3 p-3 border border-gray-300 hover:bg-blue-50 hover:border-[#0369a1] transition-colors">
                  <div className="w-8 h-8 bg-blue-100 flex items-center justify-center border border-gray-300">
                    <span className="text-sm">💵</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0369a1]">Fluxo de Caixa</p>
                    <p className="text-xs text-gray-600">Visão financeira</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Categoria Configurações */}
            <div className="p-4">
              <h4 className="text-xs font-semibold text-gray-600 uppercase mb-3 px-2">Configurações</h4>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                <Link href="/menu/configuracoes" className="flex items-center gap-3 p-3 border border-gray-300 hover:bg-purple-50 hover:border-[#0369a1] transition-colors">
                  <div className="w-8 h-8 bg-purple-100 flex items-center justify-center border border-gray-300">
                    <span className="text-sm">⚙️</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0369a1]">Configurações</p>
                    <p className="text-xs text-gray-600">Sistema e Parâmetros</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
