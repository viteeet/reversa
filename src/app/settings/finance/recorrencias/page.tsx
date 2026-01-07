'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

type Recorrencia = {
  id: string;
  nome: string;
  descricao: string | null;
  tipo: 'receita' | 'despesa';
  valor: number;
  categoria_id: string | null;
  conta_id: string | null;
  meio_pagamento_id: string | null;
  dia_vencimento: number;
  frequencia: 'diaria' | 'semanal' | 'mensal' | 'trimestral' | 'semestral' | 'anual';
  data_inicio: string;
  data_fim: string | null;
  ativo: boolean;
  created_at: string;
};

export default function RecorrenciasPage() {
  const router = useRouter();
  const [items, setItems] = useState<Recorrencia[]>([]);
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    tipo: 'despesa' as 'receita' | 'despesa',
    valor: '',
    categoria_id: '',
    conta_id: '',
    meio_pagamento_id: '',
    dia_vencimento: '1',
    frequencia: 'mensal' as 'diaria' | 'semanal' | 'mensal' | 'trimestral' | 'semestral' | 'anual',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: '',
  });
  const [categorias, setCategorias] = useState<{ id: string; nome: string; natureza: string }[]>([]);
  const [contas, setContas] = useState<{ id: string; nome: string }[]>([]);
  const [meios, setMeios] = useState<{ id: string; nome: string }[]>([]);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) { router.replace('/login'); return; }
      load();
      loadCategorias();
      loadContas();
      loadMeios();
    });
  }, [router]);

  async function load() {
    const { data, error } = await supabase
      .from('recorrencias')
      .select('*')
      .order('nome', { ascending: true });
    if (error) {
      // Se a tabela não existir, não é erro crítico
      if (error.code !== 'PGRST116' && error.code !== '42P01') {
        console.error('Erro ao carregar recorrências:', error);
      }
      setItems([]);
    } else {
      setItems((data as Recorrencia[]) ?? []);
    }
  }

  async function loadCategorias() {
    const { data } = await supabase
      .from('categorias')
      .select('id, nome, natureza')
      .order('nome', { ascending: true });
    setCategorias(data || []);
  }

  async function loadContas() {
    const { data } = await supabase
      .from('contas')
      .select('id, nome')
      .order('nome', { ascending: true });
    setContas(data || []);
  }

  async function loadMeios() {
    const { data } = await supabase
      .from('meios_pagamento')
      .select('id, nome')
      .order('nome', { ascending: true });
    setMeios(data || []);
  }

  async function salvar() {
    if (!form.nome.trim()) {
      setErr('Nome é obrigatório');
      return;
    }
    if (!form.valor || Number(form.valor) <= 0) {
      setErr('Valor deve ser maior que zero');
      return;
    }
    if (!form.categoria_id) {
      setErr('Categoria é obrigatória');
      return;
    }
    if (!form.conta_id) {
      setErr('Conta é obrigatória');
      return;
    }
    if (!form.data_inicio) {
      setErr('Data de início é obrigatória');
      return;
    }

    setPending(true);
    setErr(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr('Não autenticado'); setPending(false); return; }

    const valorNum = Number(form.valor);

    if (editandoId) {
      const { error } = await supabase
        .from('recorrencias')
        .update({
          nome: form.nome.trim(),
          descricao: form.descricao || null,
          tipo: form.tipo,
          valor: valorNum,
          categoria_id: form.categoria_id,
          conta_id: form.conta_id,
          meio_pagamento_id: form.meio_pagamento_id || null,
          dia_vencimento: Number(form.dia_vencimento),
          frequencia: form.frequencia,
          data_inicio: form.data_inicio,
          data_fim: form.data_fim || null,
        })
        .eq('id', editandoId);
      
      if (error) setErr(error.message);
      else {
        setShowCreate(false);
        setEditandoId(null);
        setForm({
          nome: '', descricao: '', tipo: 'despesa', valor: '', categoria_id: '', conta_id: '', meio_pagamento_id: '',
          dia_vencimento: '1', frequencia: 'mensal', data_inicio: new Date().toISOString().split('T')[0], data_fim: '',
        });
        await load();
      }
    } else {
      const { error } = await supabase.from('recorrencias').insert({
        user_id: user.id,
        nome: form.nome.trim(),
        descricao: form.descricao || null,
        tipo: form.tipo,
        valor: valorNum,
        categoria_id: form.categoria_id,
        conta_id: form.conta_id,
        meio_pagamento_id: form.meio_pagamento_id || null,
        dia_vencimento: Number(form.dia_vencimento),
        frequencia: form.frequencia,
        data_inicio: form.data_inicio,
        data_fim: form.data_fim || null,
        ativo: true,
      });
      
      if (error) setErr(error.message);
      else {
        setShowCreate(false);
        setForm({
          nome: '', descricao: '', tipo: 'despesa', valor: '', categoria_id: '', conta_id: '', meio_pagamento_id: '',
          dia_vencimento: '1', frequencia: 'mensal', data_inicio: new Date().toISOString().split('T')[0], data_fim: '',
        });
        await load();
      }
    }
    setPending(false);
  }

  function abrirEdicao(item: Recorrencia) {
    setEditandoId(item.id);
    setForm({
      nome: item.nome,
      descricao: item.descricao || '',
      tipo: item.tipo,
      valor: item.valor.toString(),
      categoria_id: item.categoria_id || '',
      conta_id: item.conta_id || '',
      meio_pagamento_id: item.meio_pagamento_id || '',
      dia_vencimento: item.dia_vencimento.toString(),
      frequencia: item.frequencia,
      data_inicio: item.data_inicio.split('T')[0],
      data_fim: item.data_fim ? item.data_fim.split('T')[0] : '',
    });
    setShowCreate(true);
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm({
      nome: '', descricao: '', tipo: 'despesa', valor: '', categoria_id: '', conta_id: '', meio_pagamento_id: '',
      dia_vencimento: '1', frequencia: 'mensal', data_inicio: new Date().toISOString().split('T')[0], data_fim: '',
    });
    setShowCreate(false);
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    const { error } = await supabase
      .from('recorrencias')
      .update({ ativo: !ativo })
      .eq('id', id);
    if (error) alert(error.message);
    await load();
  }

  async function excluir(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta recorrência?')) return;
    const { error } = await supabase.from('recorrencias').delete().eq('id', id);
    if (error) alert(error.message);
    await load();
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container max-w-7xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <header className="mb-4">
          <button 
            onClick={() => router.push('/settings/finance')}
            className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 bg-white border border-gray-300 hover:bg-gray-50 text-[#0369a1] text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
          <div className="border-b-2 border-[#0369a1] pb-3 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#0369a1] mb-1">Recorrências Financeiras</h1>
              <p className="text-sm text-gray-600">Gerenciar lançamentos recorrentes</p>
            </div>
            <Button variant="primary" onClick={() => { setEditandoId(null); setShowCreate(true); }}>
              + Nova Recorrência
            </Button>
          </div>
        </header>

        {/* Tabela */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">
              Recorrências ({items.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            {items.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                <p>Nenhuma recorrência cadastrada</p>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Nome</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Tipo</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Valor</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Frequência</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Dia Venc.</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 border-b border-gray-300">
                      <td className="px-4 py-2 text-sm text-gray-900 border-r border-gray-300">{item.nome}</td>
                      <td className="px-4 py-2 border-r border-gray-300">
                        <Badge variant={item.tipo === 'receita' ? 'success' : 'error'}>
                          {item.tipo === 'receita' ? 'Receita' : 'Despesa'}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-sm font-semibold border-r border-gray-300">
                        {item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600 border-r border-gray-300 capitalize">{item.frequencia}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 border-r border-gray-300">{item.dia_vencimento}</td>
                      <td className="px-4 py-2 border-r border-gray-300">
                        <Badge variant={item.ativo ? 'success' : 'warning'}>
                          {item.ativo ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button 
                            className="px-2 py-1 border border-gray-300 bg-white hover:bg-gray-50 text-[#0369a1] text-xs font-medium"
                            onClick={() => abrirEdicao(item)}
                          >
                            Editar
                          </button>
                          <button 
                            className="px-2 py-1 border border-gray-300 bg-white hover:bg-gray-50 text-xs font-medium"
                            onClick={() => toggleAtivo(item.id, item.ativo)}
                          >
                            {item.ativo ? 'Desativar' : 'Ativar'}
                          </button>
                          <button 
                            className="px-2 py-1 border border-gray-300 bg-white hover:bg-gray-50 text-red-600 text-xs font-medium"
                            onClick={() => excluir(item.id)}
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Modal Criar/Editar */}
        {showCreate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white border border-gray-300 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="border-b border-gray-300 bg-gray-100 px-4 py-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700 uppercase">
                  {editandoId ? 'Editar Recorrência' : 'Nova Recorrência'}
                </h2>
                <button onClick={cancelarEdicao} className="text-gray-600 hover:text-gray-900">✕</button>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Input
                      label="Nome *"
                      placeholder="Ex: Salário, Aluguel, Internet..."
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tipo *</label>
                    <div className="flex gap-2">
                      <button
                        className={`flex-1 px-3 py-2 border text-sm font-medium ${
                          form.tipo === 'receita'
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-white text-gray-700 border-gray-300'
                        }`}
                        onClick={() => setForm({ ...form, tipo: 'receita' })}
                      >
                        Receita
                      </button>
                      <button
                        className={`flex-1 px-3 py-2 border text-sm font-medium ${
                          form.tipo === 'despesa'
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-white text-gray-700 border-gray-300'
                        }`}
                        onClick={() => setForm({ ...form, tipo: 'despesa' })}
                      >
                        Despesa
                      </button>
                    </div>
                  </div>
                  <Input
                    label="Valor *"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.valor}
                    onChange={(e) => setForm({ ...form, valor: e.target.value })}
                  />
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Dia do Vencimento *</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      className="w-full px-3 py-2 border border-gray-300 text-sm"
                      value={form.dia_vencimento}
                      onChange={(e) => setForm({ ...form, dia_vencimento: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Categoria *</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 text-sm"
                      value={form.categoria_id}
                      onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      {categorias.filter(c => c.natureza === form.tipo).map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Conta *</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 text-sm"
                      value={form.conta_id}
                      onChange={(e) => setForm({ ...form, conta_id: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      {contas.map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Meio de Pagamento</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 text-sm"
                      value={form.meio_pagamento_id}
                      onChange={(e) => setForm({ ...form, meio_pagamento_id: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      {meios.map(m => (
                        <option key={m.id} value={m.id}>{m.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Frequência *</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 text-sm"
                      value={form.frequencia}
                      onChange={(e) => setForm({ ...form, frequencia: e.target.value as any })}
                    >
                      <option value="diaria">Diária</option>
                      <option value="semanal">Semanal</option>
                      <option value="mensal">Mensal</option>
                      <option value="trimestral">Trimestral</option>
                      <option value="semestral">Semestral</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>
                  <Input
                    label="Data de Início *"
                    type="date"
                    value={form.data_inicio}
                    onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
                  />
                  <Input
                    label="Data de Fim (opcional)"
                    type="date"
                    value={form.data_fim}
                    onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
                  />
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 text-sm"
                      rows={3}
                      value={form.descricao}
                      onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                    />
                  </div>
                </div>
                {err && <p className="text-xs text-red-600">{err}</p>}
                <div className="flex gap-2 justify-end">
                  <button 
                    className="px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium"
                    onClick={cancelarEdicao}
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
        )}
      </div>
    </main>
  );
}

