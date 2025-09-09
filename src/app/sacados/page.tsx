'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj } from '@/lib/format';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

type Sacado = {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  grupo: string | null;
  endereco_receita: string | null;
  telefone_receita: string | null;
  email_receita: string | null;
  situacao: string | null;
  data_abertura: string | null;
  capital_social: number | null;
  atividade_principal_codigo: string | null;
  atividade_principal_descricao: string | null;
  atividades_secundarias: string | null;
  simples_nacional: boolean | null;
  porte: string | null;
  natureza_juridica: string | null;
};

export default function SacadosPage() {
  const router = useRouter();
  const [items, setItems] = useState<Sacado[]>([]);
  const [form, setForm] = useState({ 
    nome: '', razao_social: '', cnpj: '', telefone: '', email: '', endereco: '',
    porte: '', natureza_juridica: '', situacao: '', data_abertura: '', capital_social: '',
    atividade_principal_codigo: '', atividade_principal_descricao: '', atividades_secundarias: '',
    simples_nacional: false
  });
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingCnpj, setLoadingCnpj] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace('/login');

      setLoading(true);
      const { data, error } = await supabase
        .from('sacados')
      .select('cnpj, razao_social, nome_fantasia, grupo, endereco_receita, telefone_receita, email_receita, situacao, data_abertura, capital_social, atividade_principal_codigo, atividade_principal_descricao, atividades_secundarias, simples_nacional, porte, natureza_juridica')
        .order('razao_social', { ascending: true });
      if (error) console.error(error);
      setItems(data ?? []);
      setLoading(false);
  }

  async function add() {
    if (!form.nome.trim()) return;
    setPending(true); setErr(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr('Não autenticado'); setPending(false); return; }
    const { error } = await supabase.from('sacados').insert({
      user_id: user.id,
      cnpj: form.cnpj ? formatCpfCnpj(form.cnpj) : '',
      razao_social: form.razao_social.trim(),
      nome_fantasia: form.nome.trim(),
      telefone_receita: form.telefone || null,
      email_receita: form.email || null,
      endereco_receita: form.endereco || null,
      porte: form.porte || null,
      natureza_juridica: form.natureza_juridica || null,
      situacao: form.situacao || null,
      data_abertura: form.data_abertura || null,
      capital_social: form.capital_social ? Number(form.capital_social) : null,
      atividade_principal_codigo: form.atividade_principal_codigo || null,
      atividade_principal_descricao: form.atividade_principal_descricao || null,
      atividades_secundarias: form.atividades_secundarias || null,
      simples_nacional: form.simples_nacional || null,
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

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter(s =>
      [
        s.cnpj, s.razao_social, s.nome_fantasia ?? '', s.grupo ?? '',
        s.endereco_receita ?? '', s.telefone_receita ?? '', s.email_receita ?? '',
        s.situacao ?? '', s.atividade_principal_descricao ?? '', s.porte ?? '',
        s.natureza_juridica ?? ''
      ]
        .some(v => v.toLowerCase().includes(t))
    );
  }, [items, q]);

  return (
    <main className="min-h-screen p-6">
      <div className="container max-w-6xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-gray-900">Sacados</h1>
          <p className="text-slate-600">Cadastro e gestão de sacados</p>
        </header>

        <Card>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800">Novo Sacado</h2>
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
                        if (!raw) { 
                          alert('Digite um CNPJ válido');
                          setLoadingCnpj(false);
                          return; 
                        }
                        const res = await fetch(`/api/cnpjws?cnpj=${raw}`);
                        const data = await res.json();
                        if (!res.ok) { 
                          alert(data?.error || 'Erro ao consultar CNPJ'); 
                          setLoadingCnpj(false);
                          return; 
                        }
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
                Adicionar Sacado
              </Button>
            </div>
            
            {err && <p className="text-sm text-red-600">{err}</p>}
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800">Lista de Sacados</h2>
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar sacado..."
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
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 w-32">Ações</th>
                </tr>
              </thead>
                <tbody className="divide-y divide-slate-200">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="p-6 text-center text-slate-600">Nenhum sacado encontrado.</td></tr>
                  ) : filtered.map(s => (
                    <tr key={s.cnpj} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-900 font-medium">{s.nome_fantasia ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{s.razao_social}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 font-mono">{s.cnpj ? formatCpfCnpj(s.cnpj) : '—'}</td>
                      <td className="px-4 py-3">
                        {s.situacao && (
                          <Badge variant={s.situacao === 'ATIVA' ? 'success' : s.situacao === 'INATIVA' ? 'error' : 'neutral'} size="sm">
                            {s.situacao}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{s.porte ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate" title={s.atividade_principal_descricao ?? ''}>
                        {s.atividade_principal_descricao ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link href={`/sacados/${encodeURIComponent(s.cnpj)}`}>
                            <Button variant="outline" size="sm">
                              Consultar
                            </Button>
                          </Link>
                          <Link href={`/sacados/${encodeURIComponent(s.cnpj)}/cobranca`}>
                            <Button variant="primary" size="sm">
                              Ficha
                            </Button>
                      </Link>
                        </div>
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
