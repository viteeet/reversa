'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj, formatMoney, formatMoneyInput, parseMoneyInput } from '@/lib/format';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContainer';

type Parcelamento = {
  id: string;
  cedente_id: string;
  descricao: string | null;
  valor_total_negociado: number;
  taxa_juros: number | null;
  data_primeira_parcela: string;
  intervalo_parcelas: string;
  intervalo_dias: number | null;
  status: string;
  observacoes: string | null;
  created_at: string;
  titulos?: TituloNegociado[];
  parcelas?: Parcela[];
};

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
};

type TituloNegociado = {
  id: string;
  numero_titulo: string;
  valor_original: number;
  sacado_cnpj: string;
  sacado?: {
    razao_social: string;
    nome_fantasia: string | null;
  };
};

interface AcordosManagerProps {
  cedenteId: string;
}

export default function AcordosManager({ cedenteId }: AcordosManagerProps) {
  const { showToast } = useToast();
  const [parcelamentos, setParcelamentos] = useState<Parcelamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [acordosExpandidos, setAcordosExpandidos] = useState<Set<string>>(new Set());
  const [titulosExpandidos, setTitulosExpandidos] = useState<Set<string>>(new Set());
  const [showEditParcela, setShowEditParcela] = useState(false);
  const [parcelaEditando, setParcelaEditando] = useState<Parcela | null>(null);
  const [formParcela, setFormParcela] = useState({
    status: 'a_vencer',
    data_pagamento: '',
    valor_pago: '',
    observacoes: '',
  });

  useEffect(() => {
    loadParcelamentos();
  }, [cedenteId]);

  async function loadParcelamentos() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('parcelamentos')
        .select('*')
        .eq('cedente_id', cedenteId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Carrega títulos e parcelas de cada parcelamento
      const parcelamentosCompleto = await Promise.all(
        (data || []).map(async (parc: Parcelamento) => {
          // Carrega títulos do parcelamento
          const { data: titulosRelData } = await supabase
            .from('parcelamentos_titulos')
            .select('titulo_id')
            .eq('parcelamento_id', parc.id);

          const titulosIds = titulosRelData?.map((t: any) => t.titulo_id) || [];
          const titulosData = titulosIds.length > 0
            ? await supabase
                .from('titulos_negociados')
                .select('id, numero_titulo, valor_original, sacado_cnpj')
                .in('id', titulosIds)
            : { data: [] };

          // Carrega informações dos sacados
          const titulosComSacado = await Promise.all(
            (titulosData.data || []).map(async (titulo: any) => {
              const { data: sacadoData } = await supabase
                .from('sacados')
                .select('razao_social, nome_fantasia')
                .eq('cnpj', titulo.sacado_cnpj)
                .single();

              return {
                ...titulo,
                sacado: sacadoData || null,
              };
            })
          );

          // Carrega parcelas
          const { data: parcelasData } = await supabase
            .from('parcelas')
            .select('*')
            .eq('parcelamento_id', parc.id)
            .order('numero_parcela', { ascending: true });

          // Atualiza status automaticamente baseado na data de vencimento
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);
          
          const parcelasAtualizadas = await Promise.all(
            (parcelasData || []).map(async (parcela: Parcela) => {
              // Se já está paga, mantém o status
              if (parcela.status === 'paga') {
                return parcela;
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
                
                return { ...parcela, status: novoStatus };
              }

              return parcela;
            })
          );

          return {
            ...parc,
            titulos: titulosComSacado,
            parcelas: parcelasAtualizadas,
          };
        })
      );

      setParcelamentos(parcelamentosCompleto);
    } catch (error) {
      console.error('Erro ao carregar acordos:', error);
      showToast('Erro ao carregar acordos', 'error');
    } finally {
      setLoading(false);
    }
  }

  const parcelamentosFiltrados = parcelamentos.filter(parc => {
    // Filtro por status
    if (filterStatus !== 'todos' && parc.status !== filterStatus) {
      return false;
    }

    // Filtro por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchDescricao = parc.descricao?.toLowerCase().includes(query);
      const matchTitulos = parc.titulos?.some(t => 
        t.numero_titulo.toLowerCase().includes(query) ||
        t.sacado?.razao_social.toLowerCase().includes(query) ||
        t.sacado?.nome_fantasia?.toLowerCase().includes(query)
      );
      return matchDescricao || matchTitulos || false;
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'error' | 'warning' | 'neutral'> = {
      'ativo': 'success',
      'encerrado': 'neutral',
      'cancelado': 'error',
      'em_atraso': 'error',
    };
    return variants[status] || 'neutral';
  };

  const getParcelaStatusBadge = (parcela: Parcela) => {
    if (parcela.status === 'paga') return 'success';
    if (parcela.status === 'vencida') return 'error';
    if (parcela.status === 'a_vencer') return 'neutral';
    return 'warning';
  };

  const calcularTotalParcelas = (parcelas: Parcela[]) => {
    const total = parcelas.reduce((sum, p) => sum + p.valor, 0);
    const pago = parcelas
      .filter(p => p.status === 'paga')
      .reduce((sum, p) => sum + (p.valor_pago || p.valor), 0);
    const pendente = total - pago;
    const vencidas = parcelas.filter(p => {
      if (p.status === 'paga') return false;
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const vencimento = new Date(p.data_vencimento);
      vencimento.setHours(0, 0, 0, 0);
      return vencimento < hoje;
    }).length;
    const aVencer = parcelas.filter(p => {
      if (p.status === 'paga') return false;
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const vencimento = new Date(p.data_vencimento);
      vencimento.setHours(0, 0, 0, 0);
      return vencimento >= hoje;
    }).length;

    return { total, pago, pendente, vencidas, aVencer };
  };

  async function handleExcluirAcordo(parc: Parcelamento) {
    const confirmacao = confirm(
      `Tem certeza que deseja excluir o acordo "${parc.descricao || `Acordo #${parc.id.slice(0, 8)}`}"?\n\n` +
      `Esta ação irá:\n` +
      `- Excluir o acordo e todas as parcelas\n` +
      `- Reverter os títulos para "Título Original"\n\n` +
      `Esta ação não pode ser desfeita.`
    );

    if (!confirmacao) return;

    try {
      // 1. Busca os IDs dos títulos vinculados ao acordo
      const { data: titulosRelData } = await supabase
        .from('parcelamentos_titulos')
        .select('titulo_id')
        .eq('parcelamento_id', parc.id);

      const titulosIds = titulosRelData?.map((t: any) => t.titulo_id) || [];

      // 2. Reverte os títulos para "titulo_original"
      if (titulosIds.length > 0) {
        const { error: updateError } = await supabase
          .from('titulos_negociados')
          .update({ status: 'titulo_original' })
          .in('id', titulosIds);

        if (updateError) {
          console.error('Erro ao reverter status dos títulos:', updateError);
          showToast('Erro ao reverter status dos títulos', 'error');
          return;
        }
      }

      // 3. Exclui as parcelas (cascade deve fazer isso automaticamente, mas vamos garantir)
      const { error: parcelasError } = await supabase
        .from('parcelas')
        .delete()
        .eq('parcelamento_id', parc.id);

      if (parcelasError) {
        console.error('Erro ao excluir parcelas:', parcelasError);
        // Continua mesmo se houver erro (pode ser que já tenha sido excluído por cascade)
      }

      // 4. Exclui os relacionamentos parcelamentos_titulos
      const { error: relError } = await supabase
        .from('parcelamentos_titulos')
        .delete()
        .eq('parcelamento_id', parc.id);

      if (relError) {
        console.error('Erro ao excluir relacionamentos:', relError);
        // Continua mesmo se houver erro
      }

      // 5. Exclui o parcelamento
      const { error: deleteError } = await supabase
        .from('parcelamentos')
        .delete()
        .eq('id', parc.id);

      if (deleteError) throw deleteError;

      showToast('Acordo excluído com sucesso', 'success');
      loadParcelamentos();
    } catch (error: any) {
      console.error('Erro ao excluir acordo:', error);
      showToast('Erro ao excluir acordo', 'error');
    }
  }

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
      loadParcelamentos();
    } catch (error: any) {
      console.error('Erro ao atualizar parcela:', error);
      showToast('Erro ao atualizar parcela', 'error');
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Carregando acordos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-gray-300">
        <div>
          <h2 className="text-base font-semibold text-gray-700">Acordos e Parcelamentos</h2>
          <p className="text-xs text-gray-600">
            Gerencie os acordos e parcelamentos negociados deste cedente
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar acordo, título ou sacado..."
          className="flex-1 px-3 py-2 border border-gray-300 text-sm"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 text-sm"
        >
          <option value="todos">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="encerrado">Encerrado</option>
          <option value="cancelado">Cancelado</option>
          <option value="em_atraso">Em Atraso</option>
        </select>
      </div>

      {/* Lista de Acordos */}
      {parcelamentosFiltrados.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 border border-gray-300">
          <p className="text-gray-600 mb-2">Nenhum acordo encontrado</p>
          <p className="text-xs text-gray-500">
            Os acordos criados a partir dos títulos aparecerão aqui
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {parcelamentosFiltrados.map((parc) => {
            const totais = calcularTotalParcelas(parc.parcelas || []);
            const isExpandido = acordosExpandidos.has(parc.id);
            const titulosIsExpandido = titulosExpandidos.has(parc.id);
            
            return (
              <div key={parc.id} className="bg-white border border-gray-300">
                <div 
                  className="border-b border-gray-300 bg-gray-100 px-4 py-3"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div 
                      className="flex items-center gap-3 flex-1 cursor-pointer hover:bg-gray-200 -mx-4 px-4 py-1 transition-colors"
                      onClick={() => {
                        const novos = new Set(acordosExpandidos);
                        if (isExpandido) {
                          novos.delete(parc.id);
                        } else {
                          novos.add(parc.id);
                        }
                        setAcordosExpandidos(novos);
                      }}
                    >
                      <span className="text-gray-600 text-sm">
                        {isExpandido ? '▼' : '▶'}
                      </span>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {parc.descricao || `Acordo #${parc.id.slice(0, 8)}`}
                      </h3>
                      <Badge variant={getStatusBadge(parc.status)} size="sm">
                        {parc.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-600">
                        Criado em {new Date(parc.created_at).toLocaleDateString('pt-BR')}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExcluirAcordo(parc);
                        }}
                        className="px-2 py-1 border border-red-300 bg-white hover:bg-red-50 text-red-600 text-xs font-medium"
                        title="Excluir acordo"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>

                {isExpandido && (
                <div className="p-4 space-y-4">
                  {/* Informações do Acordo */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Valor Total</p>
                      <p className="font-semibold text-gray-900">{formatMoney(parc.valor_total_negociado)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">1ª Parcela</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(parc.data_primeira_parcela).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Intervalo</p>
                      <p className="font-semibold text-gray-900">
                        {parc.intervalo_parcelas === 'mensal' ? 'Mensal' :
                         parc.intervalo_parcelas === 'quinzenal' ? 'Quinzenal' :
                         parc.intervalo_dias ? `${parc.intervalo_dias} dias` : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Resumo das Parcelas */}
                  <div className="bg-gray-50 border border-gray-200 rounded p-3">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Total</p>
                        <p className="font-semibold text-gray-900">{formatMoney(totais.total)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Pago</p>
                        <p className="font-semibold text-green-600">{formatMoney(totais.pago)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Pendente</p>
                        <p className="font-semibold text-orange-600">{formatMoney(totais.pendente)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Vencidas</p>
                        <p className="font-semibold text-red-600">{totais.vencidas}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">A Vencer</p>
                        <p className="font-semibold text-blue-600">{totais.aVencer}</p>
                      </div>
                    </div>
                  </div>

                  {/* Títulos do Acordo */}
                  {parc.titulos && parc.titulos.length > 0 && (
                    <div>
                      <h4 
                        className="text-xs font-semibold text-gray-700 uppercase mb-2 cursor-pointer hover:text-gray-900 flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          const novos = new Set(titulosExpandidos);
                          if (titulosIsExpandido) {
                            novos.delete(parc.id);
                          } else {
                            novos.add(parc.id);
                          }
                          setTitulosExpandidos(novos);
                        }}
                      >
                        <span className="text-gray-500 text-xs">
                          {titulosIsExpandido ? '▼' : '▶'}
                        </span>
                        Títulos Incluídos ({parc.titulos.length})
                      </h4>
                      {titulosIsExpandido && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-2 py-2 text-left border-r border-gray-300">Título</th>
                              <th className="px-2 py-2 text-left border-r border-gray-300">Sacado</th>
                              <th className="px-2 py-2 text-left">Valor Original</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parc.titulos.map((titulo) => (
                              <tr key={titulo.id} className="border-b border-gray-200">
                                <td className="px-2 py-2 border-r border-gray-300 font-mono">
                                  {titulo.numero_titulo}
                                </td>
                                <td className="px-2 py-2 border-r border-gray-300">
                                  <Link 
                                    href={`/sacados/${encodeURIComponent(titulo.sacado_cnpj)}`}
                                    className="text-[#0369a1] hover:underline"
                                  >
                                    {titulo.sacado?.razao_social || '—'}
                                  </Link>
                                  <br />
                                  <span className="text-gray-500 font-mono text-xs">
                                    {formatCpfCnpj(titulo.sacado_cnpj)}
                                  </span>
                                </td>
                                <td className="px-2 py-2 font-semibold">
                                  {formatMoney(titulo.valor_original)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      )}
                    </div>
                  )}

                  {/* Parcelas */}
                  {parc.parcelas && parc.parcelas.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">
                        Parcelas ({parc.parcelas.length})
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-2 py-2 text-left border-r border-gray-300">#</th>
                              <th className="px-2 py-2 text-left border-r border-gray-300">Vencimento</th>
                              <th className="px-2 py-2 text-left border-r border-gray-300">Valor</th>
                              <th className="px-2 py-2 text-left border-r border-gray-300">Status</th>
                              <th className="px-2 py-2 text-left border-r border-gray-300">Pagamento</th>
                              <th className="px-2 py-2 text-left">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parc.parcelas.map((parcela) => (
                              <tr key={parcela.id} className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="px-2 py-2 border-r border-gray-300 font-medium">
                                  {parcela.numero_parcela}
                                </td>
                                <td className="px-2 py-2 border-r border-gray-300">
                                  {new Date(parcela.data_vencimento).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-2 py-2 border-r border-gray-300 font-semibold">
                                  {formatMoney(parcela.valor)}
                                </td>
                                <td className="px-2 py-2 border-r border-gray-300">
                                  <Badge variant={getParcelaStatusBadge(parcela)} size="sm">
                                    {parcela.status === 'paga' ? 'Paga' :
                                     parcela.status === 'vencida' ? 'Vencida' :
                                     parcela.status === 'a_vencer' ? 'A Vencer' : parcela.status}
                                  </Badge>
                                </td>
                                <td className="px-2 py-2 border-r border-gray-300">
                                  {parcela.data_pagamento ? (
                                    <div>
                                      <p className="font-semibold text-green-600">
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
                                <td className="px-2 py-2">
                                  <button
                                    onClick={() => abrirEditarParcela(parcela)}
                                    className="px-2 py-1 border border-gray-300 bg-white hover:bg-gray-50 text-[#0369a1] text-xs font-medium"
                                    title="Editar parcela"
                                  >
                                    Editar
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Observações */}
                  {parc.observacoes && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">Observações</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 p-2 rounded border border-gray-200">
                        {parc.observacoes}
                      </p>
                    </div>
                  )}
                </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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
  );
}

