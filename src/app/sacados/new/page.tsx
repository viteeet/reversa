'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj } from '@/lib/format';
import { consultarCnpj } from '@/lib/cnpjws';

type Cedente = {
  id: string;
  nome: string;
  razao_social: string | null;
};

function NewSacadoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cedente_id_param = searchParams.get('cedente_id');
  
  const [cedentes, setCedentes] = useState<Cedente[]>([]);
  const [form, setForm] = useState({
    cedente_id: cedente_id_param || '',
    cnpj: '', razao_social: '', nome_fantasia: '',
    grupo: '', endereco_receita: '', telefone_receita: '', email_receita: '',
    porte: '', natureza_juridica: '', situacao: '', data_abertura: '', capital_social: '',
    atividade_principal_codigo: '', atividade_principal_descricao: '', atividades_secundarias: '',
    simples_nacional: false
  });
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loadingCnpj, setLoadingCnpj] = useState(false);

  useEffect(() => {
    loadCedentes();
  }, []);

  async function loadCedentes() {
    const { data, error } = await supabase
      .from('cedentes')
      .select('id, nome, razao_social')
      .order('nome', { ascending: true });
    
    if (error) {
      console.error('Erro ao carregar cedentes:', error);
    } else {
      setCedentes(data || []);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
    if (!form.cedente_id) {
      setErr('Selecione um cedente para este sacado');
      return;
    }
    
    setPending(true); setErr(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr('Não autenticado'); setPending(false); return; }

    const { error } = await supabase.from('sacados').insert({
      cedente_id: form.cedente_id,
      cnpj: form.cnpj.replace(/\D+/g, ''),
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
    else {
      // Redireciona para a página do cedente se veio de lá, senão para a lista de sacados
      if (cedente_id_param) {
        router.replace(`/cedentes/${cedente_id_param}?tab=sacados`);
      } else {
        router.replace('/sacados');
      }
    }
    setPending(false);
  }

  return (
    <main className="min-h-screen p-6">
      <div className="container max-w-xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#0369a1]">Novo Sacado (Devedor)</h1>
          <button type="button" onClick={() => {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back();
  } else {
    router.push('/sacados');
  }
}} className="text-[#64748b] hover:text-[#0369a1]">
            Voltar
          </button>
        </div>

        <div className="bg-[#fff7ed] border border-[#fed7aa] rounded-lg p-4">
          <p className="text-sm text-[#9a3412]">
            <strong>Atenção:</strong> Cada sacado deve pertencer a um cedente. Selecione o cedente que está cobrando este devedor.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-lg shadow p-6">
          {/* Seleção de Cedente */}
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              Cedente (Cliente)*
            </label>
            <select
              className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0369a1] bg-white text-[#1e293b]"
              value={form.cedente_id}
              onChange={(e) => setForm({ ...form, cedente_id: e.target.value })}
              required
              disabled={!!cedente_id_param}
            >
              <option value="">Selecione o cedente...</option>
              {cedentes.map(cedente => (
                <option key={cedente.id} value={cedente.id}>
                  {cedente.nome} {cedente.razao_social ? `(${cedente.razao_social})` : ''}
                </option>
              ))}
            </select>
            {cedentes.length === 0 && (
              <p className="text-sm text-[#94a3b8] mt-1">
                Nenhum cedente cadastrado. <a href="/cedentes" className="text-[#0369a1] hover:underline">Cadastre um cedente primeiro</a>.
              </p>
            )}
          </div>

          <div className="border-t border-[#e2e8f0] my-4"></div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#1e293b] mb-1">CPF/CNPJ*</label>
              <input
                className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
                value={formatCpfCnpj(form.cnpj)}
                onChange={(e) => setForm({ ...form, cnpj: formatCpfCnpj(e.target.value) })}
                required
              />
            </div>
            <button type="button" 
              className="px-4 py-2 bg-[#64748b] text-white rounded-lg hover:bg-[#475569] disabled:opacity-50"
              disabled={loadingCnpj}
              onClick={async () => {
                try {
                  setLoadingCnpj(true); 
                  setErr(null);
                  
                  const raw = (form.cnpj || '').replace(/\D+/g, '');
                  if (!raw) { 
                    setErr('Informe um CNPJ válido'); 
                    return; 
                  }
                  
                  // Usa o helper que normaliza a resposta
                  const dadosCnpj = await consultarCnpj(raw);
                  
                  setForm(f => ({
                    ...f,
                    razao_social: dadosCnpj.razao_social,
                    nome_fantasia: dadosCnpj.nome_fantasia,
                    telefone_receita: dadosCnpj.telefone,
                    email_receita: dadosCnpj.email,
                    endereco_receita: dadosCnpj.endereco,
                    porte: dadosCnpj.porte,
                    natureza_juridica: dadosCnpj.natureza_juridica,
                    situacao: dadosCnpj.situacao,
                    data_abertura: dadosCnpj.data_abertura,
                    capital_social: dadosCnpj.capital_social,
                    atividade_principal_codigo: dadosCnpj.atividade_principal_codigo,
                    atividade_principal_descricao: dadosCnpj.atividade_principal_descricao,
                    atividades_secundarias: dadosCnpj.atividades_secundarias,
                    simples_nacional: dadosCnpj.simples_nacional
                  }));
                } catch (e) {
                  setErr(e instanceof Error ? e.message : 'Erro inesperado');
                } finally {
                  setLoadingCnpj(false);
                }
              }}>
              {loadingCnpj ? 'Buscando...' : 'Consultar Receita'}
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
              <label className="block text-sm font-medium text-[#1e293b] mb-1">{label}</label>
              <input
                className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
                value={(form as Record<string, string | boolean>)[k]?.toString() ?? ''}
                onChange={e => setForm({ ...form, [k]: e.target.value })}
                required={k === 'razao_social'}
              />
            </div>
          ))}

          {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{err}</p>}
          <div className="flex gap-2 pt-4">
            <button 
              disabled={pending || cedentes.length === 0 || !form.cedente_id} 
              className="flex-1 px-4 py-2 bg-[#0369a1] text-white rounded-lg hover:bg-[#075985] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? 'Salvando...' : 'Salvar Sacado'}
            </button>
            <button type="button" onClick={() => {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back();
  } else {
    router.push('/sacados');
  }
}} className="px-4 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc]">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function NewSacadoPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen p-6">
        <div className="container max-w-xl space-y-4">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0369a1]"></div>
            <p className="mt-2 text-[#64748b]">Carregando...</p>
          </div>
        </div>
      </main>
    }>
      <NewSacadoContent />
    </Suspense>
  );
}
