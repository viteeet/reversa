'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj } from '@/lib/format';
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
    <main className="min-h-screen bg-gray-50">
      <div className="container max-w-7xl mx-auto px-4 py-6">
        {/* Header com botão de voltar */}
        <header className="mb-4">
          <button 
            onClick={() => router.push('/menu/operacional')}
            className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 bg-white border border-gray-300 hover:bg-gray-50 text-[#0369a1] text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
          <div className="border-b-2 border-[#0369a1] pb-3">
            <h1 className="text-3xl font-bold text-[#0369a1] mb-1">Grupos de Empresas</h1>
            <p className="text-sm text-gray-600">Gerencie grupos de empresas com múltiplos CNPJs</p>
          </div>
        </header>

        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-700 uppercase">Opções</h2>
              </div>
              <Button
                variant="primary"
                onClick={() => router.push('/empresas-grupo/new')}
              >
                + Criar Grupo
              </Button>
            </div>
          </div>
          <div className="p-4">

            {/* Busca */}
            <div className="mb-4">
              <Input
                placeholder="Buscar por nome do grupo ou CNPJ matriz..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            {/* Lista */}
            {loading ? (
              <div className="text-center py-12 border-t border-gray-300">
                <p className="text-gray-600">Carregando...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 border-t border-gray-300">
                <p className="text-gray-600 mb-4">
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
              <div className="border-t border-gray-300">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Nome do Grupo</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">CNPJ Matriz</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">CNPJs Vinculados</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((grupo) => (
                      <tr key={grupo.id} className="hover:bg-gray-50 border-b border-gray-300">
                        <td className="px-4 py-2 border-r border-gray-300">
                          <Link
                            href={`/empresas-grupo/${grupo.id}`}
                            className="text-sm font-semibold text-[#0369a1] hover:underline"
                          >
                            {grupo.nome_grupo}
                          </Link>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600 border-r border-gray-300">{formatCpfCnpj(grupo.cnpj_matriz)}</td>
                        <td className="px-4 py-2 text-center border-r border-gray-300">
                          <Badge variant="info">
                            {grupo.cnpjs_count || 0} CNPJ(s)
                          </Badge>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2 justify-center">
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Estatísticas */}
            {!loading && filtered.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-300 bg-gray-100 px-4 py-2">
                <p className="text-sm text-gray-600">
                  Total: <strong className="text-[#0369a1]">{filtered.length}</strong> grupo(s)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

