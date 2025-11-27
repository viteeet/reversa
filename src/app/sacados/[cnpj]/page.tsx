'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import AtividadesManager from '@/components/atividades/AtividadesManager';
import FoundDataManagerGeneric from '@/components/shared/FoundDataManagerGeneric';

type Sacado = {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  situacao: string | null;
  porte: string | null;
  natureza_juridica: string | null;
  data_abertura: string | null;
  capital_social: number | null;
  atividade_principal_descricao: string | null;
  simples_nacional: boolean | null;
  endereco_receita: string | null;
  telefone_receita: string | null;
  email_receita: string | null;
  grupo_empresa_id: string | null;
  grupo_empresa?: {
    id: string;
    nome_grupo: string;
    cnpj_matriz: string;
  };
};

type FoundDataItem = {
  id: string;
  tipo: string;
  titulo: string;
  conteudo: string;
  observacoes?: string;
  fonte?: string;
  data_encontrado?: string;
};

export default function SacadoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const cnpj = decodeURIComponent(params.cnpj as string);
  
  const [sacado, setSacado] = useState<Sacado | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'atividades'>('info');
  const [foundData, setFoundData] = useState<FoundDataItem[]>([]);
  const [grupoInfo, setGrupoInfo] = useState<{ nome_grupo: string; id: string; cnpjs_count: number } | null>(null);

  useEffect(() => {
    loadData();
  }, [cnpj]);

  async function loadData() {
    setLoading(true);
    
    const { data: sacadoData } = await supabase
      .from('sacados')
      .select('*')
      .eq('cnpj', cnpj)
      .single();
    
    setSacado(sacadoData);
    
    // Carrega informações do grupo, se houver
    if (sacadoData?.grupo_empresa_id) {
      const { data: grupoData } = await supabase
        .from('empresas_grupo')
        .select('id, nome_grupo, cnpj_matriz')
        .eq('id', sacadoData.grupo_empresa_id)
        .single();
      
      if (grupoData) {
        // Conta quantos CNPJs estão no grupo
        const { count } = await supabase
          .from('empresas_grupo_cnpjs')
          .select('*', { count: 'exact', head: true })
          .eq('grupo_id', grupoData.id)
          .eq('ativo', true);
        
        setGrupoInfo({
          nome_grupo: grupoData.nome_grupo,
          id: grupoData.id,
          cnpjs_count: count || 0
        });
      }
    }
    
    await loadFoundData();
    setLoading(false);
  }

  async function loadFoundData() {
    const { data } = await supabase
      .from('sacados_dados_encontrados')
      .select('*')
      .eq('sacado_cnpj', cnpj)
      .eq('ativo', true)
      .order('created_at', { ascending: false });
    
    setFoundData(data || []);
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <div className="container max-w-6xl">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-slate-600">Carregando...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!sacado) {
    return (
      <main className="min-h-screen p-6">
        <div className="container max-w-6xl">
          <div className="text-center py-8">
            <p className="text-slate-600">Sacado não encontrado</p>
            <Button variant="primary" onClick={() => {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back();
  } else {
    router.push('/sacados');
  }
}} className="mt-4">
              Voltar
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="container max-w-6xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-slate-800 bg-clip-text text-transparent">
                {sacado.razao_social}
              </h1>
              {grupoInfo && (
                <Link href={`/empresas-grupo/${grupoInfo.id}`}>
                  <Badge variant="info" className="cursor-pointer hover:opacity-80">
                    🏭 {grupoInfo.nome_grupo} ({grupoInfo.cnpjs_count} CNPJs)
                  </Badge>
                </Link>
              )}
            </div>
            <p className="text-slate-600">{sacado.nome_fantasia}</p>
            <p className="text-sm text-slate-500 font-mono">{sacado.cnpj}</p>
          </div>
          <Button variant="secondary" onClick={() => {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back();
  } else {
    router.push('/sacados');
  }
}}>
            Voltar
          </Button>
        </header>

        {/* Abas */}
        <Card>
          <div className="border-b border-[#cbd5e1]">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('info')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'info'
                    ? 'border-[#0369a1] text-[#0369a1]'
                    : 'border-transparent text-[#64748b] hover:text-[#1e293b] hover:border-[#cbd5e1]'
                }`}
              >
                📋 Informações
              </button>
              <button
                onClick={() => setActiveTab('atividades')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'atividades'
                    ? 'border-[#0369a1] text-[#0369a1]'
                    : 'border-transparent text-[#64748b] hover:text-[#1e293b] hover:border-[#cbd5e1]'
                }`}
              >
                📞 Atividades
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'info' ? (
              <div className="space-y-6">
                {/* Dados da Receita (API) */}
                <div className="bg-gradient-to-r from-[#f0f9ff] to-[#e0f2fe] rounded-lg p-4 border border-[#bae6fd]">
                  <h2 className="text-lg font-semibold text-[#0369a1] mb-3 flex items-center gap-2">
                    <span>🏛️</span> Dados da Receita Federal
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-white rounded p-2">
                      <label className="text-xs font-medium text-[#64748b]">Situação</label>
                      <div className="mt-1">
                        {sacado.situacao && (
                          <Badge variant={sacado.situacao === 'ATIVA' ? 'success' : 'error'} size="sm">
                            {sacado.situacao}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="bg-white rounded p-2">
                      <label className="text-xs font-medium text-[#64748b]">Porte</label>
                      <p className="text-sm text-[#1e293b] mt-1">{sacado.porte || '—'}</p>
                    </div>
                    <div className="bg-white rounded p-2">
                      <label className="text-xs font-medium text-[#64748b]">Simples Nacional</label>
                      <p className="text-sm text-[#1e293b] mt-1">{sacado.simples_nacional ? 'Sim' : 'Não'}</p>
                    </div>
                    <div className="bg-white rounded p-2">
                      <label className="text-xs font-medium text-[#64748b]">Data de Abertura</label>
                      <p className="text-sm text-[#1e293b] mt-1">
                        {sacado.data_abertura ? new Date(sacado.data_abertura).toLocaleDateString('pt-BR') : '—'}
                      </p>
                    </div>
                    <div className="bg-white rounded p-2">
                      <label className="text-xs font-medium text-[#64748b]">Capital Social</label>
                      <p className="text-sm text-[#1e293b] mt-1">
                        {sacado.capital_social ? sacado.capital_social.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
                      </p>
                    </div>
                    <div className="bg-white rounded p-2">
                      <label className="text-xs font-medium text-[#64748b]">Telefone</label>
                      <p className="text-sm text-[#1e293b] mt-1">{sacado.telefone_receita || '—'}</p>
                    </div>
                    <div className="bg-white rounded p-2">
                      <label className="text-xs font-medium text-[#64748b]">Email</label>
                      <p className="text-sm text-[#1e293b] mt-1 truncate" title={sacado.email_receita || ''}>
                        {sacado.email_receita || '—'}
                      </p>
                    </div>
                    <div className="bg-white rounded p-2 sm:col-span-2 lg:col-span-1">
                      <label className="text-xs font-medium text-[#64748b]">Natureza Jurídica</label>
                      <p className="text-sm text-[#1e293b] mt-1">{sacado.natureza_juridica || '—'}</p>
                    </div>
                  </div>
                  <div className="bg-white rounded p-2 mt-3">
                    <label className="text-xs font-medium text-[#64748b]">Endereço</label>
                    <p className="text-sm text-[#1e293b] mt-1">{sacado.endereco_receita || '—'}</p>
                  </div>
                  <div className="bg-white rounded p-2 mt-3">
                    <label className="text-xs font-medium text-[#64748b]">Atividade Principal</label>
                    <p className="text-sm text-[#1e293b] mt-1">{sacado.atividade_principal_descricao || '—'}</p>
                  </div>
                </div>

                {/* Dados Encontrados (Manual) */}
                <div>
                  <FoundDataManagerGeneric 
                    entityId={cnpj}
                    entityType="sacado"
                    items={foundData}
                    onRefresh={loadFoundData}
                  />
                </div>

                {/* Botão de Edição Completa */}
                <div className="flex justify-center pt-2">
                  <Button 
                    variant="primary" 
                    onClick={() => router.push(`/sacados/${encodeURIComponent(cnpj)}/editar`)}
                  >
                    Editar Dados Complementares (QSA, Processos, etc.)
                  </Button>
                </div>
              </div>
            ) : (
              <AtividadesManager 
                tipo="sacado" 
                id={cnpj} 
                nome={sacado.nome_fantasia || sacado.razao_social} 
              />
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}