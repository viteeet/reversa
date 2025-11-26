'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';

export default function MenuConfiguracoesPage() {
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
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/');
              }
            }}
            className="p-2 rounded-lg border border-[#cbd5e1] hover:bg-[#f0f7ff] transition-colors"
          >
            ←
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[#0369a1]">Configurações</h1>
            <p className="text-[#64748b]">Configurações do sistema e parâmetros</p>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Configurações Gerais */}
          <Link href="/settings" className="group">
            <Card hover className="h-full">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-3xl">⚙️</div>
                  <div>
                    <h2 className="text-xl font-bold text-[#0369a1]">Configurações Gerais</h2>
                    <p className="text-[#64748b] text-sm">Parâmetros do sistema</p>
                  </div>
                </div>
                <p className="text-[#64748b] mb-4">
                  Configurações gerais do sistema, preferências e parâmetros de funcionamento.
                </p>
                <div className="text-[#0369a1] font-medium group-hover:text-[#075985]">
                  Acessar →
                </div>
              </div>
            </Card>
          </Link>

          {/* Configurações Financeiras */}
          <Link href="/settings/finance" className="group">
            <Card hover className="h-full">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-3xl">💳</div>
                  <div>
                    <h2 className="text-xl font-bold text-[#0369a1]">Financeiro</h2>
                    <p className="text-[#64748b] text-sm">Configurações financeiras</p>
                  </div>
                </div>
                <p className="text-[#64748b] mb-4">
                  Categorias, contas, meios de pagamento, recorrências e elementos financeiros.
                </p>
                <div className="text-[#0369a1] font-medium group-hover:text-[#075985]">
                  Acessar →
                </div>
              </div>
            </Card>
          </Link>

          {/* Status */}
          <Link href="/settings/status" className="group">
            <Card hover className="h-full">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-3xl">🏷️</div>
                  <div>
                    <h2 className="text-xl font-bold text-[#0369a1]">Status</h2>
                    <p className="text-[#64748b] text-sm">Gestão de status</p>
                  </div>
                </div>
                <p className="text-[#64748b] mb-4">
                  Configuração de status para sacados, cedentes e transações financeiras.
                </p>
                <div className="text-[#0369a1] font-medium group-hover:text-[#075985]">
                  Acessar →
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Submenus Financeiros */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-[#0369a1] mb-4">Configurações Financeiras Detalhadas</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link href="/settings/finance/categorias" className="group">
                <div className="p-4 rounded-lg border border-[#cbd5e1] hover:border-[#0369a1] hover:bg-[#f0f7ff] transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-2xl">📂</div>
                    <h3 className="font-medium text-[#1e293b] group-hover:text-[#0369a1]">Categorias</h3>
                  </div>
                  <p className="text-sm text-[#64748b]">Categorias de receitas e despesas</p>
                </div>
              </Link>
              <Link href="/settings/finance/contas" className="group">
                <div className="p-4 rounded-lg border border-[#cbd5e1] hover:border-[#0369a1] hover:bg-[#f0f7ff] transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-2xl">🏦</div>
                    <h3 className="font-medium text-[#1e293b] group-hover:text-[#0369a1]">Contas</h3>
                  </div>
                  <p className="text-sm text-[#64748b]">Contas bancárias e carteiras</p>
                </div>
              </Link>
              <Link href="/settings/finance/meios" className="group">
                <div className="p-4 rounded-lg border border-[#cbd5e1] hover:border-[#0369a1] hover:bg-[#f0f7ff] transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-2xl">💳</div>
                    <h3 className="font-medium text-[#1e293b] group-hover:text-[#0369a1]">Meios</h3>
                  </div>
                  <p className="text-sm text-[#64748b]">Meios de pagamento</p>
                </div>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
