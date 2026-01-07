'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj } from '@/lib/format';
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
  observacoes_gerais: string | null;
  origem: string | null;
  created_at: string;
  updated_at: string;
};

export default function PessoaFisicaPage() {
  const params = useParams();
  const router = useRouter();
  const cpf = decodeURIComponent(params.cpf as string).replace(/\D+/g, '');
  
  const [pessoa, setPessoa] = useState<PessoaFisica | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [cpf]);

  async function loadData() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pessoas_fisicas')
        .select('*')
        .eq('cpf', cpf)
        .eq('ativo', true)
        .single();
      
      if (error) {
        console.error('Erro ao carregar pessoa física:', error);
        setPessoa(null);
      } else {
        setPessoa(data);
      }
    } catch (err) {
      console.error('Erro:', err);
      setPessoa(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0369a1]"></div>
            <p className="mt-2 text-gray-600">Carregando...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!pessoa) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="text-center py-8">
            <p className="text-gray-600">Pessoa física não encontrada</p>
            <Button variant="primary" onClick={() => router.push('/pessoas-fisicas')} className="mt-4">
              Voltar
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container max-w-6xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <header className="mb-4">
          <button 
            onClick={() => router.push('/pessoas-fisicas')}
            className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 bg-white border border-gray-300 hover:bg-gray-50 text-[#0369a1] text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
          <div className="border-b-2 border-[#0369a1] pb-3 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#0369a1] mb-1">{pessoa.nome}</h1>
              <p className="text-sm text-gray-600">CPF: {formatCpfCnpj(pessoa.cpf)}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => router.push(`/pessoas-fisicas/${encodeURIComponent(cpf)}/editar`)}>
                Editar
              </Button>
            </div>
          </div>
        </header>

        {/* Informações */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">Informações Cadastrais</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">CPF</p>
                <p className="text-sm font-medium text-gray-900">{formatCpfCnpj(pessoa.cpf)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Situação</p>
                <Badge variant={pessoa.situacao === 'ativa' ? 'success' : pessoa.situacao === 'falecida' ? 'error' : 'warning'}>
                  {pessoa.situacao || 'ativa'}
                </Badge>
              </div>
              {pessoa.rg && (
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">RG</p>
                  <p className="text-sm text-gray-900">{pessoa.rg}</p>
                </div>
              )}
              {pessoa.data_nascimento && (
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Data de Nascimento</p>
                  <p className="text-sm text-gray-900">{new Date(pessoa.data_nascimento).toLocaleDateString('pt-BR')}</p>
                </div>
              )}
              {pessoa.nome_mae && (
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Nome da Mãe</p>
                  <p className="text-sm text-gray-900">{pessoa.nome_mae}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Origem</p>
                <p className="text-sm text-gray-900">{pessoa.origem || 'manual'}</p>
              </div>
            </div>
            {pessoa.observacoes_gerais && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 uppercase mb-1">Observações Gerais</p>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{pessoa.observacoes_gerais}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

