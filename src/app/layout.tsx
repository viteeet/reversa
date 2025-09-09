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
              <Link href="/dashboard" className="btn btn-ghost h-9 px-3">Dashboard</Link>
              <Link href="/sacados" className="btn btn-ghost h-9 px-3">Sacados</Link>
              <Link href="/contas-pagar" className="btn btn-ghost h-9 px-3">Contas a Pagar</Link>
              <Link href="/cedentes" className="btn btn-ghost h-9 px-3">Cedentes</Link>
              <Link href="/settings/status" className="btn btn-ghost h-9 px-3">Configurações</Link>
              <Link href="/finance" className="btn btn-ghost h-9 px-3">Fluxo</Link>
              <Link href="/finance/agenda" className="btn btn-ghost h-9 px-3">Agenda</Link>
              <Link href="/finance/dashboard" className="btn btn-ghost h-9 px-3">Financeiro</Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
