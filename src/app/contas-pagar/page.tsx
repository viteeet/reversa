'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Lancamento = {
  id: string;
  data: string; // ISO
  descricao: string;
  valor: number;
  categoria: string | null;
};

export default function ContasPagarPage() {
  const [items, setItems] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Placeholder: carregamento futuro (depende do seu schema de fluxo de caixa)
    setLoading(false);
  }, []);

  return (
    <main className="min-h-screen p-6">
      <div className="container max-w-5xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">Contas a Pagar</h1>
          <p className="text-sm muted">Fluxo de caixa (em construção)</p>
        </header>

        {loading ? (
          <p className="muted">Carregando...</p>
        ) : items.length === 0 ? (
          <div className="card p-6">
            <p className="mb-2">Nenhum lançamento ainda.</p>
            <p className="muted">Definiremos o schema e filtros (por período, cedente, status) conforme sua orientação.</p>
          </div>
        ) : (
          <div className="overflow-x-auto card">
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {items.map((l) => (
                  <tr key={l.id}>
                    <td>{new Date(l.data).toLocaleDateString()}</td>
                    <td>{l.descricao}</td>
                    <td>{l.categoria ?? '—'}</td>
                    <td>{l.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}


