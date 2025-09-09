'use client';

import Link from 'next/link';

export default function FinanceSettingsIndex() {
  return (
    <main className="min-h-screen p-6">
      <div className="container max-w-4xl space-y-4">
        <h1 className="text-2xl font-semibold">Configurações · Financeiro</h1>
        <div className="card p-4 grid gap-2">
          <Link href="/settings/finance/contas" className="btn">Contas financeiras</Link>
          <Link href="/settings/finance/categorias" className="btn">Categorias</Link>
          <Link href="/settings/finance/meios" className="btn">Meios de pagamento</Link>
          <Link href="/settings/finance/elementos" className="btn">Elementos</Link>
          <Link href="/settings/finance/recorrencias" className="btn">Recorrências</Link>
        </div>
      </div>
    </main>
  );
}


