'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';

export default function MenuConfiguracoesPage() {
  const router = useRouter();
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) { router.replace('/login'); return; }
    });
  }, [router]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container max-w-6xl mx-auto px-4 py-6 space-y-4">
        <PageHeader
          title="Configuracoes"
          subtitle="Configuracoes do sistema e parametros"
          backHref="/dashboard"
          className="mb-4"
        />

        {/* Menu Principal */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">Opções Principais</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y divide-x-0 md:divide-y-0 md:divide-x divide-gray-300">
            <Link href="/settings" className="p-4 hover:bg-gray-50 transition-colors border-r-0 md:border-r border-gray-300">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-gray-100 border border-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700">
                  CG
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-[#0369a1] mb-1">Configurações Gerais</h2>
                  <p className="text-xs text-gray-600 mb-2">Parâmetros do sistema</p>
                  <p className="text-xs text-gray-500">
                    Configurações gerais do sistema, preferências e parâmetros de funcionamento.
                  </p>
                </div>
              </div>
            </Link>

            <Link href="/settings/finance" className="p-4 hover:bg-gray-50 transition-colors border-r-0 md:border-r border-gray-300">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-gray-100 border border-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700">
                  FI
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-[#0369a1] mb-1">Financeiro</h2>
                  <p className="text-xs text-gray-600 mb-2">Configurações financeiras</p>
                  <p className="text-xs text-gray-500">
                    Categorias, contas, meios de pagamento, recorrências e elementos financeiros.
                  </p>
                </div>
              </div>
            </Link>

            <Link href="/settings/status" className="p-4 hover:bg-gray-50 transition-colors border-r-0 md:border-r border-gray-300">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-gray-100 border border-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700">
                  ST
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-[#0369a1] mb-1">Status</h2>
                  <p className="text-xs text-gray-600 mb-2">Gestão de status</p>
                  <p className="text-xs text-gray-500">
                    Configuração de status para sacados, cedentes e transações financeiras.
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Submenus Financeiros */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">Configurações Financeiras Detalhadas</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y divide-x-0 sm:divide-y-0 sm:divide-x divide-gray-300">
            <Link href="/settings/finance/categorias" className="p-4 hover:bg-gray-50 transition-colors border-r-0 sm:border-r border-gray-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 border border-gray-300 flex items-center justify-center text-[10px] font-semibold text-gray-700">
                  CA
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Categorias</h3>
                  <p className="text-xs text-gray-600">Categorias de receitas e despesas</p>
                </div>
              </div>
            </Link>
            <Link href="/settings/finance/contas" className="p-4 hover:bg-gray-50 transition-colors border-r-0 sm:border-r border-gray-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 border border-gray-300 flex items-center justify-center text-[10px] font-semibold text-gray-700">
                  CO
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Contas</h3>
                  <p className="text-xs text-gray-600">Contas bancárias e carteiras</p>
                </div>
              </div>
            </Link>
            <Link href="/settings/finance/meios" className="p-4 hover:bg-gray-50 transition-colors border-r-0 sm:border-r border-gray-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 border border-gray-300 flex items-center justify-center text-[10px] font-semibold text-gray-700">
                  MP
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Meios</h3>
                  <p className="text-xs text-gray-600">Meios de pagamento</p>
                </div>
              </div>
            </Link>
            <Link href="/settings/finance/recorrencias" className="p-4 hover:bg-gray-50 transition-colors border-r-0 sm:border-r border-gray-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 border border-gray-300 flex items-center justify-center text-[10px] font-semibold text-gray-700">
                  RC
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Recorrências</h3>
                  <p className="text-xs text-gray-600">Lançamentos recorrentes</p>
                </div>
              </div>
            </Link>
            <Link href="/settings/finance/elementos" className="p-4 hover:bg-gray-50 transition-colors border-r-0 sm:border-r border-gray-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 border border-gray-300 flex items-center justify-center text-[10px] font-semibold text-gray-700">
                  EL
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Elementos</h3>
                  <p className="text-xs text-gray-600">Elementos financeiros</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
