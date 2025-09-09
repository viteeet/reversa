'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) { router.replace('/login'); return; }
      setEmail(user.email ?? null);
    });
  }, [router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <main className="min-h-screen p-6">
      <div className="container max-w-5xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-sm muted">Logado como: <b className="not-italic text-[inherit]">{email ?? '...'}</b></p>
          </div>
          <button onClick={signOut} className="btn">Sair</button>
        </header>

        <nav className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Link href="/sacados" className="card p-6 hover:opacity-90 transition-opacity">
            <h2 className="font-semibold text-lg">Sacados</h2>
            <p className="text-sm muted">Cadastro Sacados</p>
          </Link>

          <Link href="/contas-pagar" className="card p-6 hover:opacity-90 transition-opacity">
            <h2 className="font-semibold text-lg">Contas a Pagar</h2>
            <p className="text-sm muted">Fluxo de caixa</p>
          </Link>

          <Link href="/cedentes" className="card p-6 hover:opacity-90 transition-opacity">
            <h2 className="font-semibold text-lg">Cedentes</h2>
            <p className="text-sm muted">Cadastro de cedentes</p>
          </Link>

          {/* espaço reservado para novos atalhos */}
        </nav>
      </div>
    </main>
  );
}
