'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';

export default function MenuFinanceiroPage() {
  const router = useRouter();
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) { router.replace('/login'); return; }
    });
  }, [router]);

  return (
    <main className="min-h-screen p-6 bg-white">
      <div className="container max-w-6xl space-y-6">
        <header className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 rounded-lg border border-[#cbd5e1] hover:bg-[#f0f7ff] transition-colors"
          >
            ←
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[#0369a1]">Financeiro</h1>
            <p className="text-[#64748b]">Gestão financeira e relatórios</p>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Contas a Pagar */}
          <Link href="/contas-pagar" className="group">
            <Card hover className="h-full">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-3xl">💸</div>
                  <div>
                    <h2 className="text-xl font-bold text-[#0369a1]">Contas a Pagar</h2>
                    <p className="text-[#64748b] text-sm">Gestão de despesas</p>
                  </div>
                </div>
                <p className="text-[#64748b] mb-4">
                  Controle de despesas, vencimentos e pagamentos. Fluxo de caixa e planejamento financeiro.
                </p>
                <div className="text-[#0369a1] font-medium group-hover:text-[#075985]">
                  Acessar →
                </div>
              </div>
            </Card>
          </Link>

          {/* A Receber */}
          <Link href="/financeiro/a-receber" className="group">
            <Card hover className="h-full">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-3xl">💰</div>
                  <div>
                    <h2 className="text-xl font-bold text-[#0369a1]">A Receber</h2>
                    <p className="text-[#64748b] text-sm">Gestão de receitas</p>
                  </div>
                </div>
                <p className="text-[#64748b] mb-4">
                  Controle de receitas, vencimentos e cobranças. Acompanhamento de inadimplência.
                </p>
                <div className="text-[#0369a1] font-medium group-hover:text-[#075985]">
                  Acessar →
                </div>
              </div>
            </Card>
          </Link>

          {/* A Pagar */}
          <Link href="/financeiro/a-pagar" className="group">
            <Card hover className="h-full">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-3xl">📋</div>
                  <div>
                    <h2 className="text-xl font-bold text-[#0369a1]">A Pagar</h2>
                    <p className="text-[#64748b] text-sm">Gestão de despesas</p>
                  </div>
                </div>
                <p className="text-[#64748b] mb-4">
                  Gestão detalhada de despesas, categorização e controle de vencimentos.
                </p>
                <div className="text-[#0369a1] font-medium group-hover:text-[#075985]">
                  Acessar →
                </div>
              </div>
            </Card>
          </Link>

          {/* Fluxo de Caixa */}
          <Link href="/financeiro/fluxo-caixa" className="group">
            <Card hover className="h-full">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-3xl">📈</div>
                  <div>
                    <h2 className="text-xl font-bold text-[#0369a1]">Fluxo de Caixa</h2>
                    <p className="text-[#64748b] text-sm">Análise de movimentação</p>
                  </div>
                </div>
                <p className="text-[#64748b] mb-4">
                  Análise de entradas e saídas, projeções e controle de liquidez.
                </p>
                <div className="text-[#0369a1] font-medium group-hover:text-[#075985]">
                  Acessar →
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Relatórios */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-[#0369a1] mb-4">Relatórios Financeiros</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link href="/financeiro/faturamento" className="group">
                <div className="p-4 rounded-lg border border-[#cbd5e1] hover:border-[#0369a1] hover:bg-[#f0f7ff] transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-2xl">📊</div>
                    <h3 className="font-medium text-[#1e293b] group-hover:text-[#0369a1]">Faturamento</h3>
                  </div>
                  <p className="text-sm text-[#64748b]">Análise de receitas e lucros</p>
                </div>
              </Link>
              <Link href="/financeiro/calendario" className="group">
                <div className="p-4 rounded-lg border border-[#cbd5e1] hover:border-[#0369a1] hover:bg-[#f0f7ff] transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-2xl">📅</div>
                    <h3 className="font-medium text-[#1e293b] group-hover:text-[#0369a1]">Calendário</h3>
                  </div>
                  <p className="text-sm text-[#64748b]">Visualização mensal dos lançamentos</p>
                </div>
              </Link>
              <Link href="/financeiro/top-receitas-despesas" className="group">
                <div className="p-4 rounded-lg border border-[#cbd5e1] hover:border-[#0369a1] hover:bg-[#f0f7ff] transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-2xl">🏆</div>
                    <h3 className="font-medium text-[#1e293b] group-hover:text-[#0369a1]">Top Receitas/Despesas</h3>
                  </div>
                  <p className="text-sm text-[#64748b]">Ranking dos maiores lançamentos</p>
                </div>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
