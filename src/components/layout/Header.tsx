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
    <header className="reversa-header sticky top-0 z-40">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/dashboard" className="reversa-logo">
          REVERSA
        </Link>

        {/* Sem menu enquanto carrega ou não autenticado */}
        {(!loading && email) ? (
          <nav className="flex items-center gap-2">
            <Link href="/dashboard">
              <button className="px-4 py-2 text-sm font-medium bg-white text-[#0369a1] hover:bg-white/90 rounded-lg transition-colors shadow-sm">
                Início
              </button>
            </Link>
            <Link href="/contas-pagar">
              <button className="px-4 py-2 text-sm font-medium bg-white text-[#0369a1] hover:bg-white/90 rounded-lg transition-colors shadow-sm">
                Financeiro
              </button>
            </Link>
            <Link href="/settings">
              <button className="px-4 py-2 text-sm font-medium bg-white text-[#0369a1] hover:bg-white/90 rounded-lg transition-colors shadow-sm">
                Configurações
              </button>
            </Link>

            <div className="h-6 w-px bg-white/40 mx-3" />
            <div className="flex items-center gap-3">
              <span className="text-sm text-white hidden sm:inline">Logado como:</span>
              <span className="text-sm font-semibold text-white">{email}</span>
              <button 
                onClick={signOut}
                className="px-4 py-2 text-sm font-semibold bg-white text-[#0369a1] hover:bg-white/90 rounded-lg transition-colors shadow-sm"
              >
                Sair
              </button>
            </div>
          </nav>
        ) : (
          <div />
        )}
      </div>
    </header>
  );
}


