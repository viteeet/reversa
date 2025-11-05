'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';

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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <header className="text-center space-y-2 pt-2">
          <h1 className="text-5xl font-black text-[#0369a1] tracking-tight">
            REVERSA
          </h1>
          <p className="text-[#64748b] text-lg font-medium">Recuperação de Recebíveis e Ativos</p>
        </header>

        {/* Estatísticas Compactas */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg"></div>
              <div>
                <p className="text-xs text-[#64748b]">Cedentes</p>
                <p className="text-lg font-bold text-[#0369a1]">
                  {stats.totalCedentes}
                  <span className="text-xs font-normal text-[#64748b] ml-2">
                    ({stats.cedentesAtivos} ativos)
                  </span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg"></div>
              <div>
                <p className="text-xs text-[#64748b]">Sacados</p>
                <p className="text-lg font-bold text-[#0369a1]">{stats.totalSacados}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg"></div>
              <div>
                <p className="text-xs text-[#64748b]">A Receber</p>
                <p className="text-lg font-bold text-green-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.aReceber)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-orange-100 rounded-lg"></div>
              <div>
                <p className="text-xs text-[#64748b]">A Pagar</p>
                <p className="text-lg font-bold text-orange-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.aPagar)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Fluxo de Caixa Compacto */}
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#0369a1]">Fluxo de Caixa</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setPeriodoPreset(7)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    periodoPreset === 7
                      ? 'bg-[#0369a1] text-white'
                      : 'bg-white border border-[#cbd5e1] text-[#64748b] hover:bg-[#f8fafc]'
                  }`}
                >
                  7 dias
                </button>
                <button
                  onClick={() => setPeriodoPreset(30)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    periodoPreset === 30
                      ? 'bg-[#0369a1] text-white'
                      : 'bg-white border border-[#cbd5e1] text-[#64748b] hover:bg-[#f8fafc]'
                  }`}
                >
                  30 dias
                </button>
                <button
                  onClick={() => setPeriodoPreset(90)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    periodoPreset === 90
                      ? 'bg-[#0369a1] text-white'
                      : 'bg-white border border-[#cbd5e1] text-[#64748b] hover:bg-[#f8fafc]'
                  }`}
                >
                  90 dias
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-[#64748b] mb-1">Receitas</p>
                <p className="text-lg font-bold text-green-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReceitas)}
                </p>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-xs text-[#64748b] mb-1">Despesas</p>
                <p className="text-lg font-bold text-red-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDespesas)}
                </p>
              </div>
              <div className={`rounded-lg p-3 ${saldoFinal >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className="text-xs text-[#64748b] mb-1">Saldo</p>
                <p className={`text-lg font-bold ${saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldoFinal)}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/financeiro/fluxo-caixa">
                <button className="text-sm text-[#0369a1] hover:underline font-medium">
                  Ver detalhes →
                </button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Menu Principal - Organizado por Categorias */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-[#0369a1] mb-6">Menu Principal</h3>
          
          <div className="space-y-6">
            {/* Categoria Operacional */}
            <div>
              <h4 className="text-sm font-semibold text-[#64748b] uppercase tracking-wide mb-3">Operacional</h4>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <Link href="/menu/operacional" className="group flex items-center gap-3 p-4 rounded-xl hover:bg-blue-50 transition-all border border-transparent hover:border-blue-200">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-xl">🏢</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#0369a1]">Menu Operacional</p>
                    <p className="text-xs text-[#64748b]">Cedentes e Sacados</p>
                  </div>
                </Link>

                <Link href="/cedentes" className="group flex items-center gap-3 p-4 rounded-xl hover:bg-blue-50 transition-all border border-transparent hover:border-blue-200">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-xl">🏢</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#0369a1]">Cedentes</p>
                    <p className="text-xs text-[#64748b]">Gerenciar cadastros</p>
                  </div>
                </Link>

                <Link href="/sacados" className="group flex items-center gap-3 p-4 rounded-xl hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-200">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-xl">👥</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#0369a1]">Sacados</p>
                    <p className="text-xs text-[#64748b]">Visualizar todos</p>
                  </div>
                </Link>

                <Link href="/atividades-agendadas" className="group flex items-center gap-3 p-4 rounded-xl hover:bg-purple-50 transition-all border border-transparent hover:border-purple-200">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-xl">📅</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#0369a1]">Atividades</p>
                    <p className="text-xs text-[#64748b]">Agendadas por data</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Categoria Financeiro */}
            <div>
              <h4 className="text-sm font-semibold text-[#64748b] uppercase tracking-wide mb-3">Financeiro</h4>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <Link href="/menu/financeiro" className="group flex items-center gap-3 p-4 rounded-xl hover:bg-green-50 transition-all border border-transparent hover:border-green-200">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-xl">💰</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#0369a1]">Menu Financeiro</p>
                    <p className="text-xs text-[#64748b]">Contas e Relatórios</p>
                  </div>
                </Link>

                <Link href="/financeiro/a-receber" className="group flex items-center gap-3 p-4 rounded-xl hover:bg-green-50 transition-all border border-transparent hover:border-green-200">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-xl">💰</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#0369a1]">A Receber</p>
                    <p className="text-xs text-[#64748b]">Contas pendentes</p>
                  </div>
                </Link>

                <Link href="/financeiro/a-pagar" className="group flex items-center gap-3 p-4 rounded-xl hover:bg-orange-50 transition-all border border-transparent hover:border-orange-200">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-xl">📤</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#0369a1]">A Pagar</p>
                    <p className="text-xs text-[#64748b]">Contas pendentes</p>
                  </div>
                </Link>

                <Link href="/financeiro/fluxo-caixa" className="group flex items-center gap-3 p-4 rounded-xl hover:bg-blue-50 transition-all border border-transparent hover:border-blue-200">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-xl">💵</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#0369a1]">Fluxo de Caixa</p>
                    <p className="text-xs text-[#64748b]">Visão financeira</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Categoria Configurações */}
            <div>
              <h4 className="text-sm font-semibold text-[#64748b] uppercase tracking-wide mb-3">Configurações</h4>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <Link href="/menu/configuracoes" className="group flex items-center gap-3 p-4 rounded-xl hover:bg-purple-50 transition-all border border-transparent hover:border-purple-200">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-xl">⚙️</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#0369a1]">Configurações</p>
                    <p className="text-xs text-[#64748b]">Sistema e Parâmetros</p>
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
