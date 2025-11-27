'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCpf } from '@/lib/format';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
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
};

export default function PessoaFisicaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const cpf = decodeURIComponent(params.cpf as string);
  
  const [pessoa, setPessoa] = useState<PessoaFisica | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [cpf]);

  async function loadData() {
    setLoading(true);
    
    const cpfLimpo = cpf.replace(/\D+/g, '');
    const { data } = await supabase
      .from('pessoas_fisicas')
      .select('*')
      .eq('cpf', cpfLimpo)
      .single();
    
    setPessoa(data);
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

  if (!pessoa) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <Card>
            <div className="p-6 text-center">
              <p className="text-[#64748b] mb-4">Pessoa física não encontrada</p>
              <Button variant="primary" onClick={() => router.push('/pessoas-fisicas')}>
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
                <h1 className="text-3xl font-bold text-[#0369a1] mb-2">{pessoa.nome}</h1>
                <p className="text-[#64748b]">CPF: {formatCpf(pessoa.cpf)}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={() => router.push(`/pessoas-fisicas/${encodeURIComponent(cpf)}/editar`)}
                >
                  Editar
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => router.push('/pessoas-fisicas')}
                >
                  Voltar
                </Button>
              </div>
            </div>

            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <label className="text-xs font-medium text-[#64748b]">Situação</label>
                <div className="mt-1">
                  <Badge variant={pessoa.situacao === 'ativa' ? 'success' : 'warning'}>
                    {pessoa.situacao || 'ativa'}
                  </Badge>
                </div>
              </div>

              {pessoa.rg && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <label className="text-xs font-medium text-[#64748b]">RG</label>
                  <p className="text-sm text-[#1e293b] mt-1">{pessoa.rg}</p>
                </div>
              )}

              {pessoa.data_nascimento && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <label className="text-xs font-medium text-[#64748b]">Data de Nascimento</label>
                  <p className="text-sm text-[#1e293b] mt-1">
                    {new Date(pessoa.data_nascimento).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}

              {pessoa.nome_mae && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <label className="text-xs font-medium text-[#64748b]">Nome da Mãe</label>
                  <p className="text-sm text-[#1e293b] mt-1">{pessoa.nome_mae}</p>
                </div>
              )}
            </div>

            {/* Botão de Edição Completa */}
            <div className="flex justify-center pt-4">
              <Button 
                variant="primary" 
                onClick={() => router.push(`/pessoas-fisicas/${encodeURIComponent(cpf)}/editar`)}
              >
                Editar Dados Complementares (Endereços, Telefones, E-mails, Familiares, Empresas, Processos)
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}

