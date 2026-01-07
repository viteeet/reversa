'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function FinanceSettingsIndex() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <header className="mb-4">
          <button 
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/menu/configuracoes');
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
            <h1 className="text-3xl font-bold text-[#0369a1] mb-1">Configurações · Financeiro</h1>
            <p className="text-sm text-gray-600">Gestão de configurações financeiras</p>
          </div>
        </header>

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


