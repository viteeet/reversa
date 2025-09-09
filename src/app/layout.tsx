import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Reversa",
    template: "%s | Reversa",
  },
  description: "Gestão minimalista de sacados e dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="border-b sticky top-0 z-40 bg-[var(--background)]/80 backdrop-blur">
          <div className="container flex h-14 items-center justify-between">
            <Link href="/dashboard" className="font-semibold">Reversa</Link>
            <nav className="flex items-center gap-1">
              <div className="relative group">
                <button className="btn btn-ghost h-9 px-3" type="button">Operacional</button>
                <div className="absolute hidden group-hover:block top-full left-0 mt-1 card p-2 min-w-56">
                  <div className="flex flex-col">
                    <Link href="/dashboard" className="btn btn-ghost justify-start h-9 px-3">Dashboard</Link>
                    <Link href="/sacados" className="btn btn-ghost justify-start h-9 px-3">Sacados</Link>
                    <Link href="/cedentes" className="btn btn-ghost justify-start h-9 px-3">Cedentes</Link>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <button className="btn btn-ghost h-9 px-3" type="button">Financeiro</button>
                <div className="absolute hidden group-hover:block top-full left-0 mt-1 card p-2 min-w-56">
                  <div className="flex flex-col">
                    <Link href="/finance" className="btn btn-ghost justify-start h-9 px-3">Fluxo de Caixa</Link>
                    <Link href="/finance/agenda" className="btn btn-ghost justify-start h-9 px-3">Agenda</Link>
                    <Link href="/finance/dashboard" className="btn btn-ghost justify-start h-9 px-3">Dashboard Financeiro</Link>
                    <Link href="/contas-pagar" className="btn btn-ghost justify-start h-9 px-3">Contas a Pagar</Link>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <button className="btn btn-ghost h-9 px-3" type="button">Configurações</button>
                <div className="absolute hidden group-hover:block top-full left-0 mt-1 card p-2 min-w-56">
                  <div className="flex flex-col">
                    <div className="px-3 py-1 text-xs uppercase muted">Geral</div>
                    <Link href="/settings/status" className="btn btn-ghost justify-start h-9 px-3">Status do Sacado</Link>
                    <div className="px-3 pt-3 pb-1 text-xs uppercase muted">Financeiro</div>
                    <Link href="/settings/finance/contas" className="btn btn-ghost justify-start h-9 px-3">Contas</Link>
                    <Link href="/settings/finance/categorias" className="btn btn-ghost justify-start h-9 px-3">Categorias</Link>
                    <Link href="/settings/finance/meios" className="btn btn-ghost justify-start h-9 px-3">Meios de Pagamento</Link>
                    <Link href="/settings/finance/elementos" className="btn btn-ghost justify-start h-9 px-3">Elementos</Link>
                    <Link href="/settings/finance/recorrencias" className="btn btn-ghost justify-start h-9 px-3">Recorrências</Link>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
