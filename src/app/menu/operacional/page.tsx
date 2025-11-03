'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import RelatoriosExport from '@/components/relatorios/RelatoriosExport';

export default function MenuOperacionalPage() {
  const router = useRouter();
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) { router.replace('/login'); return; }
    });
  }, [router]);

  return (
    <main className="min-h-screen p-6 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container max-w-5xl mx-auto space-y-8">
        <header className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-white border border-gray-200 hover:border-[#0369a1] hover:bg-blue-50 transition-all shadow-sm"
          >
            <span className="text-xl text-[#0369a1]">←</span>
          </button>
          <div>
            <h1 className="text-4xl font-bold text-[#0369a1]">Operacional</h1>
            <p className="text-[#64748b] text-lg">Gestão de Cedentes e seus Sacados</p>
          </div>
        </header>

        {/* Layout em duas colunas: Cedentes (esquerda) | Info (direita) */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Card Principal - Cedentes */}
          <Link href="/cedentes" className="block group">
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 border border-gray-100">
              <div className="p-7">
                <div className="flex items-start gap-5">
                  <div className="text-5xl">🏢</div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h2 className="text-2xl font-bold text-[#0369a1] mb-1">Cedentes</h2>
                      <p className="text-[#64748b]">Gestão completa de cedentes</p>
                    </div>
                    <p className="text-[#64748b] leading-relaxed text-sm">
                      Cadastro, edição e visualização de cedentes. Consulta de CNPJ, dados complementares e histórico.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2.5 py-1 bg-blue-50 text-[#0369a1] rounded-md text-xs font-semibold border border-blue-100">📋 Cadastro</span>
                      <span className="px-2.5 py-1 bg-blue-50 text-[#0369a1] rounded-md text-xs font-semibold border border-blue-100">👥 Sacados</span>
                      <span className="px-2.5 py-1 bg-blue-50 text-[#0369a1] rounded-md text-xs font-semibold border border-blue-100">🔍 CNPJ</span>
                      <span className="px-2.5 py-1 bg-blue-50 text-[#0369a1] rounded-md text-xs font-semibold border border-blue-100">📊 Dados</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#0369a1] font-semibold pt-1">
                      <span>Acessar</span>
                      <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Info Box */}
          <div className="bg-white rounded-xl border border-blue-100 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-[#0369a1]">Estrutura do Sistema</h3>
                <p className="text-[#64748b] leading-relaxed text-sm">
                  <strong className="text-[#0369a1]">Cedentes</strong> são os clientes principais. Cada cedente pode ter múltiplos <strong className="text-[#0369a1]">Sacados</strong> associados.
                </p>
                <p className="text-[#64748b] leading-relaxed text-sm">
                  <span className="text-[#0369a1]">→</span> Acesse um cedente para gerenciar seus sacados.
                </p>
              </div>
            </div>
          </div>
        </div>

  {/* Relatórios de Atividades */}
  <RelatoriosExport />

      </div>
    </main>
  );
}
