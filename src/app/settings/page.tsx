'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function SettingsPage() {
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
            <h1 className="text-3xl font-bold text-[#0369a1] mb-1">Configurações</h1>
            <p className="text-sm text-gray-600">Configurações do sistema</p>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Financeiro */}
          <div className="bg-white border border-gray-300">
            <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
              <h2 className="text-sm font-semibold text-gray-700 uppercase">Financeiro</h2>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-gray-600 mb-3">Configurações relacionadas ao fluxo de caixa</p>
              <div className="space-y-2">
                <Link href="/settings/finance/contas" className="block">
                  <Button variant="outline" className="w-full justify-start text-sm">
                    Contas
                  </Button>
                </Link>
                <Link href="/settings/finance/categorias" className="block">
                  <Button variant="outline" className="w-full justify-start text-sm">
                    Categorias
                  </Button>
                </Link>
                <Link href="/settings/finance/meios" className="block">
                  <Button variant="outline" className="w-full justify-start text-sm">
                    Meios de Pagamento
                  </Button>
                </Link>
                <Link href="/settings/finance/elementos" className="block">
                  <Button variant="outline" className="w-full justify-start text-sm">
                    Elementos
                  </Button>
                </Link>
                <Link href="/settings/finance/recorrencias" className="block">
                  <Button variant="outline" className="w-full justify-start text-sm">
                    Recorrências
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Sistema */}
          <div className="bg-white border border-gray-300">
            <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
              <h2 className="text-sm font-semibold text-gray-700 uppercase">Sistema</h2>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-gray-600 mb-3">Configurações gerais do sistema</p>
              <div className="space-y-2">
                <Link href="/settings/status" className="block">
                  <Button variant="outline" className="w-full justify-start text-sm">
                    Status
                  </Button>
                </Link>
                <Link href="/settings/bigdata" className="block">
                  <Button variant="outline" className="w-full justify-start text-sm">
                    🔑 API BigData
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-sm"
                  onClick={() => {
                    // TODO: Implementar perfil do usuário
                    alert('Funcionalidade em desenvolvimento');
                  }}
                >
                  Perfil do Usuário
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-sm"
                  onClick={() => {
                    // TODO: Implementar backup de dados
                    alert('Funcionalidade em desenvolvimento');
                  }}
                >
                  Backup de Dados
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-sm"
                  onClick={() => {
                    alert('Sistema Reversa\nVersão 0.1.0\n\nSistema de gestão financeira e operacional.');
                  }}
                >
                  Sobre o Sistema
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}