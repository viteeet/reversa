'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj } from '@/lib/format';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

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

export default function CedentesPage() {
  const [items, setItems] = useState<Cedente[]>([]);
  const [form, setForm] = useState({ 
    nome: '', razao_social: '', cnpj: '', telefone: '', email: '', endereco: '',
    porte: '', natureza_juridica: '', situacao: '', data_abertura: '', capital_social: '',
    atividade_principal_codigo: '', atividade_principal_descricao: '', atividades_secundarias: '',
    simples_nacional: false
  });
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [loadingCnpj, setLoadingCnpj] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data, error } = await supabase
      .from('cedentes')
      .select('id, nome, razao_social, cnpj, telefone, email, endereco, porte, natureza_juridica, situacao, data_abertura, capital_social, atividade_principal_codigo, atividade_principal_descricao, atividades_secundarias, simples_nacional, ultima_atualizacao')
      .order('nome', { ascending: true });
    if (error) setErr(error.message);
    setItems((data as Cedente[]) ?? []);
  }

  async function add() {
    if (!form.nome.trim()) return;
    setPending(true); setErr(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr('Não autenticado'); setPending(false); return; }
    const { error } = await supabase.from('cedentes').insert({
      user_id: user.id,
      nome: form.nome.trim(),
      razao_social: form.razao_social || null,
      cnpj: form.cnpj ? formatCpfCnpj(form.cnpj) : null,
      telefone: form.telefone || null,
      email: form.email || null,
      endereco: form.endereco || null,
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
    });
    if (error) setErr(error.message);
    setForm({ 
      nome: '', razao_social: '', cnpj: '', telefone: '', email: '', endereco: '',
      porte: '', natureza_juridica: '', situacao: '', data_abertura: '', capital_social: '',
      atividade_principal_codigo: '', atividade_principal_descricao: '', atividades_secundarias: '',
      simples_nacional: false
    });
    await load();
    setPending(false);
  }

  async function remove(id: string) {
    const { error } = await supabase.from('cedentes').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    await load();
  }

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter(i => [
      i.nome, i.razao_social ?? '', i.cnpj ?? '', i.email ?? '', i.telefone ?? '', i.endereco ?? '',
      i.porte ?? '', i.natureza_juridica ?? '', i.situacao ?? '', i.atividade_principal_descricao ?? ''
    ].some(v => String(v).toLowerCase().includes(t)));
  }, [items, q]);

  return (
    <main className="min-h-screen p-6">
      <div className="container max-w-6xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-gray-900">Cedentes</h1>
          <p className="text-slate-600">Cadastro e gestão de cedentes</p>
        </header>

        <Card>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800">Novo Cedente</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Nome*"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
              <Input
                label="Razão social"
                value={form.razao_social}
                onChange={(e) => setForm({ ...form, razao_social: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ</label>
                <div className="flex gap-2">
                  <Input
                    value={form.cnpj}
                    onChange={(e) => setForm({ ...form, cnpj: formatCpfCnpj(e.target.value) })}
                    className="flex-1"
                  />
                  <Button 
                    variant="secondary" 
                    disabled={loadingCnpj}
                    onClick={async () => {
                      try {
                        setLoadingCnpj(true);
                        const raw = (form.cnpj || '').replace(/\D+/g, '');
                        if (!raw) return;
                        const res = await fetch(`/api/cnpjws?cnpj=${raw}`);
                        const data = await res.json();
                        if (!res.ok) { alert(data?.error || 'Erro ao consultar CNPJ'); return; }
                        const estabelecimento = data?.estabelecimento || {};
                        const nome = estabelecimento?.nome_fantasia || '';
                        const rz = data?.razao_social || '';
                        const telefone = estabelecimento?.telefone1 ? `(${estabelecimento.ddd1}) ${estabelecimento.telefone1}` : '';
                        const email = estabelecimento?.email || '';
                        const endereco = [
                          estabelecimento?.tipo_logradouro,
                          estabelecimento?.logradouro,
                          estabelecimento?.numero,
                          estabelecimento?.complemento,
                          estabelecimento?.bairro,
                          estabelecimento?.cidade?.nome,
                          estabelecimento?.estado?.sigla,
                          estabelecimento?.cep,
                        ].filter(Boolean).join(', ');
                        const porte = data?.porte?.descricao || '';
                        const natureza_juridica = data?.natureza_juridica?.descricao || '';
                        const situacao = estabelecimento?.situacao_cadastral || '';
                        const data_abertura = estabelecimento?.data_inicio_atividade || '';
                        const capital_social = data?.capital_social || '';
                        const atividade_principal_codigo = estabelecimento?.atividade_principal?.subclasse || '';
                        const atividade_principal_descricao = estabelecimento?.atividade_principal?.descricao || '';
                        const atividades_secundarias = estabelecimento?.atividades_secundarias?.map(a => `${a.subclasse} - ${a.descricao}`).join('; ') || '';
                        const simples_nacional = data?.simples?.simples === 'Sim';
                        setForm(f => ({ 
                          ...f, nome, razao_social: rz, telefone, email, endereco,
                          porte, natureza_juridica, situacao, data_abertura, capital_social,
                          atividade_principal_codigo, atividade_principal_descricao, atividades_secundarias,
                          simples_nacional
                        }));
                      } finally {
                        setLoadingCnpj(false);
                      }
                    }}
                  >
                    {loadingCnpj ? 'Consultando...' : 'Consultar CNPJ'}
                  </Button>
                </div>
              </div>
              <Input
                label="Telefone"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              />
              <Input
                label="E-mail"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <Input
                label="Endereço"
                value={form.endereco}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                className="sm:col-span-2"
              />
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                onClick={() => setForm({ 
                  nome: '', razao_social: '', cnpj: '', telefone: '', email: '', endereco: '',
                  porte: '', natureza_juridica: '', situacao: '', data_abertura: '', capital_social: '',
                  atividade_principal_codigo: '', atividade_principal_descricao: '', atividades_secundarias: '',
                  simples_nacional: false
                })}
              >
                Limpar
              </Button>
              <Button 
                variant="primary" 
                onClick={add} 
                loading={pending}
                disabled={!form.nome}
              >
                Adicionar Cedente
              </Button>
            </div>
            
            {err && <p className="text-sm text-red-600">{err}</p>}
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800">Lista de Cedentes</h2>
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar cedente..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-64"
                />
                <Button variant="secondary" onClick={() => setQ('')}>
                  Limpar
                </Button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-50 to-blue-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Nome</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Razão social</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">CNPJ</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Situação</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Porte</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Atividade</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 w-24">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="p-6 text-center text-slate-600">Nenhum cedente encontrado.</td></tr>
                  ) : filtered.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-900 font-medium">{c.nome}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{c.razao_social ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 font-mono">{c.cnpj ? formatCpfCnpj(c.cnpj) : '—'}</td>
                      <td className="px-4 py-3">
                        {c.situacao && (
                          <Badge variant={c.situacao === 'ATIVA' ? 'success' : c.situacao === 'INATIVA' ? 'error' : 'neutral'} size="sm">
                            {c.situacao}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{c.porte ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate" title={c.atividade_principal_descricao ?? ''}>
                        {c.atividade_principal_descricao ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="error" size="sm" onClick={() => remove(c.id)}>
                          Excluir
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}


