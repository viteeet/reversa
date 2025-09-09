
'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BlockList, { Column } from '@/components/sacados/BlockList';
import { formatCpfCnpj } from '@/lib/format';
import { Tabs, Tab } from './Tabs';
import StatusBadge from './StatusBadge';

type Sacado = {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  grupo: string | null;
  endereco_receita: string | null;
  telefone_receita: string | null;
  email_receita: string | null;
  observacoes: string | null;
  status_id?: string | null;
};

export default function FichaSacadoPage() {
  const router = useRouter();
  const params = useParams<{ cnpj: string }>();
  const cnpjParam = decodeURIComponent(params.cnpj);
  const [sacado, setSacado] = useState<Sacado | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  type Telefone = { id: string; origem: string | null; telefone: string };
  type Email = { id: string; origem: string | null; email: string };
  type Pessoa = { id: string; nome: string; cpf: string | null; observacoes: string | null };
  type Empresa = { id: string; empresa_nome: string; empresa_cnpj: string | null; observacoes: string | null };
  type Cedente = { id: string; nome: string; razao_social: string | null; cnpj: string | null };
  type StatusOption = { id: string; nome: string; cor: string | null };
  type SacadoCedente = { id: string; cedente_id: string };
  type Historico = { id: string; data: string; relato: string; contato: string | null; canal: string | null; autor: string | null };
  type Endereco = { id: string; origem: string | null; endereco: string };
  type Socio = { id: string; nome: string; cpf: string | null; tipo: string; observacoes: string | null };

  const [telefones, setTelefones] = useState<Telefone[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [cedentes, setCedentes] = useState<SacadoCedente[]>([]);
  const [cedenteOptions, setCedenteOptions] = useState<Cedente[]>([]);
  const [historico, setHistorico] = useState<Historico[]>([]);
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);

  useEffect(() => {
    loadSacado();
    loadTelefones();
    loadEmails();
    loadPessoas();
    loadEmpresas();
    loadCedentes();
    loadCedenteOptions();
    loadHistorico();
    loadEnderecos();
    loadSocios();
    loadStatusOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cnpjParam]);

  async function getUserOrThrow() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');
    return user;
  }

  async function loadSacado() {
      const { data, error } = await supabase
        .from('sacados')
        .select('*')
        .eq('cnpj', cnpjParam)
        .single();
      if (error) setErr(error.message);
    else setSacado(data as Sacado);
  }
  async function loadTelefones() {
    const { data, error } = await supabase
      .from('sacado_telefones')
      .select('id, origem, telefone')
      .eq('cnpj', cnpjParam)
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    setTelefones((data as Telefone[]) ?? []);
  }
  async function loadEmails() {
    const { data, error } = await supabase
      .from('sacado_emails')
      .select('id, origem, email')
      .eq('cnpj', cnpjParam)
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    setEmails((data as Email[]) ?? []);
  }
  async function loadPessoas() {
    const { data, error } = await supabase
      .from('sacado_pessoas_ligadas')
      .select('id, nome, cpf, observacoes')
      .eq('cnpj', cnpjParam)
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    setPessoas((data as Pessoa[]) ?? []);
  }
  async function loadEmpresas() {
    const { data, error } = await supabase
      .from('sacado_empresas_ligadas')
      .select('id, empresa_nome, empresa_cnpj, observacoes')
      .eq('cnpj', cnpjParam)
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    setEmpresas((data as Empresa[]) ?? []);
  }

  async function loadCedentes() {
    const { data, error } = await supabase
      .from('sacado_cedentes')
      .select('id, cedente_id')
      .eq('cnpj', cnpjParam)
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error?.message || error);
    }
    setCedentes((data as SacadoCedente[]) ?? []);
  }

  async function loadCedenteOptions() {
    const { data, error } = await supabase
      .from('cedentes')
      .select('id, nome, razao_social, cnpj')
      .order('nome', { ascending: true });
    if (error) {
      console.error(error?.message || error);
    }
    setCedenteOptions((data as Cedente[]) ?? []);
  }

  async function loadHistorico() {
    const { data, error } = await supabase
      .from('sacado_historico')
      .select('id, data, relato, contato, canal, autor')
      .eq('cnpj', cnpjParam)
      .order('data', { ascending: false });
    if (error) console.error(error);
    setHistorico((data as Historico[]) ?? []);
  }

  async function loadEnderecos() {
    const { data, error } = await supabase
      .from('sacado_enderecos')
      .select('id, origem, endereco')
      .eq('cnpj', cnpjParam)
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    setEnderecos((data as Endereco[]) ?? []);
  }

  async function loadSocios() {
    const { data, error } = await supabase
      .from('sacado_socios')
      .select('id, nome, cpf, tipo, observacoes')
      .eq('cnpj', cnpjParam)
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    setSocios((data as Socio[]) ?? []);
  }

  async function loadStatusOptions() {
    const { data, error } = await supabase
      .from('sacado_statuses')
      .select('id, nome, cor')
      .order('ordem', { ascending: true })
      .order('nome', { ascending: true });
    if (error) console.error(error);
    setStatusOptions((data as StatusOption[]) ?? []);
  }

  async function changeStatus(newStatusId: string | null) {
    if (!sacado) return;
    const fromId = sacado.status_id ?? null;
    const toId = newStatusId;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert('Não autenticado'); return; }
    const { error } = await supabase
      .from('sacados')
      .update({ status_id: toId })
      .eq('cnpj', cnpjParam);
    if (error) { alert(error.message); return; }
    setSacado(prev => prev ? { ...prev, status_id: toId } : prev);
    // registra histórico
    const { error: hErr } = await supabase.from('sacado_status_history').insert({
      cnpj: cnpjParam,
      from_status_id: fromId,
      to_status_id: toId,
      motivo: null,
      observacoes: null,
      user_id: user.id,
    });
    if (hErr) console.error(hErr);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!sacado) return;
    setSaving(true); setErr(null);
    const { error } = await supabase
      .from('sacados')
      .update({
        razao_social: sacado.razao_social,
        nome_fantasia: sacado.nome_fantasia,
        grupo: sacado.grupo,
        endereco_receita: sacado.endereco_receita,
        telefone_receita: sacado.telefone_receita,
        email_receita: sacado.email_receita,
        observacoes: sacado.observacoes
      })
      .eq('cnpj', cnpjParam);
    if (error) setErr(error.message);
    setSaving(false);
  }

  async function deleteSacado() {
    if (!confirm('Excluir este sacado?')) return;
    const { error } = await supabase.from('sacados').delete().eq('cnpj', cnpjParam);
    if (error) alert(error.message);
    else router.replace('/sacados');
  }

  if (!sacado) return <main className="p-6"><p className="muted">Carregando...</p></main>;

  const telefoneColumns: Column[] = [
    { key: 'origem', label: 'Origem' },
    { key: 'telefone', label: 'Telefone', required: true },
  ];
  const emailColumns: Column[] = [
    { key: 'origem', label: 'Origem' },
    { key: 'email', label: 'E-mail', required: true, type: 'email' },
  ];
  const pessoasColumns: Column[] = [
    { key: 'nome', label: 'Nome', required: true },
    { key: 'cpf', label: 'CPF', type: 'cpf' },
    { key: 'observacoes', label: 'Observações' },
  ];
  const empresasColumns: Column[] = [
    { key: 'empresa_nome', label: 'Nome da empresa', required: true },
    { key: 'empresa_cnpj', label: 'CNPJ', type: 'cnpj' },
    { key: 'observacoes', label: 'Observações' },
  ];
  const cedentesColumns: Column[] = [
    {
      key: 'cedente_id',
      label: 'Cedente',
      required: true,
      type: 'select',
      options: cedenteOptions.map((c) => ({
        label: `${c.razao_social ?? c.nome}${c.cnpj ? ` (${formatCpfCnpj(c.cnpj)})` : ''}`,
        value: c.id
      }))
    },
  ];
  const historicoColumns: Column[] = [
    { key: 'data', label: 'Data', required: true, type: 'date' },
    { key: 'relato', label: 'Relato', required: true, type: 'textarea' },
    { key: 'contato', label: 'Contato' },
    { key: 'canal', label: 'Canal' },
    { key: 'autor', label: 'Autor' },
  ];
  const enderecosColumns: Column[] = [
    { key: 'origem', label: 'Origem' },
    { key: 'endereco', label: 'Endereço', required: true },
  ];
  const sociosColumns: Column[] = [
    { key: 'nome', label: 'Nome', required: true },
    { key: 'cpf', label: 'CPF', type: 'cpf' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'observacoes', label: 'Observações' },
  ];

  return (
    <main className="min-h-screen p-6">
      <div className="container max-w-5xl space-y-6">
        <header className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--sand)' }}>Ficha do Sacado</h1>
            {sacado && (
              <StatusBadge statusId={sacado.status_id ?? null} />
            )}
            <div className="flex items-center gap-2">
              <label className="text-sm muted">Status</label>
              <select
                className="select h-9"
                value={sacado.status_id ?? ''}
                onChange={(e) => changeStatus(e.target.value || null)}
              >
                <option value="">Sem status</option>
                {statusOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-sm muted">Documento: <b className="not-italic text-[inherit]">{formatCpfCnpj(sacado.cnpj)}</b></p>
        </header>

        {/* Abas simples */}
        <Tabs>
          <Tab title="Dados">
            <form onSubmit={handleSave} className="card p-6 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm muted">Razão social*</label>
                  <input className="input" value={sacado.razao_social}
                    onChange={(e) => setSacado({ ...sacado, razao_social: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm muted">Nome fantasia</label>
                  <input className="input" value={sacado.nome_fantasia ?? ''}
                    onChange={(e) => setSacado({ ...sacado, nome_fantasia: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm muted">Grupo</label>
                  <input className="input" value={sacado.grupo ?? ''}
                    onChange={(e) => setSacado({ ...sacado, grupo: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm muted">Endereço (Receita)</label>
                  <input className="input" value={sacado.endereco_receita ?? ''}
                    onChange={(e) => setSacado({ ...sacado, endereco_receita: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm muted">Telefone (Receita)</label>
                  <input className="input" value={sacado.telefone_receita ?? ''}
                    onChange={(e) => setSacado({ ...sacado, telefone_receita: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm muted">E-mail (Receita)</label>
                  <input type="email" className="input" value={sacado.email_receita ?? ''}
                    onChange={(e) => setSacado({ ...sacado, email_receita: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm muted">Observações</label>
                <textarea className="textarea" value={sacado.observacoes ?? ''}
                  onChange={(e) => setSacado({ ...sacado, observacoes: e.target.value })} />
              </div>
              {err && <p className="text-sm text-red-600">{err}</p>}
              <div className="flex items-center gap-2">
                <button disabled={saving} className="btn btn-primary">{saving ? 'Salvando...' : 'Salvar'}</button>
                <button type="button" className="btn" onClick={deleteSacado}>Excluir sacado</button>
              </div>
            </form>
          </Tab>

          <Tab title="Telefones">
            <BlockList
              title="Telefones"
              addLabel="+ Adicionar telefone"
              columns={telefoneColumns}
              rows={telefones}
              searchableKeys={["origem", "telefone"]}
              onAdd={async (payload) => {
                const user = await getUserOrThrow();
                const { error } = await supabase.from('sacado_telefones').insert({
                  cnpj: cnpjParam,
                  user_id: user.id,
                  origem: payload.origem || null,
                  telefone: payload.telefone,
                });
                if (error) throw error;
                await loadTelefones();
              }}
              onDelete={async (id) => {
                const { error } = await supabase.from('sacado_telefones').delete().eq('id', id);
                if (error) throw error;
                await loadTelefones();
              }}
            />
          </Tab>

          <Tab title="E-mails">
            <BlockList
              title="E-mails"
              addLabel="+ Adicionar e-mail"
              columns={emailColumns}
              rows={emails}
              searchableKeys={["origem", "email"]}
              onAdd={async (payload) => {
                const user = await getUserOrThrow();
                const { error } = await supabase.from('sacado_emails').insert({
                  cnpj: cnpjParam,
                  user_id: user.id,
                  origem: payload.origem || null,
                  email: payload.email,
                });
                if (error) throw error;
                await loadEmails();
              }}
              onDelete={async (id) => {
                const { error } = await supabase.from('sacado_emails').delete().eq('id', id);
                if (error) throw error;
                await loadEmails();
              }}
            />
          </Tab>

          <Tab title="Pessoas ligadas">
            <BlockList
              title="Pessoas ligadas"
              addLabel="+ Adicionar pessoa"
              columns={pessoasColumns}
              rows={pessoas}
              searchableKeys={["nome", "cpf", "observacoes"]}
              onAdd={async (payload) => {
                const user = await getUserOrThrow();
                const { error } = await supabase.from('sacado_pessoas_ligadas').insert({
                  cnpj: cnpjParam,
                  user_id: user.id,
                  nome: payload.nome,
                  cpf: payload.cpf || null,
                  observacoes: payload.observacoes || null,
                });
                if (error) throw error;
                await loadPessoas();
              }}
              onDelete={async (id) => {
                const { error } = await supabase.from('sacado_pessoas_ligadas').delete().eq('id', id);
                if (error) throw error;
                await loadPessoas();
              }}
            />
          </Tab>

          <Tab title="Empresas ligadas">
            <BlockList
              title="Empresas ligadas"
              addLabel="+ Adicionar empresa"
              columns={empresasColumns}
              rows={empresas}
              searchableKeys={["empresa_nome", "empresa_cnpj", "observacoes"]}
              onAdd={async (payload) => {
                const user = await getUserOrThrow();
                const { error } = await supabase.from('sacado_empresas_ligadas').insert({
                  cnpj: cnpjParam,
                  user_id: user.id,
                  empresa_nome: payload.empresa_nome,
                  empresa_cnpj: payload.empresa_cnpj || null,
                  observacoes: payload.observacoes || null,
                });
                if (error) throw error;
                await loadEmpresas();
              }}
              onDelete={async (id) => {
                const { error } = await supabase.from('sacado_empresas_ligadas').delete().eq('id', id);
                if (error) throw error;
                await loadEmpresas();
              }}
            />
          </Tab>

          <Tab title="Cedentes">
            <BlockList
              title="Cedentes"
              addLabel="+ Vincular cedente"
              columns={cedentesColumns}
              rows={cedentes}
              searchableKeys={["cedente_id"]}
              onAdd={async (payload) => {
                const user = await getUserOrThrow();
                if (!payload.cedente_id) throw new Error('Selecione um cedente');
                const { data: existing } = await supabase
                  .from('sacado_cedentes')
                  .select('id')
                  .eq('cnpj', cnpjParam)
                  .eq('cedente_id', payload.cedente_id)
                  .limit(1)
                  .maybeSingle();
                if (existing) throw new Error('Cedente já vinculado a este sacado');
                const { error } = await supabase.from('sacado_cedentes').insert({
                  cnpj: cnpjParam,
                  user_id: user.id,
                  cedente_id: payload.cedente_id,
                });
                if (error) throw error;
                await loadCedentes();
              }}
              onDelete={async (id) => {
                const { error } = await supabase.from('sacado_cedentes').delete().eq('id', id);
                if (error) throw error;
                await loadCedentes();
              }}
            />
          </Tab>

          <Tab title="Endereços">
            <BlockList
              title="Endereços"
              addLabel="+ Adicionar endereço"
              columns={enderecosColumns}
              rows={enderecos}
              searchableKeys={["origem", "endereco"]}
              onAdd={async (payload) => {
                const user = await getUserOrThrow();
                const { error } = await supabase.from('sacado_enderecos').insert({
                  cnpj: cnpjParam,
                  user_id: user.id,
                  origem: payload.origem || null,
                  endereco: payload.endereco,
                });
                if (error) throw error;
                await loadEnderecos();
              }}
              onDelete={async (id) => {
                const { error } = await supabase.from('sacado_enderecos').delete().eq('id', id);
                if (error) throw error;
                await loadEnderecos();
              }}
            />
          </Tab>

          <Tab title="Sócios">
            <BlockList
              title="Sócios"
              addLabel="+ Adicionar sócio"
              columns={sociosColumns}
              rows={socios}
              searchableKeys={["nome", "cpf", "tipo", "observacoes"]}
              onAdd={async (payload) => {
                const user = await getUserOrThrow();
                const { error } = await supabase.from('sacado_socios').insert({
                  cnpj: cnpjParam,
                  user_id: user.id,
                  nome: payload.nome,
                  cpf: payload.cpf || null,
                  tipo: payload.tipo || 'socio',
                  observacoes: payload.observacoes || null,
                });
                if (error) throw error;
                await loadSocios();
              }}
              onDelete={async (id) => {
                const { error } = await supabase.from('sacado_socios').delete().eq('id', id);
                if (error) throw error;
                await loadSocios();
              }}
            />
          </Tab>

          <Tab title="Histórico">
            <BlockList
              title="Histórico de Cobrança"
              addLabel="+ Registrar evento"
              columns={historicoColumns}
              rows={historico}
              searchableKeys={["relato", "contato", "canal", "autor"]}
              onAdd={async (payload) => {
                const user = await getUserOrThrow();
                const { error } = await supabase.from('sacado_historico').insert({
                  cnpj: cnpjParam,
                  user_id: user.id,
                  data: payload.data,
                  relato: payload.relato,
                  contato: payload.contato || null,
                  canal: payload.canal || null,
                  autor: payload.autor || null,
                });
                if (error) throw error;
                await loadHistorico();
              }}
              onDelete={async (id) => {
                const { error } = await supabase.from('sacado_historico').delete().eq('id', id);
                if (error) throw error;
                await loadHistorico();
              }}
            />
          </Tab>
        </Tabs>
        
      </div>
    </main>
  );
}
