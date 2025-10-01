'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj } from '@/lib/format';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import AtividadesManager from '@/components/atividades/AtividadesManager';

type Cedente = {
  id: string;
  nome: string;
  razao_social: string | null;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  porte: string | null;
  natureza_juridica: string | null;
  situacao: string | null;
  data_abertura: string | null;
  capital_social: number | null;
  atividade_principal_codigo: string | null;
  atividade_principal_descricao: string | null;
  atividades_secundarias: string | null;
  simples_nacional: boolean | null;
  ultima_atualizacao: string | null;
};

export default function CedentePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [cedente, setCedente] = useState<Cedente | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'atividades'>('info');

  useEffect(() => {
    loadCedente();
  }, [id]);

  async function loadCedente() {
    setLoading(true);
    const { data, error } = await supabase
      .from('cedentes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Erro ao carregar cedente:', error);
    } else {
      setCedente(data);
    }
    setLoading(false);
  }

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

  if (!cedente) {
    return (
      <main className="min-h-screen p-6 bg-white">
        <div className="container max-w-6xl">
          <div className="text-center py-8">
            <p className="text-[#64748b]">Cedente não encontrado</p>
            <Button variant="primary" onClick={() => router.back()} className="mt-4">
              Voltar
            </Button>
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
            <h1 className="text-3xl font-bold text-[#0369a1]">
              {cedente.nome}
            </h1>
            {cedente.razao_social && <p className="text-[#64748b]">{cedente.razao_social}</p>}
            {cedente.cnpj && <p className="text-sm text-[#64748b] font-mono">{formatCpfCnpj(cedente.cnpj)}</p>}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => router.back()}>
              Voltar
            </Button>
            <Button 
              variant="primary" 
              onClick={() => router.push(`/cedentes/${cedente.id}/editar`)}
            >
              Editar
            </Button>
          </div>
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
              <div className="grid gap-6 md:grid-cols-2">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-[#0369a1]">Informações Básicas</h2>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-[#64748b]">Nome</label>
                      <p className="text-[#1e293b]">{cedente.nome}</p>
                    </div>
                    {cedente.razao_social && (
                      <div>
                        <label className="text-sm font-medium text-[#64748b]">Razão Social</label>
                        <p className="text-[#1e293b]">{cedente.razao_social}</p>
                      </div>
                    )}
                    {cedente.cnpj && (
                      <div>
                        <label className="text-sm font-medium text-[#64748b]">CNPJ</label>
                        <p className="text-[#1e293b] font-mono">{formatCpfCnpj(cedente.cnpj)}</p>
                      </div>
                    )}
                    {cedente.situacao && (
                      <div>
                        <label className="text-sm font-medium text-[#64748b]">Situação</label>
                        <div className="mt-1">
                          <Badge variant={cedente.situacao === 'ATIVA' ? 'success' : cedente.situacao === 'INATIVA' ? 'error' : 'neutral'} size="sm">
                            {cedente.situacao}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informações de Contato */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-[#0369a1]">Contato</h2>
                  <div className="space-y-3">
                    {cedente.telefone && (
                      <div>
                        <label className="text-sm font-medium text-[#64748b]">Telefone</label>
                        <p className="text-[#1e293b]">{cedente.telefone}</p>
                      </div>
                    )}
                    {cedente.email && (
                      <div>
                        <label className="text-sm font-medium text-[#64748b]">E-mail</label>
                        <p className="text-[#1e293b]">{cedente.email}</p>
                      </div>
                    )}
                    {cedente.endereco && (
                      <div>
                        <label className="text-sm font-medium text-[#64748b]">Endereço</label>
                        <p className="text-[#1e293b]">{cedente.endereco}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informações Empresariais */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-[#0369a1]">Informações Empresariais</h2>
                  <div className="space-y-3">
                    {cedente.porte && (
                      <div>
                        <label className="text-sm font-medium text-[#64748b]">Porte</label>
                        <p className="text-[#1e293b]">{cedente.porte}</p>
                      </div>
                    )}
                    {cedente.natureza_juridica && (
                      <div>
                        <label className="text-sm font-medium text-[#64748b]">Natureza Jurídica</label>
                        <p className="text-[#1e293b]">{cedente.natureza_juridica}</p>
                      </div>
                    )}
                    {cedente.data_abertura && (
                      <div>
                        <label className="text-sm font-medium text-[#64748b]">Data de Abertura</label>
                        <p className="text-[#1e293b]">{new Date(cedente.data_abertura).toLocaleDateString('pt-BR')}</p>
                      </div>
                    )}
                    {cedente.capital_social && (
                      <div>
                        <label className="text-sm font-medium text-[#64748b]">Capital Social</label>
                        <p className="text-[#1e293b]">R$ {cedente.capital_social.toLocaleString('pt-BR')}</p>
                      </div>
                    )}
                    {cedente.simples_nacional !== null && (
                      <div>
                        <label className="text-sm font-medium text-[#64748b]">Simples Nacional</label>
                        <div className="mt-1">
                          <Badge variant={cedente.simples_nacional ? 'success' : 'neutral'} size="sm">
                            {cedente.simples_nacional ? 'Sim' : 'Não'}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Atividades */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-[#0369a1]">Atividades</h2>
                  <div className="space-y-3">
                    {cedente.atividade_principal_codigo && (
                      <div>
                        <label className="text-sm font-medium text-[#64748b]">Código da Atividade Principal</label>
                        <p className="text-[#1e293b] font-mono">{cedente.atividade_principal_codigo}</p>
                      </div>
                    )}
                    {cedente.atividade_principal_descricao && (
                      <div>
                        <label className="text-sm font-medium text-[#64748b]">Atividade Principal</label>
                        <p className="text-[#1e293b]">{cedente.atividade_principal_descricao}</p>
                      </div>
                    )}
                    {cedente.atividades_secundarias && (
                      <div>
                        <label className="text-sm font-medium text-[#64748b]">Atividades Secundárias</label>
                        <p className="text-[#1e293b] text-sm">{cedente.atividades_secundarias}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <AtividadesManager 
                tipo="cedente" 
                id={id} 
                nome={cedente.nome} 
              />
            )}
          </div>
        </Card>

        {cedente.ultima_atualizacao && (
          <Card>
            <div className="text-center">
              <p className="text-sm text-[#64748b]">
                Última atualização: {new Date(cedente.ultima_atualizacao).toLocaleString('pt-BR')}
              </p>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
