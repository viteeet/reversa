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

type Sacado = {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  grupo: string | null;
  endereco_receita: string | null;
  telefone_receita: string | null;
  email_receita: string | null;
  situacao: string | null;
  data_abertura: string | null;
  capital_social: number | null;
  atividade_principal_codigo: string | null;
  atividade_principal_descricao: string | null;
  atividades_secundarias: string | null;
  simples_nacional: boolean | null;
  porte: string | null;
  natureza_juridica: string | null;
  cedente_id: string;
  cedente: {
    id: string;
    nome: string;
    razao_social: string | null;
  } | null;
};

export default function SacadosPage() {
  const router = useRouter();
  const [items, setItems] = useState<Sacado[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.replace('/login');

    setLoading(true);
    const { data, error } = await supabase
      .from('sacados')
      .select(`
        cnpj,
        razao_social,
        nome_fantasia,
        grupo,
        endereco_receita,
        telefone_receita,
        email_receita,
        situacao,
        data_abertura,
        capital_social,
        atividade_principal_codigo,
        atividade_principal_descricao,
        atividades_secundarias,
        simples_nacional,
        porte,
        natureza_juridica,
        cedente_id,
        cedente:cedentes!sacados_cedente_id_fkey(id, nome, razao_social)
      `)
      .order('razao_social', { ascending: true });
    
    if (error) {
      console.error('Erro ao carregar sacados:', error);
    } else {
      // Transforma cedente de array para objeto único ou null
      const dadosProcessados = (data ?? []).map(item => ({
        ...item,
        cedente: Array.isArray(item.cedente) 
          ? (item.cedente.length > 0 ? item.cedente[0] : null)
          : item.cedente
      }));
      setItems(dadosProcessados);
    }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter(s => {
      const cedenteNome = s.cedente?.nome?.toLowerCase() ?? '';
      const cedenteRazao = s.cedente?.razao_social?.toLowerCase() ?? '';
      return [
        s.cnpj, s.razao_social, s.nome_fantasia ?? '', s.grupo ?? '',
        s.endereco_receita ?? '', s.telefone_receita ?? '', s.email_receita ?? '',
        s.situacao ?? '', s.atividade_principal_descricao ?? '', s.porte ?? '',
        s.natureza_juridica ?? '', cedenteNome, cedenteRazao
      ]
        .some(v => v.toLowerCase().includes(t));
    });
  }, [items, q]);

  if (loading) {
    return (
      <main className="min-h-screen p-6 bg-white">
        <div className="container max-w-6xl">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0369a1]"></div>
            <p className="mt-2 text-[#64748b]">Carregando...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 bg-white">
      <div className="container max-w-6xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#0369a1]">Sacados</h1>
            <p className="text-[#64748b]">Visualização de todos os sacados cadastrados</p>
          </div>
          <Button 
            variant="primary"
            onClick={() => router.push('/cedentes')}
          >
            📋 Cadastrar Sacado (via Cedente)
          </Button>
        </header>

        {/* Aviso importante */}
        <Card>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div className="flex-1">
                <h3 className="font-semibold text-[#0369a1] mb-1">Como cadastrar sacados</h3>
                <p className="text-sm text-[#64748b]">
                  Os sacados (devedores) devem ser cadastrados dentro de um <strong>cedente</strong>. 
                  Acesse um cedente específico e adicione seus sacados na aba "Sacados".
                </p>
                <Link href="/cedentes" className="text-sm text-[#0369a1] hover:underline mt-2 inline-block">
                  → Ver lista de cedentes
                </Link>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#0369a1]">Lista de Sacados</h2>
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar sacado..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
                  className="w-64"
          />
                <Button variant="secondary" onClick={() => setQ('')}>
                  Limpar
                </Button>
              </div>
        </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#e0efff] to-[#f0f7ff]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#0369a1]">Nome Fantasia</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#0369a1]">Razão Social</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#0369a1]">CNPJ</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#0369a1]">Cedente</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#0369a1]">Situação</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#0369a1]">Porte</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#0369a1]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#cbd5e1]">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="p-6 text-center text-[#64748b]">Nenhum sacado encontrado.</td></tr>
                  ) : filtered.map(s => (
                    <tr key={s.cnpj} className="hover:bg-[#f8fbff] transition-colors">
                      <td className="px-4 py-3 text-sm text-[#1e293b] font-medium">{s.nome_fantasia ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-[#64748b]">{s.razao_social}</td>
                      <td className="px-4 py-3 text-sm text-[#64748b] font-mono">{s.cnpj ? formatCpfCnpj(s.cnpj) : '—'}</td>
                      <td className="px-4 py-3">
                        {s.cedente ? (
                          <Link 
                            href={`/cedentes/${s.cedente.id}`}
                            className="text-sm text-[#0369a1] hover:underline font-medium"
                          >
                            {s.cedente.nome}
                            {s.cedente.razao_social && (
                              <span className="text-[#64748b]"> ({s.cedente.razao_social})</span>
                            )}
                          </Link>
                        ) : (
                          <span className="text-sm text-[#94a3b8]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {s.situacao && (
                          <Badge variant={s.situacao === 'ATIVA' ? 'success' : s.situacao === 'INATIVA' ? 'error' : 'neutral'} size="sm">
                            {s.situacao}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#64748b]">{s.porte ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link href={`/sacados/${encodeURIComponent(s.cnpj)}`}>
                            <Button variant="outline" size="sm">
                              Ver
                            </Button>
                          </Link>
                          <Link href={`/sacados/${encodeURIComponent(s.cnpj)}/editar`}>
                            <Button variant="secondary" size="sm">
                              Editar
                            </Button>
                          </Link>
                          <Link href={`/sacados/${encodeURIComponent(s.cnpj)}/cobranca`}>
                            <Button variant="primary" size="sm">
                              Ficha
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
            </table>
          </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
