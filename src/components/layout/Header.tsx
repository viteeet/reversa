"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";

export default function Header() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const user = data.user;
      setEmail(user?.email ?? null);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <header className="border-b border-gray-200 sticky top-0 z-40 bg-white shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
          Reversa
        </Link>

        {/* Sem menu enquanto carrega ou não autenticado */}
        {(!loading && email) ? (
          <nav className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">Início</Button>
            </Link>
            <Link href="/contas-pagar">
              <Button variant="outline" size="sm">Financeiro</Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" size="sm">Configurações</Button>
            </Link>

            <div className="h-6 w-px bg-slate-300 mx-3" />
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600 hidden sm:inline">Logado como:</span>
              <span className="text-sm font-medium text-slate-800">{email}</span>
              <Button variant="secondary" size="sm" onClick={signOut}>
                Sair
              </Button>
            </div>
          </nav>
        ) : (
          <div />
        )}
      </div>
    </header>
  );
}


