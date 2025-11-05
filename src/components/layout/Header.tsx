"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import NotificationBell from "@/components/notifications/NotificationBell";

export default function Header() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    <header className="reversa-header sticky top-0 z-40" style={{display: 'block', visibility: 'visible'}}>
      <div className="container flex h-16 items-center justify-between">
        <Link href="/dashboard" className="reversa-logo" style={{display: 'block', visibility: 'visible'}}>
          REVERSA
        </Link>

        {/* Menu Hambúrguer */}
        {(!loading && email) ? (
          <div className="flex items-center gap-2">
            {/* Notificações */}
            <NotificationBell />
            
            {/* Botão Menu Hambúrguer */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors"
            >
                     <div className="w-6 h-6 flex flex-col justify-center items-center gap-1">
                       <div
                         className={`w-5 h-0.5 bg-white transition-all duration-300 ${
                           isMenuOpen ? 'rotate-45 translate-y-1.5' : ''
                         }`}
                       />
                       <div
                         className={`w-5 h-0.5 bg-white transition-all duration-300 ${
                           isMenuOpen ? 'opacity-0' : ''
                         }`}
                       />
                       <div
                         className={`w-5 h-0.5 bg-white transition-all duration-300 ${
                           isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
                         }`}
                       />
                     </div>
                   </button>
                 </div>
               ) : (
                 <div />
               )}

        {/* Menu Dropdown */}
        {isMenuOpen && (
          <div 
            className="absolute top-16 right-4 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
            style={{ animation: 'slideDown 0.2s ease-out' }}
          >
            <div className="p-2">
              <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="text-xl">🏠</div>
                  <div>
                    <div className="font-semibold text-gray-900">Início</div>
                    <div className="text-sm text-gray-500">Dashboard principal</div>
                  </div>
                </div>
              </Link>
              
              <Link href="/busca" onClick={() => setIsMenuOpen(false)}>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="text-xl">🔍</div>
                  <div>
                    <div className="font-semibold text-gray-900">Busca</div>
                    <div className="text-sm text-gray-500">Busca global</div>
                  </div>
                </div>
              </Link>
              
              {/* Seção Operacional */}
              <div className="px-3 py-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-lg">🏢</div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Operacional</div>
                </div>
                <Link href="/menu/operacional" onClick={() => setIsMenuOpen(false)}>
                  <div className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="text-lg">📋</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-700">Menu Operacional</div>
                      <div className="text-xs text-gray-500">Cedentes e Sacados</div>
                    </div>
                  </div>
                </Link>
                <Link href="/cedentes" onClick={() => setIsMenuOpen(false)}>
                  <div className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="text-lg">🏢</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-700">Cedentes</div>
                      <div className="text-xs text-gray-500">Gerenciar cadastros</div>
                    </div>
                  </div>
                </Link>
                <Link href="/sacados" onClick={() => setIsMenuOpen(false)}>
                  <div className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="text-lg">👥</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-700">Sacados</div>
                      <div className="text-xs text-gray-500">Visualizar todos</div>
                    </div>
                  </div>
                </Link>
                <Link href="/atividades-agendadas" onClick={() => setIsMenuOpen(false)}>
                  <div className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="text-lg">📅</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-700">Atividades</div>
                      <div className="text-xs text-gray-500">Agendadas por data</div>
                    </div>
                  </div>
                </Link>
              </div>
              
              {/* Seção Financeiro */}
              <div className="px-3 py-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-lg">💰</div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Financeiro</div>
                </div>
                <Link href="/menu/financeiro" onClick={() => setIsMenuOpen(false)}>
                  <div className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="text-lg">💰</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-700">Menu Financeiro</div>
                      <div className="text-xs text-gray-500">Contas e Relatórios</div>
                    </div>
                  </div>
                </Link>
                <Link href="/financeiro/a-receber" onClick={() => setIsMenuOpen(false)}>
                  <div className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="text-lg">💰</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-700">A Receber</div>
                      <div className="text-xs text-gray-500">Contas pendentes</div>
                    </div>
                  </div>
                </Link>
                <Link href="/contas-pagar" onClick={() => setIsMenuOpen(false)}>
                  <div className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="text-lg">📤</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-700">A Pagar</div>
                      <div className="text-xs text-gray-500">Contas pendentes</div>
                    </div>
                  </div>
                </Link>
                <Link href="/financeiro/fluxo-caixa" onClick={() => setIsMenuOpen(false)}>
                  <div className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="text-lg">💵</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-700">Fluxo de Caixa</div>
                      <div className="text-xs text-gray-500">Visão financeira</div>
                    </div>
                  </div>
                </Link>
              </div>
              
              <Link href="/menu/configuracoes" onClick={() => setIsMenuOpen(false)}>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="text-xl">⚙️</div>
                  <div>
                    <div className="font-semibold text-gray-900">Configurações</div>
                    <div className="text-sm text-gray-500">Sistema e Parâmetros</div>
                  </div>
                </div>
              </Link>

                     <div className="border-t border-gray-200 my-2" />

                     <div className="px-3 py-2">
                       <div className="text-xs text-gray-500 font-medium">Logado como:</div>
                       <div className="text-sm text-gray-700 mb-3">{email}</div>
                       
                       {/* Botão Sair */}
                       <button
                         onClick={signOut}
                         className="w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm border"
                         style={{
                           backgroundColor: '#ef4444',
                           color: '#ffffff',
                           borderColor: '#dc2626',
                           fontWeight: '600'
                         }}
                         onMouseEnter={(e) => {
                           e.currentTarget.style.backgroundColor = '#dc2626';
                           e.currentTarget.style.borderColor = '#b91c1c';
                         }}
                         onMouseLeave={(e) => {
                           e.currentTarget.style.backgroundColor = '#ef4444';
                           e.currentTarget.style.borderColor = '#dc2626';
                         }}
                       >
                         Sair
                       </button>
                     </div>
            </div>
          </div>
        )}

        {/* Overlay para fechar o menu */}
        {isMenuOpen && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </div>
    </header>
  );
}


