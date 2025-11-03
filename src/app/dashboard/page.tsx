'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';

export default function Dashboard() {
  const router = useRouter();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) { router.replace('/login'); return; }
    });
  }, [router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <main className="min-h-screen p-6 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container max-w-5xl mx-auto space-y-10">
        <header className="text-center space-y-4 pt-8">
          <h1 className="text-6xl font-black text-[#0369a1] tracking-tight">
            REVERSA
          </h1>
          <p className="text-[#64748b] text-xl">Recuperação de Ativos</p>
        </header>

        {/* Menu Principal - 3 Cards */}
        <div className="grid gap-8 md:grid-cols-3 pt-8">
          <Link href="/menu/operacional" className="group">
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="p-8 text-center space-y-4">
                <div className="text-6xl mb-2">🏢</div>
                <h2 className="text-2xl font-bold text-[#0369a1]">Operacional</h2>
                <p className="text-[#64748b] text-sm leading-relaxed">
                  Gestão de Cedentes com Sacados integrados
                </p>
              </div>
            </div>
          </Link>

          <Link href="/menu/financeiro" className="group">
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="p-8 text-center space-y-4">
                <div className="text-6xl mb-2">💰</div>
                <h2 className="text-2xl font-bold text-[#0369a1]">Financeiro</h2>
                <p className="text-[#64748b] text-sm leading-relaxed">
                  Fluxo de Caixa, Relatórios e Contas
                </p>
              </div>
            </div>
          </Link>

          <Link href="/menu/configuracoes" className="group">
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="p-8 text-center space-y-4">
                <div className="text-6xl mb-2">⚙️</div>
                <h2 className="text-2xl font-bold text-[#0369a1]">Configurações</h2>
                <p className="text-[#64748b] text-sm leading-relaxed">
                  Sistema, Usuários e Parâmetros
                </p>
              </div>
            </div>
          </Link>
        </div>

      </div>
    </main>
  );
}
