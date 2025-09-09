'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import StatCard from '@/components/ui/StatCard';
import FilterBar from '@/components/ui/FilterBar';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';

type Conta = { id: string; nome: string };
type Categoria = { id: string; nome: string; natureza: 'despesa'|'receita' };
type Meio = { id: string; nome: string };
type Elemento = { id: string; nome: string };
type Lanc = {
  id: string;
  conta_id: string;
  categoria_id: string;
  elemento_id: string | null;
  descricao: string | null;
  valor: number;
  natureza: 'despesa'|'receita';
  data_competencia: string;
  status: 'pendente'|'pago'|'previsto'|'estornado';
  meio_pagamento_id: string | null;
  terceiro: string | null;
  observacoes: string | null;
  data_pagamento: string | null;
  status_id?: string | null;
};

export default function ContasPagarPage() {
  const [periodo, setPeriodo] = useState<{ini: string, fim: string}>(() => {
    const now = new Date();
    const ini = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
    const fim = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().slice(0,10);
    return { ini, fim };
  });
  const [contas, setContas] = useState<Conta[]>([]);
  const [cats, setCats] = useState<Categoria[]>([]);
  const [meios, setMeios] = useState<Meio[]>([]);
  const [els, setEls] = useState<Elemento[]>([]);
  const [filtros, setFiltros] = useState({ conta: '', categoria: '', status: '', meio: '', elemento: '', texto: '', natureza: '' as ''|'despesa'|'receita' });
  const [items, setItems] = useState<Lanc[]>([]);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [novo, setNovo] = useState({ conta_id: '', categoria_id: '', meio_pagamento_id: '', valor: '', vencimento: '', descricao: '', natureza: 'despesa' as 'despesa'|'receita' });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { loadLookups(); }, []);
  const load = useCallback(async () => {
    setPending(true); setErr(null);
    let q = supabase
      .from('lancamentos')
      .select('*')
      .gte('data_competencia', periodo.ini)
      .lte('data_competencia', periodo.fim)
      .order('data_competencia', { ascending: true });
    if (filtros.natureza) q = q.eq('natureza', filtros.natureza);
    if (filtros.conta) q = q.eq('conta_id', filtros.conta);
    if (filtros.categoria) q = q.eq('categoria_id', filtros.categoria);
    if (filtros.status) q = q.eq('status', filtros.status);
    if (filtros.meio) q = q.eq('meio_pagamento_id', filtros.meio);
    if (filtros.elemento) q = q.eq('elemento_id', filtros.elemento);
    const { data, error } = await q.returns<Lanc[]>();
    if (error) setErr(error.message);
    setItems(data ?? []);
    setPending(false);
  }, [periodo.ini, periodo.fim, filtros.natureza, filtros.conta, filtros.categoria, filtros.status, filtros.meio, filtros.elemento]);
  useEffect(() => { load(); }, [load]);

  async function loadLookups() {
    const [c1, c2, c3, c4] = await Promise.all([
      supabase.from('contas_financeiras').select('id, nome').order('nome', { ascending: true }),
      supabase.from('categorias').select('id, nome, natureza').order('ordem', { ascending: true }).order('nome', { ascending: true }),
      supabase.from('meios_pagamento').select('id, nome').order('nome', { ascending: true }),
      supabase.from('elementos').select('id, nome').order('nome', { ascending: true }),
    ]);
    setContas((c1.data ?? []) as Conta[]);
    setCats((c2.data ?? []) as Categoria[]);
    setMeios((c3.data ?? []) as Meio[]);
    setEls((c4.data ?? []) as Elemento[]);
  }

  async function add() {
    setPending(true); setErr(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr('Não autenticado'); setPending(false); return; }
    if (!novo.conta_id || !novo.categoria_id) { setErr('Informe conta e categoria'); setPending(false); return; }
    const valorNum = Number(novo.valor);
    if (!valorNum || Number.isNaN(valorNum)) { setErr('Informe um valor válido'); setPending(false); return; }
    if (!novo.vencimento) { setErr('Informe o vencimento'); setPending(false); return; }
    const { error } = await supabase.from('lancamentos').insert({
      user_id: user.id,
      conta_id: novo.conta_id,
      categoria_id: novo.categoria_id,
      elemento_id: null,
      descricao: novo.descricao || null,
      valor: valorNum,
      natureza: novo.natureza,
      data_competencia: novo.vencimento || periodo.ini,
      status: 'pendente',
      meio_pagamento_id: novo.meio_pagamento_id || null,
      terceiro: null,
      observacoes: null,
    });
    if (error) setErr(error.message);
    setNovo({ conta_id: '', categoria_id: '', meio_pagamento_id: '', valor: '', vencimento: '', descricao: '', natureza: novo.natureza });
    await load();
    setPending(false);
    setShowModal(false);
  }

  async function marcarPago(id: string) {
    setPending(true);
    const hoje = new Date().toISOString().slice(0,10);
    const { error } = await supabase.from('lancamentos').update({ status: 'pago', data_pagamento: hoje }).eq('id', id);
    if (error) alert(error.message);
    await load();
    setPending(false);
  }

  async function estornar(id: string) {
    setPending(true);
    const { error } = await supabase.from('lancamentos').update({ status: 'pendente', data_pagamento: null }).eq('id', id);
    if (error) alert(error.message);
    await load();
    setPending(false);
  }

  async function remove(id: string) {
    const { error } = await supabase.from('lancamentos').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    await load();
  }

  const totalReceitas = useMemo(() => items.filter(l => l.natureza === 'receita').reduce((acc, l) => acc + l.valor, 0), [items]);
  const totalDespesas = useMemo(() => items.filter(l => l.natureza === 'despesa').reduce((acc, l) => acc + l.valor, 0), [items]);
  const saldo = useMemo(() => totalReceitas - totalDespesas, [totalReceitas, totalDespesas]);
  const aPagar = useMemo(() => items.filter(l => l.natureza === 'despesa' && l.status === 'pendente').reduce((acc, l) => acc + l.valor, 0), [items]);
  const aReceber = useMemo(() => items.filter(l => l.natureza === 'receita' && l.status === 'pendente').reduce((acc, l) => acc + l.valor, 0), [items]);

  const filteredItems = useMemo(() => {
    return items.filter(l => !filtros.texto || (l.descricao ?? '').toLowerCase().includes(filtros.texto.toLowerCase()));
  }, [items, filtros.texto]);

  const clearFilters = () => {
    setFiltros({ conta: '', categoria: '', status: '', meio: '', elemento: '', texto: '', natureza: '' });
  };

  const columns = [
    {
      key: 'natureza' as keyof Lanc,
      label: 'Tipo',
      render: (value: string) => (
        <Badge variant={value === 'receita' ? 'success' : 'warning'}>
          {value === 'receita' ? 'Receita' : 'Despesa'}
        </Badge>
      ),
    },
    {
      key: 'data_competencia' as keyof Lanc,
      label: 'Vencimento',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'descricao' as keyof Lanc,
      label: 'Descrição',
      render: (value: string) => value || '—',
    },
    {
      key: 'valor' as keyof Lanc,
      label: 'Valor',
      render: (value: number, item: Lanc) => (
        <span className={item.natureza === 'receita' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
          {item.natureza === 'receita' ? '+' : '-'}{value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      ),
    },
    {
      key: 'status' as keyof Lanc,
      label: 'Status',
      render: (value: string) => (
        <Badge variant={value === 'pago' ? 'success' : value === 'pendente' ? 'warning' : 'neutral'}>
          {value}
        </Badge>
      ),
    },
    {
      key: 'data_pagamento' as keyof Lanc,
      label: 'Pago em',
      render: (value: string) => value ? new Date(value).toLocaleDateString() : '—',
    },
    {
      key: 'id' as keyof Lanc,
      label: 'Ações',
      render: (value: string, item: Lanc) => (
        <div className="flex gap-1">
          {item.status !== 'pago' ? (
            <Button size="sm" variant="success" onClick={() => marcarPago(item.id)}>
              ✓
            </Button>
          ) : (
            <Button size="sm" variant="warning" onClick={() => estornar(item.id)}>
              ↶
            </Button>
          )}
          <Button size="sm" variant="error" onClick={() => remove(item.id)}>
            ✕
          </Button>
        </div>
      ),
    },
  ];

  return (
    <main className="min-h-screen p-6">
      <div className="container max-w-7xl space-y-6">
        <header className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Fluxo de Caixa</h1>
              <p className="text-slate-600">Controle de receitas e despesas</p>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm text-slate-600">
                Período: 
                <input type="date" className="ml-2 px-3 py-2 border border-slate-300 rounded-xl shadow-sm hover:border-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" value={periodo.ini} onChange={(e) => setPeriodo({ ...periodo, ini: e.target.value })} />
                <span className="mx-2">até</span>
                <input type="date" className="px-3 py-2 border border-slate-300 rounded-xl shadow-sm hover:border-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" value={periodo.fim} onChange={(e) => setPeriodo({ ...periodo, fim: e.target.value })} />
              </p>
            </div>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard 
              title="Receitas" 
              value={totalReceitas} 
              variant="success"
            />
            <StatCard 
              title="Despesas" 
              value={totalDespesas} 
              variant="error"
            />
            <StatCard 
              title="Saldo" 
              value={saldo} 
              variant={saldo >= 0 ? "success" : "error"}
            />
            <StatCard 
              title="A Pagar" 
              value={Math.abs(aPagar)} 
              variant="warning"
            />
            <StatCard 
              title="A Receber" 
              value={aReceber} 
              variant="info"
            />
          </div>
        </header>

        <FilterBar filters={filtros} onFilterChange={(key, value) => setFiltros({ ...filtros, [key]: value })} onClear={clearFilters}>
          <Select
            label="Tipo"
            value={filtros.natureza}
            onChange={(e) => setFiltros({ ...filtros, natureza: e.target.value as ''|'despesa'|'receita' })}
            options={[
              { value: '', label: 'Todos' },
              { value: 'despesa', label: 'Despesa' },
              { value: 'receita', label: 'Receita' },
            ]}
          />
          <Select
            label="Conta"
            value={filtros.conta}
            onChange={(e) => setFiltros({ ...filtros, conta: e.target.value })}
            options={[
              { value: '', label: 'Todas' },
              ...contas.map(c => ({ value: c.id, label: c.nome })),
            ]}
          />
          <Select
            label="Categoria"
            value={filtros.categoria}
            onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
            options={[
              { value: '', label: 'Todas' },
              ...cats.filter(c => !filtros.natureza || c.natureza === filtros.natureza).map(c => ({ value: c.id, label: c.nome })),
            ]}
          />
          <Select
            label="Status"
            value={filtros.status}
            onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
            options={[
              { value: '', label: 'Todos' },
              { value: 'pendente', label: 'Pendente' },
              { value: 'pago', label: 'Pago' },
              { value: 'previsto', label: 'Previsto' },
              { value: 'estornado', label: 'Estornado' },
            ]}
          />
          <Select
            label="Meio"
            value={filtros.meio}
            onChange={(e) => setFiltros({ ...filtros, meio: e.target.value })}
            options={[
              { value: '', label: 'Todos' },
              ...meios.map(m => ({ value: m.id, label: m.nome })),
            ]}
          />
          <Select
            label="Elemento"
            value={filtros.elemento}
            onChange={(e) => setFiltros({ ...filtros, elemento: e.target.value })}
            options={[
              { value: '', label: 'Todos' },
              ...els.map(e => ({ value: e.id, label: e.nome })),
            ]}
          />
          <Input
            label="Buscar"
            placeholder="Digite para buscar..."
            value={filtros.texto}
            onChange={(e) => setFiltros({ ...filtros, texto: e.target.value })}
          />
        </FilterBar>

        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => setShowModal(true)}
          >
            ➕ Novo Lançamento
          </Button>
        </div>

        <Table
          data={filteredItems}
          columns={columns}
          emptyMessage="Nenhum lançamento encontrado no período selecionado"
        />
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Adicionar Lançamento"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Tipo"
              value={novo.natureza}
              onChange={(e) => setNovo({ ...novo, natureza: e.target.value as 'despesa'|'receita' })}
              options={[
                { value: 'despesa', label: 'Despesa' },
                { value: 'receita', label: 'Receita' },
              ]}
            />
            <Select
              label="Conta"
              value={novo.conta_id}
              onChange={(e) => setNovo({ ...novo, conta_id: e.target.value })}
              options={[
                { value: '', label: 'Selecione a conta' },
                ...contas.map(c => ({ value: c.id, label: c.nome })),
              ]}
            />
            <Select
              label="Categoria"
              value={novo.categoria_id}
              onChange={(e) => setNovo({ ...novo, categoria_id: e.target.value })}
              options={[
                { value: '', label: 'Selecione a categoria' },
                ...cats.filter(c => c.natureza === novo.natureza).map(c => ({ value: c.id, label: c.nome })),
              ]}
            />
            <Select
              label="Meio de Pagamento"
              value={novo.meio_pagamento_id}
              onChange={(e) => setNovo({ ...novo, meio_pagamento_id: e.target.value })}
              options={[
                { value: '', label: 'Selecione o meio' },
                ...meios.map(m => ({ value: m.id, label: m.nome })),
              ]}
            />
            <Input
              label="Valor"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={novo.valor}
              onChange={(e) => setNovo({ ...novo, valor: e.target.value })}
            />
            <Input
              label="Vencimento"
              type="date"
              value={novo.vencimento}
              onChange={(e) => setNovo({ ...novo, vencimento: e.target.value })}
            />
          </div>
          <Input
            label="Descrição"
            placeholder="Descrição do lançamento"
            value={novo.descricao}
            onChange={(e) => setNovo({ ...novo, descricao: e.target.value })}
          />
          
          {err && <p className="text-sm text-red-600">{err}</p>}
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              variant="secondary" 
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={add} 
              loading={pending}
              disabled={!novo.conta_id || !novo.categoria_id || !novo.valor || !novo.vencimento}
            >
              Adicionar Lançamento
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}