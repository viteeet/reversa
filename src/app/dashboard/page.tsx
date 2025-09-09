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
    <main className="min-h-screen p-6">
      <div className="container max-w-6xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">INÍCIO</h1>
          <p className="text-slate-600 text-lg">Escolha um módulo para começar</p>
        </header>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">Operacional</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/sacados">
              <Card hover className="h-full">
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-slate-800">Sacados</h3>
                  <p className="text-slate-600">Cadastro e gestão de sacados</p>
                </div>
              </Card>
            </Link>
            <Link href="/cedentes">
              <Card hover className="h-full">
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-slate-800">Cedentes</h3>
                  <p className="text-slate-600">Cadastro e gestão de cedentes</p>
                </div>
              </Card>
            </Link>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">Financeiro</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/contas-pagar">
              <Card hover className="h-full">
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-slate-800">Fluxo de Caixa</h3>
                  <p className="text-slate-600">Controle de receitas e despesas</p>
                </div>
              </Card>
            </Link>
            <Link href="/financeiro/faturamento">
              <Card hover className="h-full">
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-slate-800">Faturamento</h3>
                  <p className="text-slate-600">Análise de receitas e lucros</p>
                </div>
              </Card>
            </Link>
            <Link href="/financeiro/top-receitas-despesas">
              <Card hover className="h-full">
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-slate-800">Top Receitas/Despesas</h3>
                  <p className="text-slate-600">Ranking dos maiores lançamentos</p>
                </div>
              </Card>
            </Link>
            <Link href="/financeiro/calendario">
              <Card hover className="h-full">
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-slate-800">Calendário</h3>
                  <p className="text-slate-600">Visualização mensal dos lançamentos</p>
                </div>
              </Card>
            </Link>
            <Link href="/financeiro/fluxo-caixa">
              <Card hover className="h-full">
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-slate-800">Fluxo de Caixa</h3>
                  <p className="text-slate-600">Análise de entradas e saídas</p>
                </div>
              </Card>
            </Link>
            <Link href="/financeiro/a-receber">
              <Card hover className="h-full">
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-slate-800">A Receber</h3>
                  <p className="text-slate-600">Gestão de receitas</p>
                </div>
              </Card>
            </Link>
            <Link href="/financeiro/a-pagar">
              <Card hover className="h-full">
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-slate-800">A Pagar</h3>
                  <p className="text-slate-600">Gestão de despesas</p>
                </div>
              </Card>
            </Link>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">Configurações</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/settings">
              <Card hover className="h-full">
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-slate-800">Configurações</h3>
                  <p className="text-slate-600">Configurações do sistema</p>
                </div>
              </Card>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
