'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj } from '@/lib/format';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

type EmpresaGrupo = {
  id: string;
  nome_grupo: string;
  cnpj_matriz: string;
  observacoes: string | null;
  created_at: string;
  cnpjs_count?: number;
};

export default function EmpresasGrupoPage() {
  const router = useRouter();
  const [items, setItems] = useState<EmpresaGrupo[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.replace('/login');

    setLoading(true);
    
    // Carrega grupos
    const { data: grupos, error } = await supabase
      .from('empresas_grupo')
      .select('*')
      .eq('user_id', user.id)
      .order('nome_grupo', { ascending: true });
    
    if (error) {
      console.error('Erro ao carregar grupos:', error);
      setItems([]);
    } else {
      // Para cada grupo, conta quantos CNPJs estão vinculados
      const gruposComCount = await Promise.all(
        (grupos || []).map(async (grupo) => {
          const { count } = await supabase
            .from('empresas_grupo_cnpjs')
            .select('*', { count: 'exact', head: true })
            .eq('grupo_id', grupo.id)
            .eq('ativo', true);
          
          return {
            ...grupo,
            cnpjs_count: count || 0
          };
        })
      );
      
      setItems(gruposComCount);
    }
    setLoading(false);
  }

  const filtered = items.filter(grupo => {
    const t = q.trim().toLowerCase();
    if (!t) return true;
    const nome = grupo.nome_grupo?.toLowerCase() ?? '';
    const cnpj = grupo.cnpj_matriz?.toLowerCase() ?? '';
    return nome.includes(t) || cnpj.includes(t);
  });

  async function remove(id: string) {
    if (!confirm('Tem certeza que deseja excluir este grupo? Os CNPJs não serão excluídos, apenas desvinculados.')) return;
    
    // Primeiro remove os vínculos
    await supabase
      .from('empresas_grupo_cnpjs')
      .delete()
      .eq('grupo_id', id);
    
    // Depois remove o grupo
    const { error } = await supabase
      .from('empresas_grupo')
      .delete()
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
                <h1 className="text-3xl font-bold text-[#0369a1] mb-2">Grupos de Empresas</h1>
                <p className="text-[#64748b]">Gerencie grupos de empresas com múltiplos CNPJs</p>
              </div>
              <Button
                variant="primary"
                onClick={() => router.push('/empresas-grupo/new')}
              >
                + Criar Grupo
              </Button>
            </div>

            {/* Busca */}
            <div className="mb-6">
              <Input
                placeholder="Buscar por nome do grupo ou CNPJ matriz..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            {/* Lista */}
            {loading ? (
              <div className="text-center py-12">
                <p className="text-[#64748b]">Carregando...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#64748b] mb-4">
                  {q ? 'Nenhum grupo encontrado.' : 'Nenhum grupo cadastrado.'}
                </p>
                {!q && (
                  <Button
                    variant="primary"
                    onClick={() => router.push('/empresas-grupo/new')}
                  >
                    Criar Primeiro Grupo
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((grupo) => (
                  <div
                    key={grupo.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Link
                          href={`/empresas-grupo/${grupo.id}`}
                          className="text-lg font-semibold text-[#0369a1] hover:underline"
                        >
                          {grupo.nome_grupo}
                        </Link>
                        <div className="mt-2 flex items-center gap-4 text-sm text-[#64748b]">
                          <span>CNPJ Matriz: {formatCpfCnpj(grupo.cnpj_matriz)}</span>
                          <Badge variant="info">
                            {grupo.cnpjs_count || 0} CNPJ(s) vinculado(s)
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/empresas-grupo/${grupo.id}/editar`}>
                          <Button variant="secondary" size="sm">Editar</Button>
                        </Link>
                        <Button
                          variant="error"
                          size="sm"
                          onClick={() => remove(grupo.id)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Estatísticas */}
            {!loading && filtered.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-[#64748b]">
                  Total: {filtered.length} grupo(s)
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}

