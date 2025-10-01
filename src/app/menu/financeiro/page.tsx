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

        <div className="grid gap-6 md:grid-cols-1">
          {/* Fluxo de Caixa - Único e Completo */}
          <Link href="/contas-pagar" className="group">
            <Card hover className="h-full">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl">💰</div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#0369a1]">Gestão Financeira</h2>
                    <p className="text-[#64748b] text-lg">Fluxo de caixa completo</p>
                  </div>
                </div>
                <p className="text-[#64748b] mb-6 text-lg">
                  Controle completo de receitas, despesas, cobrança e recuperação de ativos. 
                  Gestão de vencimentos, inadimplência, faturamento e análise financeira.
                </p>
                <div className="grid gap-4 sm:grid-cols-3 mb-4">
                  <div className="text-center p-3 bg-[#f0f7ff] rounded-lg">
                    <div className="text-2xl mb-1">📊</div>
                    <div className="text-sm font-medium text-[#0369a1]">Receitas</div>
                  </div>
                  <div className="text-center p-3 bg-[#f0f7ff] rounded-lg">
                    <div className="text-2xl mb-1">💸</div>
                    <div className="text-sm font-medium text-[#0369a1]">Despesas</div>
                  </div>
                  <div className="text-center p-3 bg-[#f0f7ff] rounded-lg">
                    <div className="text-2xl mb-1">📈</div>
                    <div className="text-sm font-medium text-[#0369a1]">Análise</div>
                  </div>
                </div>
                <div className="text-[#0369a1] font-medium group-hover:text-[#075985] text-lg">
                  Acessar Gestão Financeira →
                </div>
              </div>
            </Card>
          </Link>
        </div>

      </div>
    </main>
  );
}
