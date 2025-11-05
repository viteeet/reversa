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

        {/* Estatísticas Compactas */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏢</span>
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
              <span className="text-2xl">👥</span>
              <div>
                <p className="text-xs text-[#64748b]">Sacados</p>
                <p className="text-lg font-bold text-[#0369a1]">{stats.totalSacados}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-2xl">💰</span>
              <div>
                <p className="text-xs text-[#64748b]">A Receber</p>
                <p className="text-lg font-bold text-green-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.aReceber)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-2xl">📤</span>
              <div>
                <p className="text-xs text-[#64748b]">A Pagar</p>
                <p className="text-lg font-bold text-orange-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.aPagar)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Principal - Acesso Rápido */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-[#0369a1] mb-4 flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            Menu Principal
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/menu/operacional" className="group flex items-center gap-3 p-4 rounded-xl hover:bg-blue-50 transition-all border border-transparent hover:border-blue-200">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-xl">🏢</span>
              </div>
              <div>
                <p className="font-semibold text-[#0369a1]">Operacional</p>
                <p className="text-xs text-[#64748b]">Cedentes e Sacados</p>
              </div>
            </Link>

            <Link href="/menu/financeiro" className="group flex items-center gap-3 p-4 rounded-xl hover:bg-green-50 transition-all border border-transparent hover:border-green-200">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-xl">💰</span>
              </div>
              <div>
                <p className="font-semibold text-[#0369a1]">Financeiro</p>
                <p className="text-xs text-[#64748b]">Contas e Relatórios</p>
              </div>
            </Link>

            <Link href="/menu/configuracoes" className="group flex items-center gap-3 p-4 rounded-xl hover:bg-purple-50 transition-all border border-transparent hover:border-purple-200">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-xl">⚙️</span>
              </div>
              <div>
                <p className="font-semibold text-[#0369a1]">Configurações</p>
                <p className="text-xs text-[#64748b]">Sistema e Parâmetros</p>
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
