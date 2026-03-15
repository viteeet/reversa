'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';

export default function FinanceSettingsIndex() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-4">
        <PageHeader
          title="Configuracoes · Financeiro"
          subtitle="Gestao de configuracoes financeiras"
          backHref="/menu/configuracoes"
          className="mb-4"
        />

        {/* Menu de Opções */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">Opções Disponíveis</h2>
          </div>
          <div className="divide-y divide-gray-300">
            <Link href="/settings/finance/contas" className="block p-4 hover:bg-gray-50 transition-colors border-b border-gray-300 last:border-b-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Contas financeiras</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
            <Link href="/settings/finance/categorias" className="block p-4 hover:bg-gray-50 transition-colors border-b border-gray-300 last:border-b-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Categorias</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
            <Link href="/settings/finance/meios" className="block p-4 hover:bg-gray-50 transition-colors border-b border-gray-300 last:border-b-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Meios de pagamento</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
            <Link href="/settings/finance/elementos" className="block p-4 hover:bg-gray-50 transition-colors border-b border-gray-300 last:border-b-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Elementos</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
            <Link href="/settings/finance/recorrencias" className="block p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Recorrências</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}


