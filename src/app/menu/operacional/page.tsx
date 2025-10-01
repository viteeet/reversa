'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';

export default function MenuOperacionalPage() {
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
            <h1 className="text-3xl font-bold text-[#0369a1]">Operacional</h1>
            <p className="text-[#64748b]">Gestão de sacados, cedentes e clientes</p>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Sacados */}
          <Link href="/sacados" className="group">
            <Card hover className="h-full">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-3xl">👥</div>
                  <div>
                    <h2 className="text-xl font-bold text-[#0369a1]">Sacados</h2>
                    <p className="text-[#64748b] text-sm">Gestão de sacados</p>
                  </div>
                </div>
                <p className="text-[#64748b] mb-4">
                  Cadastro, edição e visualização de sacados. Consulta de CNPJ, dados complementares e histórico.
                </p>
                <div className="text-[#0369a1] font-medium group-hover:text-[#075985]">
                  Acessar →
                </div>
              </div>
            </Card>
          </Link>

          {/* Cedentes */}
          <Link href="/cedentes" className="group">
            <Card hover className="h-full">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-3xl">🏢</div>
                  <div>
                    <h2 className="text-xl font-bold text-[#0369a1]">Cedentes</h2>
                    <p className="text-[#64748b] text-sm">Gestão de cedentes</p>
                  </div>
                </div>
                <p className="text-[#64748b] mb-4">
                  Cadastro, edição e visualização de cedentes. Consulta de CNPJ, dados complementares e histórico.
                </p>
                <div className="text-[#0369a1] font-medium group-hover:text-[#075985]">
                  Acessar →
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Funcionalidades Futuras */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-[#0369a1] mb-4">Funcionalidades em Desenvolvimento</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 rounded-lg bg-[#f1f5f9] opacity-60">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl">📋</div>
                  <h3 className="font-medium text-[#64748b]">Contratos</h3>
                </div>
                <p className="text-sm text-[#64748b]">Gestão de contratos e documentos</p>
              </div>
              <div className="p-4 rounded-lg bg-[#f1f5f9] opacity-60">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl">📞</div>
                  <h3 className="font-medium text-[#64748b]">Atendimento</h3>
                </div>
                <p className="text-sm text-[#64748b]">Central de atendimento</p>
              </div>
              <div className="p-4 rounded-lg bg-[#f1f5f9] opacity-60">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl">📊</div>
                  <h3 className="font-medium text-[#64748b]">Relatórios</h3>
                </div>
                <p className="text-sm text-[#64748b]">Relatórios operacionais</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
