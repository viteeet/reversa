'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj, formatMoney, formatMoneyInput, parseMoneyInput } from '@/lib/format';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContainer';

type Parcela = {
  id: string;
  parcelamento_id: string;
  numero_parcela: number;
  valor: number;
  data_vencimento: string;
  status: string;
  data_pagamento: string | null;
  valor_pago: number | null;
  observacoes: string | null;
  parcelamento?: {
    id: string;
    cedente_id: string;
    descricao: string | null;
    valor_total_negociado: number;
    cedente?: {
      id: string;
      nome: string;
    };
  };
};

type Cedente = {
  id: string;
  nome: string;
};

export default function AcordosOperacionaisPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [cedentes, setCedentes] = useState<Cedente[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterCedente, setFilterCedente] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditParcela, setShowEditParcela] = useState(false);
  const [parcelaEditando, setParcelaEditando] = useState<Parcela | null>(null);
  const [formParcela, setFormParcela] = useState({
    status: 'a_vencer',
    data_pagamento: '',
    valor_pago: '',
    observacoes: '',
  });
  const [periodo, setPeriodo] = useState<{ini: string, fim: string}>(() => {
    const now = new Date();
    const ini = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
    const fim = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().slice(0,10);
    return { ini, fim };
  });

  useEffect(() => {
    loadData();
  }, [periodo]);

  async function loadData() {
    try {
      setLoading(true);
      
      // Carrega cedentes
      const { data: cedentesData } = await supabase
        .from('cedentes')
        .select('id, nome')
        .order('nome', { ascending: true });
      setCedentes(cedentesData || []);

      // Carrega parcelas
      const { data: parcelasData, error } = await supabase
        .from('parcelas')
        .select('*')
        .gte('data_vencimento', periodo.ini)
        .lte('data_vencimento', periodo.fim)
        .order('data_vencimento', { ascending: true });

      if (error) throw error;

      // Carrega parcelamentos e cedentes separadamente
      const parcelamentoIds = [...new Set((parcelasData || []).map((p: any) => p.parcelamento_id))];
      const parcelamentosMap: Record<string, any> = {};
      
      if (parcelamentoIds.length > 0) {
        const { data: parcelamentosData } = await supabase
          .from('parcelamentos')
          .select('id, cedente_id, descricao, valor_total_negociado')
          .in('id', parcelamentoIds);

        if (parcelamentosData) {
          const cedenteIds = [...new Set(parcelamentosData.map(p => p.cedente_id))];
          const { data: cedentesData } = await supabase
            .from('cedentes')
            .select('id, nome')
            .in('id', cedenteIds);

          const cedentesMap: Record<string, any> = {};
          (cedentesData || []).forEach(c => {
            cedentesMap[c.id] = c;
          });

          parcelamentosData.forEach(p => {
            parcelamentosMap[p.id] = {
              ...p,
              cedente: cedentesMap[p.cedente_id] || null
            };
          });
        }
      }

      // Atualiza status automaticamente e adiciona dados do parcelamento
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      const parcelasAtualizadas = await Promise.all(
        (parcelasData || []).map(async (parcela: any) => {
          // Se já está paga, mantém
          if (parcela.status === 'paga') {
            return {
              ...parcela,
              parcelamento: parcelamentosMap[parcela.parcelamento_id] || null
            };
          }

          // Verifica se está vencida
          const vencimento = new Date(parcela.data_vencimento);
          vencimento.setHours(0, 0, 0, 0);
          
          let novoStatus = parcela.status;
          if (vencimento < hoje) {
            novoStatus = 'vencida';
          } else {
            novoStatus = 'a_vencer';
          }

          // Se o status mudou, atualiza no banco
          if (novoStatus !== parcela.status) {
            await supabase
              .from('parcelas')
              .update({ status: novoStatus })
              .eq('id', parcela.id);
            
            return {
              ...parcela,
              status: novoStatus,
              parcelamento: parcelamentosMap[parcela.parcelamento_id] || null
            };
          }

          return {
            ...parcela,
            parcelamento: parcelamentosMap[parcela.parcelamento_id] || null
          };
        })
      );

      setParcelas(parcelasAtualizadas);
    } catch (error) {
      console.error('Erro ao carregar acordos:', error);
      showToast('Erro ao carregar acordos', 'error');
    } finally {
      setLoading(false);
    }
  }

  const parcelasFiltradas = useMemo(() => {
    return parcelas.filter(parcela => {
      // Filtro por status
      if (filterStatus !== 'todos' && parcela.status !== filterStatus) {
        return false;
      }

      // Filtro por cedente
      if (filterCedente !== 'todos' && parcela.parcelamento?.cedente_id !== filterCedente) {
        return false;
      }

      // Busca
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchDescricao = parcela.parcelamento?.descricao?.toLowerCase().includes(query);
        const matchCedente = parcela.parcelamento?.cedente?.nome.toLowerCase().includes(query);
        return matchDescricao || matchCedente || false;
      }

      return true;
    });
  }, [parcelas, filterStatus, filterCedente, searchQuery]);

  const resumo = useMemo(() => {
    const total = parcelasFiltradas.reduce((sum, p) => sum + p.valor, 0);
    const pago = parcelasFiltradas
      .filter(p => p.status === 'paga')
      .reduce((sum, p) => sum + (p.valor_pago || p.valor), 0);
    const pendente = total - pago;
    const vencidas = parcelasFiltradas.filter(p => p.status === 'vencida').length;
    const aVencer = parcelasFiltradas.filter(p => p.status === 'a_vencer').length;
    const pagas = parcelasFiltradas.filter(p => p.status === 'paga').length;

    return { total, pago, pendente, vencidas, aVencer, pagas };
  }, [parcelasFiltradas]);

  const getStatusBadge = (status: string) => {
    if (status === 'paga') return 'success';
    if (status === 'vencida') return 'error';
    if (status === 'a_vencer') return 'neutral';
    return 'warning';
  };

  function abrirEditarParcela(parcela: Parcela) {
    setParcelaEditando(parcela);
    setFormParcela({
      status: parcela.status,
      data_pagamento: parcela.data_pagamento ? new Date(parcela.data_pagamento).toISOString().split('T')[0] : '',
      valor_pago: parcela.valor_pago ? formatMoneyInput(Math.round(parcela.valor_pago * 100).toString()) : '',
      observacoes: parcela.observacoes || '',
    });
    setShowEditParcela(true);
  }

  async function handleSalvarParcela() {
    if (!parcelaEditando) return;

    try {
      // Determina o status automaticamente se não foi paga
      let statusFinal = formParcela.status;
      
      // Se não está paga, verifica se está vencida
      if (formParcela.status !== 'paga') {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const vencimento = new Date(parcelaEditando.data_vencimento);
        vencimento.setHours(0, 0, 0, 0);
        
        if (vencimento < hoje) {
          statusFinal = 'vencida';
        } else {
          statusFinal = 'a_vencer';
        }
      }

      // Se está marcada como paga, precisa ter data de pagamento
      if (statusFinal === 'paga' && !formParcela.data_pagamento) {
        showToast('Informe a data de pagamento para marcar como paga', 'error');
        return;
      }

      const valorPago = formParcela.valor_pago ? parseMoneyInput(formParcela.valor_pago) : null;

      const { error } = await supabase
        .from('parcelas')
        .update({
          status: statusFinal,
          data_pagamento: formParcela.data_pagamento || null,
          valor_pago: valorPago,
          observacoes: formParcela.observacoes || null,
        })
        .eq('id', parcelaEditando.id);

      if (error) throw error;

      showToast('Parcela atualizada com sucesso', 'success');
      setShowEditParcela(false);
      setParcelaEditando(null);
      loadData();
    } catch (error: any) {
      console.error('Erro ao atualizar parcela:', error);
      showToast('Erro ao atualizar parcela', 'error');
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container max-w-7xl mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando acordos...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container max-w-7xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <header className="mb-4">
          <button 
            onClick={() => router.push('/menu/operacional')}
            className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 bg-white border border-gray-300 hover:bg-gray-50 text-[#0369a1] text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
          <div className="border-b-2 border-[#0369a1] pb-3">
            <h1 className="text-3xl font-bold text-[#0369a1] mb-1">Acordos Operacionais</h1>
            <p className="text-sm text-gray-600">Visão geral de parcelas e acordos negociados</p>
          </div>
        </header>

        {/* Resumo */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">Resumo</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Total</p>
                <p className="font-semibold text-gray-900 text-lg">{formatMoney(resumo.total)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Pago</p>
                <p className="font-semibold text-green-600 text-lg">{formatMoney(resumo.pago)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Pendente</p>
                <p className="font-semibold text-orange-600 text-lg">{formatMoney(resumo.pendente)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Vencidas</p>
                <p className="font-semibold text-red-600 text-lg">{resumo.vencidas}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">A Vencer</p>
                <p className="font-semibold text-blue-600 text-lg">{resumo.aVencer}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Pagas</p>
                <p className="font-semibold text-green-600 text-lg">{resumo.pagas}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white border border-gray-300 p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 uppercase mb-1">Período</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={periodo.ini}
                  onChange={(e) => setPeriodo({ ...periodo, ini: e.target.value })}
                  className="flex-1 px-2 py-1.5 border border-gray-300 text-sm"
                />
                <input
                  type="date"
                  value={periodo.fim}
                  onChange={(e) => setPeriodo({ ...periodo, fim: e.target.value })}
                  className="flex-1 px-2 py-1.5 border border-gray-300 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 text-sm"
              >
                <option value="todos">Todos</option>
                <option value="a_vencer">A Vencer</option>
                <option value="vencida">Vencidas</option>
                <option value="paga">Pagas</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase mb-1">Cedente</label>
              <select
                value={filterCedente}
                onChange={(e) => setFilterCedente(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 text-sm"
              >
                <option value="todos">Todos</option>
                {cedentes.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase mb-1">Buscar</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Acordo, cedente..."
                className="w-full px-2 py-1.5 border border-gray-300 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Tabela de Parcelas */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">
              Parcelas ({parcelasFiltradas.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Cedente</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Acordo</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Parcela</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Vencimento</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Valor</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Pagamento</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {parcelasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-600">
                      Nenhuma parcela encontrada no período selecionado
                    </td>
                  </tr>
                ) : (
                  parcelasFiltradas.map((parcela) => (
                    <tr key={parcela.id} className="hover:bg-gray-50 border-b border-gray-300">
                      <td className="px-4 py-2 text-sm text-gray-900 font-medium border-r border-gray-300">
                        {parcela.parcelamento?.cedente ? (
                          <Link 
                            href={`/cedentes/${parcela.parcelamento.cedente.id}`}
                            className="text-[#0369a1] hover:underline"
                          >
                            {parcela.parcelamento.cedente.nome}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600 border-r border-gray-300">
                        {parcela.parcelamento?.descricao || `Acordo #${parcela.parcelamento?.id?.slice(0, 8) || '—'}`}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 font-medium border-r border-gray-300">
                        #{parcela.numero_parcela}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600 border-r border-gray-300">
                        {new Date(parcela.data_vencimento).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-2 text-sm font-semibold text-gray-900 border-r border-gray-300">
                        {formatMoney(parcela.valor)}
                      </td>
                      <td className="px-4 py-2 border-r border-gray-300">
                        <Badge variant={getStatusBadge(parcela.status)} size="sm">
                          {parcela.status === 'paga' ? 'Paga' :
                           parcela.status === 'vencida' ? 'Vencida' :
                           parcela.status === 'a_vencer' ? 'A Vencer' : parcela.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 border-r border-gray-300">
                        {parcela.data_pagamento ? (
                          <div>
                            <p className="font-semibold text-green-600 text-sm">
                              {formatMoney(parcela.valor_pago || parcela.valor)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(parcela.data_pagamento).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => abrirEditarParcela(parcela)}
                            className="w-8 h-8 border border-gray-300 bg-white hover:bg-gray-50 text-[#0369a1] flex items-center justify-center"
                            title="Editar parcela"
                            aria-label="Editar parcela"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                            </svg>
                          </button>
                          {parcela.parcelamento?.cedente_id && (
                            <Link
                              href={`/cedentes/${parcela.parcelamento.cedente_id}?tab=acordos`}
                              className="w-8 h-8 border border-gray-300 bg-white hover:bg-gray-50 text-[#0369a1] inline-flex items-center justify-center"
                              title="Visualizar"
                              aria-label="Visualizar"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Editar Parcela */}
        {showEditParcela && parcelaEditando && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Editar Parcela #{parcelaEditando.numero_parcela}
                  </h3>
                  <button
                    onClick={() => {
                      setShowEditParcela(false);
                      setParcelaEditando(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 p-3 rounded">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Valor da Parcela</p>
                        <p className="font-semibold text-gray-900">{formatMoney(parcelaEditando.valor)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Vencimento</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(parcelaEditando.data_vencimento).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formParcela.status}
                      onChange={(e) => setFormParcela({ ...formParcela, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm"
                      required
                    >
                      <option value="a_vencer">A Vencer</option>
                      <option value="vencida">Vencida</option>
                      <option value="paga">Paga</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {formParcela.status === 'paga' && 'Ao marcar como paga, informe a data e valor do pagamento abaixo.'}
                      {formParcela.status !== 'paga' && 'O status será atualizado automaticamente baseado na data de vencimento.'}
                    </p>
                  </div>

                  {formParcela.status === 'paga' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Data de Pagamento <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={formParcela.data_pagamento}
                          onChange={(e) => setFormParcela({ ...formParcela, data_pagamento: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Valor Pago (com juros, se houver)
                        </label>
                        <input
                          type="text"
                          value={formParcela.valor_pago}
                          onChange={(e) => {
                            const formatted = formatMoneyInput(e.target.value);
                            setFormParcela({ ...formParcela, valor_pago: formatted });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 text-sm"
                          placeholder="R$ 0,00"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Se não informado, será usado o valor da parcela ({formatMoney(parcelaEditando.valor)}).
                          Informe aqui se foi pago com juros ou multa.
                        </p>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observações
                    </label>
                    <textarea
                      value={formParcela.observacoes}
                      onChange={(e) => setFormParcela({ ...formParcela, observacoes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm"
                      rows={3}
                      placeholder="Observações sobre o pagamento..."
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <Button
                    variant="primary"
                    onClick={handleSalvarParcela}
                    className="flex-1"
                  >
                    Salvar
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowEditParcela(false);
                      setParcelaEditando(null);
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

