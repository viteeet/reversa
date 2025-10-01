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
    <main className="min-h-screen p-6 bg-white">
      <div className="container max-w-4xl space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-[#0369a1]">REVERSA</h1>
          <p className="text-[#64748b] text-lg">Recuperação de Ativos</p>
        </header>

        {/* Menu Principal - 3 Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Link href="/menu/operacional" className="group">
            <Card hover className="h-full">
              <div className="p-8 text-center">
                <div className="text-4xl mb-4">🏢</div>
                <h2 className="text-2xl font-bold text-[#0369a1] mb-2">Operacional</h2>
                <p className="text-[#64748b]">Sacados, Cedentes e Gestão de Clientes</p>
              </div>
            </Card>
          </Link>

          <Link href="/menu/financeiro" className="group">
            <Card hover className="h-full">
              <div className="p-8 text-center">
                <div className="text-4xl mb-4">💰</div>
                <h2 className="text-2xl font-bold text-[#0369a1] mb-2">Financeiro</h2>
                <p className="text-[#64748b]">Fluxo de Caixa, Relatórios e Contas</p>
              </div>
            </Card>
          </Link>

          <Link href="/menu/configuracoes" className="group">
            <Card hover className="h-full">
              <div className="p-8 text-center">
                <div className="text-4xl mb-4">⚙️</div>
                <h2 className="text-2xl font-bold text-[#0369a1] mb-2">Configurações</h2>
                <p className="text-[#64748b]">Sistema, Usuários e Parâmetros</p>
              </div>
            </Card>
          </Link>
        </div>

      </div>
    </main>
  );
}
