'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj } from '@/lib/format';
import { useState as useClientState } from 'react';

export default function NewSacadoPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    cnpj: '', razao_social: '', nome_fantasia: '',
    grupo: '', endereco_receita: '', telefone_receita: '', email_receita: '',
    porte: '', natureza_juridica: '', situacao: '', data_abertura: '', capital_social: '',
    atividade_principal_codigo: '', atividade_principal_descricao: '', atividades_secundarias: '',
    simples_nacional: false
  });
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loadingCnpj, setLoadingCnpj] = useClientState(false);

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
      porte: form.porte || null,
      natureza_juridica: form.natureza_juridica || null,
      situacao: form.situacao || null,
      data_abertura: form.data_abertura || null,
      capital_social: form.capital_social ? Number(form.capital_social) : null,
      atividade_principal_codigo: form.atividade_principal_codigo || null,
      atividade_principal_descricao: form.atividade_principal_descricao || null,
      atividades_secundarias: form.atividades_secundarias || null,
      simples_nacional: form.simples_nacional || null,
      ultima_atualizacao: new Date().toISOString(),
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
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-sm muted">CPF/CNPJ*</label>
              <input
                className="input"
                value={formatCpfCnpj(form.cnpj)}
                onChange={(e) => setForm({ ...form, cnpj: formatCpfCnpj(e.target.value) })}
                required
              />
            </div>
            <button type="button" className="btn h-10" disabled={loadingCnpj}
              onClick={async () => {
                try {
                  setLoadingCnpj(true); setErr(null);
                  const raw = (form.cnpj || '').replace(/\D+/g, '');
                  if (!raw) { setErr('Informe um CNPJ válido'); return; }
                  const res = await fetch(`/api/cnpjws?cnpj=${raw}`);
                  const data = await res.json();
                  if (!res.ok) { setErr(data?.error || 'Erro ao consultar'); return; }
                  const rz = data?.nome || '';
                  const fantasia = data?.fantasia || '';
                  const telefone = data?.telefone || '';
                  const email = data?.email || '';
                  const endereco = [
                    data?.logradouro,
                    data?.numero,
                    data?.complemento,
                    data?.bairro,
                    data?.municipio,
                    data?.uf,
                    data?.cep,
                  ].filter(Boolean).join(', ');
                  const porte = data?.porte || '';
                  const natureza_juridica = data?.natureza_juridica || '';
                  const situacao = data?.situacao || '';
                  const data_abertura = data?.abertura || '';
                  const capital_social = data?.capital_social || '';
                  const atividade_principal_codigo = data?.atividade_principal?.[0]?.code || '';
                  const atividade_principal_descricao = data?.atividade_principal?.[0]?.text || '';
                  const atividades_secundarias = data?.atividades_secundarias?.map(a => `${a.code} - ${a.text}`).join('; ') || '';
                  const simples_nacional = data?.simples?.optante || false;
                  setForm(f => ({
                    ...f,
                    razao_social: rz,
                    nome_fantasia: fantasia,
                    telefone_receita: telefone,
                    email_receita: email,
                    endereco_receita: endereco,
                    porte, natureza_juridica, situacao, data_abertura, capital_social,
                    atividade_principal_codigo, atividade_principal_descricao, atividades_secundarias,
                    simples_nacional
                  }));
                } catch (e) {
                  setErr(e instanceof Error ? e.message : 'Erro inesperado');
                } finally {
                  setLoadingCnpj(false);
                }
              }}>
              {loadingCnpj ? 'Buscando...' : 'Preencher pela Receita'}
            </button>
          </div>
          {[
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
                value={(form as Record<string, string | boolean>)[k]?.toString() ?? ''}
                onChange={e => setForm({ ...form, [k]: e.target.value })}
                required={k === 'razao_social'}
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
