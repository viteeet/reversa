'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj } from '@/lib/format';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

type PessoaFisica = {
  id: string;
  cpf: string;
  nome: string;
  nome_mae: string | null;
  data_nascimento: string | null;
  rg: string | null;
  situacao: string | null;
  observacoes_gerais: string | null;
};

export default function EditarPessoaFisicaPage() {
  const params = useParams();
  const router = useRouter();
  const cpf = decodeURIComponent(params.cpf as string).replace(/\D+/g, '');
  
  const [form, setForm] = useState<PessoaFisica>({
    id: '',
    cpf: '',
    nome: '',
    nome_mae: '',
    data_nascimento: '',
    rg: '',
    situacao: 'ativa',
    observacoes_gerais: '',
  });
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [cpf]);

  // Validação de CPF
  function validarCPF(cpf: string): boolean {
    const cpfLimpo = cpf.replace(/\D+/g, '');
    if (cpfLimpo.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
    }
    let digito = 11 - (soma % 11);
    if (digito >= 10) digito = 0;
    if (digito !== parseInt(cpfLimpo.charAt(9))) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
    }
    digito = 11 - (soma % 11);
    if (digito >= 10) digito = 0;
    if (digito !== parseInt(cpfLimpo.charAt(10))) return false;
    
    return true;
  }

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
        setErr('Pessoa física não encontrada');
      } else if (data) {
        setForm({
          id: data.id,
          cpf: data.cpf,
          nome: data.nome || '',
          nome_mae: data.nome_mae || '',
          data_nascimento: data.data_nascimento ? data.data_nascimento.split('T')[0] : '',
          rg: data.rg || '',
          situacao: data.situacao || 'ativa',
          observacoes_gerais: data.observacoes_gerais || '',
        });
      }
    } catch (err) {
      console.error('Erro:', err);
      setErr('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  async function salvar() {
    if (!form.nome.trim()) {
      setErr('Nome é obrigatório');
      return;
    }
    
    const cpfLimpo = form.cpf.replace(/\D+/g, '');
    if (!validarCPF(cpfLimpo)) {
      setErr('CPF inválido');
      return;
    }
    
    setPending(true);
    setErr(null);
    
    try {
      const { error } = await supabase
        .from('pessoas_fisicas')
        .update({
          nome: form.nome.trim(),
          nome_mae: form.nome_mae || null,
          data_nascimento: form.data_nascimento || null,
          rg: form.rg || null,
          situacao: form.situacao || 'ativa',
          observacoes_gerais: form.observacoes_gerais || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', form.id);
      
      if (error) {
        setErr(error.message);
      } else {
        router.push(`/pessoas-fisicas/${encodeURIComponent(cpfLimpo)}`);
      }
    } catch (err) {
      setErr('Erro ao salvar');
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0369a1]"></div>
            <p className="mt-2 text-gray-600">Carregando...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <header className="mb-4">
          <button 
            onClick={() => router.push(`/pessoas-fisicas/${encodeURIComponent(cpf)}`)}
            className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 bg-white border border-gray-300 hover:bg-gray-50 text-[#0369a1] text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
          <div className="border-b-2 border-[#0369a1] pb-3">
            <h1 className="text-3xl font-bold text-[#0369a1] mb-1">Editar Pessoa Física</h1>
            <p className="text-sm text-gray-600">CPF: {formatCpfCnpj(form.cpf)}</p>
          </div>
        </header>

        {/* Formulário */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">Dados Cadastrais</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="CPF"
                  value={formatCpfCnpj(form.cpf)}
                  disabled
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Nome *"
                  placeholder="Nome completo"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
              </div>
              <Input
                label="Nome da Mãe"
                placeholder="Nome completo da mãe"
                value={form.nome_mae}
                onChange={(e) => setForm({ ...form, nome_mae: e.target.value })}
              />
              <Input
                label="RG"
                placeholder="RG"
                value={form.rg}
                onChange={(e) => setForm({ ...form, rg: e.target.value })}
              />
              <Input
                label="Data de Nascimento"
                type="date"
                value={form.data_nascimento}
                onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })}
              />
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Situação</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 text-sm"
                  value={form.situacao}
                  onChange={(e) => setForm({ ...form, situacao: e.target.value })}
                >
                  <option value="ativa">Ativa</option>
                  <option value="inativa">Inativa</option>
                  <option value="falecida">Falecida</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Observações Gerais</label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 text-sm"
                  rows={4}
                  value={form.observacoes_gerais}
                  onChange={(e) => setForm({ ...form, observacoes_gerais: e.target.value })}
                />
              </div>
            </div>
            {err && <p className="text-xs text-red-600">{err}</p>}
            <div className="flex gap-2 justify-end">
              <button 
                className="px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium"
                onClick={() => router.push(`/pessoas-fisicas/${encodeURIComponent(cpf)}`)}
              >
                Cancelar
              </button>
              <button 
                className="px-3 py-1.5 bg-[#0369a1] hover:bg-[#075985] text-white text-sm font-medium disabled:opacity-50"
                onClick={salvar}
                disabled={pending}
              >
                {pending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

