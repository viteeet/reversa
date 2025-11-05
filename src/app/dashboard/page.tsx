'use client';

import { useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) { router.replace('/login'); return; }
      loadStats();
    });
  }, [router]);

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <header className="text-center space-y-3 pt-6">
          <h1 className="text-6xl font-black text-[#0369a1] tracking-tight animate-fade-in">
            REVERSA
          </h1>
          <p className="text-[#64748b] text-xl font-medium">Recuperação de Recebíveis e Ativos</p>
          <div className="flex items-center justify-center gap-2 text-sm text-[#64748b]">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Sistema Online</span>
          </div>
        </header>

        {/* Estatísticas Rápidas */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Cedentes */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">🏢</span>
              </div>
              {loading && <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#64748b]">Total de Cedentes</p>
              <p className="text-3xl font-bold text-[#0369a1]">{stats.totalCedentes}</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-green-600 font-medium">✓ {stats.cedentesAtivos} ativos</span>
                {stats.cedentesInativos > 0 && (
                  <span className="text-gray-500">• {stats.cedentesInativos} inativos</span>
                )}
              </div>
            </div>
          </div>

          {/* Total Sacados */}
          <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">👥</span>
              </div>
              {loading && <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div>}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#64748b]">Total de Sacados</p>
              <p className="text-3xl font-bold text-[#0369a1]">{stats.totalSacados}</p>
              <p className="text-xs text-[#64748b]">Cadastrados no sistema</p>
            </div>
          </div>

          {/* Contas a Receber */}
          <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">💰</span>
              </div>
              {loading && <div className="animate-spin w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full"></div>}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#64748b]">A Receber</p>
              <p className="text-3xl font-bold text-green-600">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.aReceber)}
              </p>
              <p className="text-xs text-[#64748b]">Pendente de recebimento</p>
            </div>
          </div>

          {/* Contas a Pagar */}
          <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">📤</span>
              </div>
              {loading && <div className="animate-spin w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full"></div>}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#64748b]">A Pagar</p>
              <p className="text-3xl font-bold text-orange-600">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.aPagar)}
              </p>
              <p className="text-xs text-[#64748b]">Pendente de pagamento</p>
            </div>
          </div>
        </div>

        {/* Menu Principal - 3 Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Link href="/menu/operacional" className="group">
            <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[#0369a1] to-[#0284c7] rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-4xl">🏢</span>
                </div>
                <h2 className="text-2xl font-bold text-[#0369a1] mb-3">Operacional</h2>
                <p className="text-[#64748b] text-sm leading-relaxed mb-4">
                  Gestão de Cedentes com Sacados integrados
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-blue-50 text-[#0369a1] rounded-lg text-xs font-semibold border border-blue-100">Cedentes</span>
                  <span className="px-3 py-1 bg-blue-50 text-[#0369a1] rounded-lg text-xs font-semibold border border-blue-100">Sacados</span>
                </div>
                <div className="flex items-center gap-2 text-[#0369a1] font-semibold text-sm pt-4 border-t border-gray-100">
                  <span>Acessar</span>
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/menu/financeiro" className="group">
            <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-4xl">💰</span>
                </div>
                <h2 className="text-2xl font-bold text-[#0369a1] mb-3">Financeiro</h2>
                <p className="text-[#64748b] text-sm leading-relaxed mb-4">
                  Fluxo de Caixa, Relatórios e Contas
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-semibold border border-green-200">Contas</span>
                  <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-semibold border border-green-200">Relatórios</span>
                </div>
                <div className="flex items-center gap-2 text-[#0369a1] font-semibold text-sm pt-4 border-t border-gray-100">
                  <span>Acessar</span>
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/menu/configuracoes" className="group">
            <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-violet-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-violet-600 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-4xl">⚙️</span>
                </div>
                <h2 className="text-2xl font-bold text-[#0369a1] mb-3">Configurações</h2>
                <p className="text-[#64748b] text-sm leading-relaxed mb-4">
                  Sistema, Usuários e Parâmetros
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-semibold border border-purple-200">Sistema</span>
                  <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-semibold border border-purple-200">Usuários</span>
                </div>
                <div className="flex items-center gap-2 text-[#0369a1] font-semibold text-sm pt-4 border-t border-gray-100">
                  <span>Acessar</span>
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Acesso Rápido */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-[#0369a1] mb-4 flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            Acesso Rápido
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          </div>
        </div>
      </div>
    </main>
  );
}
