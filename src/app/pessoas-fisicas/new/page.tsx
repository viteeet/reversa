'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCpf } from '@/lib/format';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function NewPessoaFisicaPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    cpf: '',
    nome: '',
    nome_mae: '',
    data_nascimento: '',
    rg: '',
    situacao: 'ativa'
  });
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
    if (!form.cpf || !form.nome) {
      setErr('CPF e Nome são obrigatórios');
      return;
    }
    
    setPending(true);
    setErr(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setErr('Não autenticado');
      setPending(false);
      return;
    }

    const cpfLimpo = form.cpf.replace(/\D+/g, '');
    if (cpfLimpo.length !== 11) {
      setErr('CPF deve ter 11 dígitos');
      setPending(false);
      return;
    }

    const { error } = await supabase.from('pessoas_fisicas').insert({
      cpf: cpfLimpo,
      nome: form.nome.trim(),
      nome_mae: form.nome_mae || null,
      data_nascimento: form.data_nascimento || null,
      rg: form.rg || null,
      situacao: form.situacao || 'ativa',
      user_id: user.id
    });

    if (error) {
      if (error.code === '23505') {
        setErr('CPF já cadastrado');
      } else {
        setErr(error.message);
      }
      setPending(false);
    } else {
      router.replace('/pessoas-fisicas');
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-[#0369a1] mb-2">Nova Pessoa Física</h1>
                <p className="text-[#64748b]">Cadastre uma pessoa física como entidade principal</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => router.back()}
              >
                Voltar
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1">
                  CPF *
                </label>
                <Input
                  value={formatCpf(form.cpf)}
                  onChange={(e) => setForm({ ...form, cpf: formatCpf(e.target.value) })}
                  placeholder="000.000.000-00"
                  required
                  maxLength={14}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1">
                  Nome Completo *
                </label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Nome completo"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1e293b] mb-1">
                    Data de Nascimento
                  </label>
                  <Input
                    type="date"
                    value={form.data_nascimento}
                    onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1e293b] mb-1">
                    RG
                  </label>
                  <Input
                    value={form.rg}
                    onChange={(e) => setForm({ ...form, rg: e.target.value })}
                    placeholder="RG"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1">
                  Nome da Mãe
                </label>
                <Input
                  value={form.nome_mae}
                  onChange={(e) => setForm({ ...form, nome_mae: e.target.value })}
                  placeholder="Nome completo da mãe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1">
                  Situação
                </label>
                <select
                  className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0369a1] bg-white text-[#1e293b]"
                  value={form.situacao}
                  onChange={(e) => setForm({ ...form, situacao: e.target.value })}
                >
                  <option value="ativa">Ativa</option>
                  <option value="inativa">Inativa</option>
                  <option value="falecida">Falecida</option>
                </select>
              </div>

              {err && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">{err}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={pending}
                  className="flex-1"
                >
                  {pending ? 'Salvando...' : 'Salvar Pessoa Física'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </main>
  );
}

