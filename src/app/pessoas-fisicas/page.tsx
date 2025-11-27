'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj } from '@/lib/format';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

type PessoaFisica = {
  id: string;
  cpf: string;
  nome: string;
  nome_mae: string | null;
  data_nascimento: string | null;
  rg: string | null;
  situacao: string | null;
  ativo: boolean;
  created_at: string;
};

export default function PessoasFisicasPage() {
  const router = useRouter();
  const [items, setItems] = useState<PessoaFisica[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'nome' | 'cpf' | 'situacao'>('nome');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.replace('/login');

    setLoading(true);
    const { data, error } = await supabase
      .from('pessoas_fisicas')
      .select('*')
      .eq('user_id', user.id)
      .eq('ativo', true)
      .order('nome', { ascending: true });
    
    if (error) {
      console.error('Erro ao carregar pessoas físicas:', error);
    } else {
      setItems(data ?? []);
    }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter(p => {
      const nome = p.nome?.toLowerCase() ?? '';
      const cpf = p.cpf?.toLowerCase() ?? '';
      const rg = p.rg?.toLowerCase() ?? '';
      return nome.includes(t) || cpf.includes(t) || rg.includes(t);
    });
  }, [items, q]);

  const sorted = useMemo(() => {
    const sortedItems = [...filtered];
    sortedItems.sort((a, b) => {
      let aVal: any = a[sortBy];
      let bVal: any = b[sortBy];
      
      if (sortBy === 'nome') {
        aVal = aVal?.toLowerCase() ?? '';
        bVal = bVal?.toLowerCase() ?? '';
      }
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sortedItems;
  }, [filtered, sortBy, sortDir]);

  async function remove(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta pessoa física?')) return;
    const { error } = await supabase
      .from('pessoas_fisicas')
      .update({ ativo: false })
      .eq('id', id);
    if (error) {
      alert(error.message);
      return;
    }
    await load();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <Card>
          <div className="p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-[#0369a1] mb-2">Pessoas Físicas</h1>
                <p className="text-[#64748b]">Gerencie pessoas físicas como entidades principais</p>
              </div>
              <Button
                variant="primary"
                onClick={() => router.push('/pessoas-fisicas/new')}
              >
                + Cadastrar Pessoa Física
              </Button>
            </div>

            {/* Filtros e Busca */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por nome, CPF ou RG..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
                >
                  <option value="nome">Nome</option>
                  <option value="cpf">CPF</option>
                  <option value="situacao">Situação</option>
                </select>
                <Button
                  variant="secondary"
                  onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
                >
                  {sortDir === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>

            {/* Lista */}
            {loading ? (
              <div className="text-center py-12">
                <p className="text-[#64748b]">Carregando...</p>
              </div>
            ) : sorted.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#64748b] mb-4">
                  {q ? 'Nenhuma pessoa física encontrada.' : 'Nenhuma pessoa física cadastrada.'}
                </p>
                {!q && (
                  <Button
                    variant="primary"
                    onClick={() => router.push('/pessoas-fisicas/new')}
                  >
                    Cadastrar Primeira Pessoa Física
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#64748b]">Nome</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#64748b]">CPF</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#64748b]">RG</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#64748b]">Situação</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#64748b]">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((pessoa) => (
                      <tr key={pessoa.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <Link
                            href={`/pessoas-fisicas/${encodeURIComponent(pessoa.cpf)}`}
                            className="text-[#0369a1] hover:underline font-medium"
                          >
                            {pessoa.nome}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-sm text-[#64748b]">
                          {formatCpfCnpj(pessoa.cpf)}
                        </td>
                        <td className="py-3 px-4 text-sm text-[#64748b]">
                          {pessoa.rg || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={pessoa.situacao === 'ativa' ? 'success' : 'warning'}
                          >
                            {pessoa.situacao || 'ativa'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Link href={`/pessoas-fisicas/${encodeURIComponent(pessoa.cpf)}/editar`}>
                              <Button variant="secondary" size="sm">Editar</Button>
                            </Link>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => remove(pessoa.id)}
                            >
                              Excluir
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Estatísticas */}
            {!loading && sorted.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-[#64748b]">
                  Total: {sorted.length} pessoa(s) física(s)
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}

