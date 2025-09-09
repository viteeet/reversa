'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj } from '@/lib/format';

export default function NewSacadoPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    cnpj: '', razao_social: '', nome_fantasia: '',
    grupo: '', endereco_receita: '', telefone_receita: '', email_receita: ''
  });
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true); setErr(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr('Não autenticado'); setPending(false); return; }

    const { error } = await supabase.from('sacados').insert({
      cnpj: form.cnpj.trim(),
      razao_social: form.razao_social.trim(),
      nome_fantasia: form.nome_fantasia || null,
      grupo: form.grupo || null,
      endereco_receita: form.endereco_receita || null,
      telefone_receita: form.telefone_receita || null,
      email_receita: form.email_receita || null,
      user_id: user.id
    });

    if (error) setErr(error.message);
    else router.replace('/sacados');
    setPending(false);
  }

  return (
    <main className="min-h-screen p-6">
      <div className="container max-w-xl space-y-4">
        <h1 className="text-2xl font-semibold">Novo sacado</h1>

        <form onSubmit={handleSubmit} className="space-y-3 card p-6">
          {[
            ['cnpj','CPF/CNPJ*'],
            ['razao_social','Razão social*'],
            ['nome_fantasia','Nome fantasia'],
            ['grupo','Grupo'],
            ['endereco_receita','Endereço (Receita)'],
            ['telefone_receita','Telefone (Receita)'],
            ['email_receita','E-mail (Receita)'],
          ].map(([k, label]) => (
            <div key={k}>
              <label className="block text-sm muted">{label}</label>
              <input
                className="input"
                value={k === 'cnpj' ? formatCpfCnpj((form as Record<string, string>)[k] ?? '') : (form as Record<string, string>)[k] ?? ''}
                onChange={e => setForm({ ...form, [k]: k === 'cnpj' ? formatCpfCnpj(e.target.value) : e.target.value })}
                required={k === 'cnpj' || k === 'razao_social'}
              />
            </div>
          ))}

          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="flex gap-2">
            <button disabled={pending} className="btn btn-primary">
              {pending ? 'Salvando...' : 'Salvar'}
            </button>
            <button type="button" onClick={() => router.back()} className="btn">
              Voltar
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
