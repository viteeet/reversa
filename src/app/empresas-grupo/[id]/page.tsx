'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj } from '@/lib/format';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';

type EmpresaGrupo = {
  id: string;
  nome_grupo: string;
  cnpj_matriz: string;
  observacoes: string | null;
};

type CNPJVinculado = {
  id: string;
  cnpj: string;
  tipo_entidade: string;
  tipo_unidade: string;
  ordem: number;
  observacoes: string | null;
  empresa?: {
    razao_social: string;
    nome_fantasia: string | null;
    situacao: string | null;
  };
};

export default function EmpresaGrupoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const grupoId = params.id as string;
  
  const [grupo, setGrupo] = useState<EmpresaGrupo | null>(null);
  const [cnpjs, setCnpjs] = useState<CNPJVinculado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [grupoId]);

  async function loadData() {
    setLoading(true);
    
    // Carrega o grupo
    const { data: grupoData } = await supabase
      .from('empresas_grupo')
      .select('*')
      .eq('id', grupoId)
      .single();
    
    setGrupo(grupoData);
    
    // Carrega CNPJs vinculados
    const { data: cnpjsData } = await supabase
      .from('empresas_grupo_cnpjs')
      .select('*')
      .eq('grupo_id', grupoId)
      .eq('ativo', true)
      .order('ordem', { ascending: true });
    
    // Para cada CNPJ, busca informações da empresa
    if (cnpjsData) {
      const cnpjsComInfo = await Promise.all(
        cnpjsData.map(async (cnpjItem) => {
          const tableName = cnpjItem.tipo_entidade === 'sacado' ? 'sacados' : 'cedentes';
          const { data: empresaData } = await supabase
            .from(tableName)
            .select('razao_social, nome_fantasia, situacao')
            .eq('cnpj', cnpjItem.cnpj)
            .single();
          
          return {
            ...cnpjItem,
            empresa: empresaData || undefined
          };
        })
      );
      
      setCnpjs(cnpjsComInfo);
    }
    
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0369a1]"></div>
            <p className="mt-2 text-[#64748b]">Carregando...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!grupo) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <Card>
            <div className="p-6 text-center">
              <p className="text-[#64748b] mb-4">Grupo não encontrado</p>
              <Button variant="primary" onClick={() => router.push('/empresas-grupo')}>
                Voltar para Lista
              </Button>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <Card>
          <div className="p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-[#0369a1] mb-2">{grupo.nome_grupo}</h1>
                <p className="text-[#64748b]">CNPJ Matriz: {formatCpfCnpj(grupo.cnpj_matriz)}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={() => router.push(`/empresas-grupo/${grupoId}/editar`)}
                >
                  Editar
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => router.push('/empresas-grupo')}
                >
                  Voltar
                </Button>
              </div>
            </div>

            {/* CNPJs Vinculados */}
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-[#0369a1] mb-4">
                CNPJs Vinculados ({cnpjs.length})
              </h2>
              
              {cnpjs.length === 0 ? (
                <p className="text-[#64748b]">Nenhum CNPJ vinculado ainda.</p>
              ) : (
                <div className="space-y-3">
                  {cnpjs.map((cnpjItem) => (
                    <div
                      key={cnpjItem.id}
                      className="bg-white rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Link
                              href={`/${cnpjItem.tipo_entidade === 'sacado' ? 'sacados' : 'cedentes'}/${encodeURIComponent(cnpjItem.cnpj)}`}
                              className="font-semibold text-[#0369a1] hover:underline"
                            >
                              {cnpjItem.empresa?.razao_social || 'Empresa não encontrada'}
                            </Link>
                            <Badge variant={cnpjItem.tipo_unidade === 'matriz' ? 'success' : 'info'}>
                              {cnpjItem.tipo_unidade}
                            </Badge>
                            <Badge variant="neutral">
                              {cnpjItem.tipo_entidade}
                            </Badge>
                          </div>
                          <p className="text-sm text-[#64748b] font-mono">
                            CNPJ: {formatCpfCnpj(cnpjItem.cnpj)}
                          </p>
                          {cnpjItem.empresa?.situacao && (
                            <p className="text-sm text-[#64748b] mt-1">
                              Situação: {cnpjItem.empresa.situacao}
                            </p>
                          )}
                        </div>
                        <Link
                          href={`/${cnpjItem.tipo_entidade === 'sacado' ? 'sacados' : 'cedentes'}/${encodeURIComponent(cnpjItem.cnpj)}`}
                        >
                          <Button variant="secondary" size="sm">
                            Ver Detalhes
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Observações */}
            {grupo.observacoes && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold text-[#0369a1] mb-4">Observações</h2>
                <p className="text-[#64748b] whitespace-pre-wrap">{grupo.observacoes}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}

