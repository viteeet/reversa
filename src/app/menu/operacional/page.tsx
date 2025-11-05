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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header com botão de voltar */}
        <header className="mb-12">
          <button 
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-lg bg-white border border-gray-200 hover:border-[#0369a1] hover:bg-blue-50 transition-all shadow-sm hover:shadow-md text-[#0369a1] font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
          <div>
            <h1 className="text-5xl font-bold text-[#0369a1] mb-2">Menu Operacional</h1>
            <p className="text-[#64748b] text-xl">Gestão de Cedentes e seus Sacados</p>
          </div>
        </header>

        {/* Menu de Opções */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {/* Card Principal - Cedentes */}
          <Link href="/cedentes" className="group">
            <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden">
              {/* Efeito de gradiente no hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative p-8">
                {/* Ícone */}
                <div className="w-16 h-16 bg-gradient-to-br from-[#0369a1] to-[#0284c7] rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">🏢</span>
                </div>
                
                {/* Conteúdo */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[#0369a1] mb-2">Cedentes</h2>
                    <p className="text-[#64748b] text-base">Gestão completa de cedentes e seus sacados</p>
                  </div>
                  
                  <p className="text-[#64748b] leading-relaxed text-sm">
                    Cadastro, edição e visualização de cedentes. Consulta de CNPJ, dados complementares e histórico completo.
                  </p>
                  
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="px-3 py-1 bg-blue-50 text-[#0369a1] rounded-lg text-xs font-semibold border border-blue-100">📋 Cadastro</span>
                    <span className="px-3 py-1 bg-blue-50 text-[#0369a1] rounded-lg text-xs font-semibold border border-blue-100">👥 Sacados</span>
                    <span className="px-3 py-1 bg-blue-50 text-[#0369a1] rounded-lg text-xs font-semibold border border-blue-100">🔍 CNPJ</span>
                    <span className="px-3 py-1 bg-blue-50 text-[#0369a1] rounded-lg text-xs font-semibold border border-blue-100">📊 Dados</span>
                  </div>
                  
                  {/* Botão de ação */}
                  <div className="flex items-center gap-2 text-[#0369a1] font-semibold pt-4 border-t border-gray-100">
                    <span>Acessar Cedentes</span>
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Informação adicional */}
        <div className="mt-12 bg-white rounded-2xl border border-blue-100 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">💡</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#0369a1]">Sobre o Sistema</h3>
              <p className="text-[#64748b] leading-relaxed">
                <strong className="text-[#0369a1]">Cedentes</strong> são os clientes principais do sistema. Cada cedente pode ter múltiplos <strong className="text-[#0369a1]">Sacados</strong> associados, permitindo uma gestão completa e organizada de relacionamentos comerciais.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
