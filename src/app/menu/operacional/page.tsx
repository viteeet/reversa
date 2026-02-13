'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MenuOperacionalPage() {
  const router = useRouter();
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) { router.replace('/login'); return; }
    });
  }, [router]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Header com botão de voltar */}
        <header className="mb-6">
          <button 
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 bg-white border border-gray-300 hover:bg-gray-50 text-[#0369a1] text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
          <div className="border-b-2 border-[#0369a1] pb-3">
            <h1 className="text-3xl font-bold text-[#0369a1] mb-1">Menu Operacional</h1>
            <p className="text-sm text-gray-600">Gestão de Cedentes e Sacados</p>
          </div>
        </header>

        {/* Menu de Opções */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">Opções Disponíveis</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {/* Card Cedentes */}
            <Link href="/cedentes" className="p-4 hover:bg-blue-50 transition-colors border-r border-b border-gray-300 last:border-r-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 flex items-center justify-center border border-gray-300">
                  <svg className="w-5 h-5 text-[#0369a1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#0369a1]">Cedentes</h2>
                  <p className="text-xs text-gray-600">Gerenciar cedentes</p>
                </div>
              </div>
            </Link>

            {/* Card Sacados */}
            <Link href="/sacados" className="p-4 hover:bg-indigo-50 transition-colors border-r border-b border-gray-300 last:border-r-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 flex items-center justify-center border border-gray-300">
                  <svg className="w-5 h-5 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#0369a1]">Sacados</h2>
                  <p className="text-xs text-gray-600">Visualizar sacados</p>
                </div>
              </div>
            </Link>

            {/* Card Pessoas Físicas */}
            <Link href="/pessoas-fisicas" className="p-4 hover:bg-teal-50 transition-colors border-r border-b border-gray-300 last:border-r-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 flex items-center justify-center border border-gray-300">
                  <svg className="w-5 h-5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#0369a1]">Pessoas Físicas</h2>
                  <p className="text-xs text-gray-600">Cadastro de pessoas físicas</p>
                </div>
              </div>
            </Link>

            {/* Card Grupos de Empresas */}
            <Link href="/empresas-grupo" className="p-4 hover:bg-green-50 transition-colors border-r border-b border-gray-300 last:border-r-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 flex items-center justify-center border border-gray-300">
                  <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#0369a1]">Grupos de Empresas</h2>
                  <p className="text-xs text-gray-600">Múltiplos CNPJs</p>
                </div>
              </div>
            </Link>

            {/* Card Atividades Agendadas */}
            <Link href="/atividades-agendadas" className="p-4 hover:bg-purple-50 transition-colors border-r border-b border-gray-300 last:border-r-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 flex items-center justify-center border border-gray-300">
                  <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#0369a1]">Atividades</h2>
                  <p className="text-xs text-gray-600">Agendadas por data</p>
                </div>
              </div>
            </Link>

            {/* Card Acordos Operacionais */}
            <Link href="/operacional/acordos" className="p-4 hover:bg-yellow-50 transition-colors border-r border-b border-gray-300 last:border-r-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 flex items-center justify-center border border-gray-300">
                  <svg className="w-5 h-5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#0369a1]">Acordos</h2>
                  <p className="text-xs text-gray-600">Visão geral de parcelas</p>
                </div>
              </div>
            </Link>

            {/* Card Relatório de Vencidos */}
            <Link href="/relatorios/vencidos" className="p-4 hover:bg-red-50 transition-colors border-r border-b border-gray-300 last:border-r-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 flex items-center justify-center border border-gray-300">
                  <svg className="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#0369a1]">Relatório de Vencidos</h2>
                  <p className="text-xs text-gray-600">Títulos e acordos vencidos</p>
                </div>
              </div>
            </Link>

            {/* Card Relatório BigData */}
            <Link href="/relatorios/bigdata-consultas" className="p-4 hover:bg-blue-50 transition-colors border-r border-b border-gray-300 last:border-r-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 flex items-center justify-center border border-gray-300">
                  <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#0369a1]">Relatório BigData</h2>
                  <p className="text-xs text-gray-600">Consultas à API BigData</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
