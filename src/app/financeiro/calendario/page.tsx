'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

type LancamentoCalendario = {
  id: string;
  descricao: string;
  valor: number;
  natureza: 'receita' | 'despesa';
  data_competencia: string;
  status: string;
};

export default function CalendarioLancamentosPage() {
  const router = useRouter();
  const [lancamentos, setLancamentos] = useState<LancamentoCalendario[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [mesAtual, setMesAtual] = useState(new Date());
  const [filtros, setFiltros] = useState({
    natureza: 'todas',
    status: 'todas'
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('lancamentos')
        .select('*')
        .gte('data_competencia', new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1).toISOString())
        .lt('data_competencia', new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1).toISOString());

      if (filtros.natureza !== 'todas') {
        query = query.eq('natureza', filtros.natureza);
      }

      if (filtros.status !== 'todas') {
        query = query.eq('status', filtros.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLancamentos(data || []);
    } catch (error) {
      console.error('Erro ao carregar lançamentos:', error);
    } finally {
      setLoading(false);
    }
  }, [mesAtual, filtros]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) { router.replace('/login'); return; }
      loadData();
    });
  }, [router, loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const diasDoMes = () => {
    const primeiroDia = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);
    const ultimoDia = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0);
    const dias = [];
    
    // Adicionar dias vazios do início
    for (let i = 0; i < primeiroDia.getDay(); i++) {
      dias.push(null);
    }
    
    // Adicionar dias do mês
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      dias.push(dia);
    }
    
    return dias;
  };

  const lancamentosDoDia = (dia: number, mes?: Date) => {
    const dataRef = mes || mesAtual;
    const data = new Date(dataRef.getFullYear(), dataRef.getMonth(), dia);
    return lancamentos.filter(l => {
      const lancamentoData = new Date(l.data_competencia);
      return lancamentoData.toDateString() === data.toDateString();
    });
  };

  const lancamentosDoDiaSelecionado = lancamentos.filter(l => {
    const lancamentoData = new Date(l.data_competencia);
    return lancamentoData.toDateString() === dataSelecionada.toDateString();
  });

  const totalReceitas = lancamentos.filter(l => l.natureza === 'receita').reduce((acc, l) => acc + l.valor, 0);
  const totalDespesas = lancamentos.filter(l => l.natureza === 'despesa').reduce((acc, l) => acc + l.valor, 0);
  const totalPendente = lancamentos.filter(l => l.status === 'pendente').reduce((acc, l) => acc + l.valor, 0);

  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const nomesDias = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container max-w-7xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <header className="mb-4">
          <button 
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/menu/financeiro');
              }
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 bg-white border border-gray-300 hover:bg-gray-50 text-[#0369a1] text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
          <div className="border-b-2 border-[#0369a1] pb-3">
            <h1 className="text-3xl font-bold text-[#0369a1] mb-1">Calendário de Lançamentos</h1>
            <p className="text-sm text-gray-600">Visualização mensal dos lançamentos</p>
          </div>
        </header>

        {/* Cards de Resumo */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">Resumo</h2>
          </div>
          <div className="grid grid-cols-4 divide-x divide-gray-300 p-4">
            <div className="px-4 py-3">
              <p className="text-xs text-gray-500 uppercase mb-1">Total Receitas</p>
              <p className="text-lg font-semibold text-green-700">
                {totalReceitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs text-gray-500 uppercase mb-1">Total Despesas</p>
              <p className="text-lg font-semibold text-red-700">
                {totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs text-gray-500 uppercase mb-1">Pendente</p>
              <p className="text-lg font-semibold text-orange-700">
                {totalPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs text-gray-500 uppercase mb-1">Saldo</p>
              <p className={`text-lg font-semibold ${totalReceitas - totalDespesas > 0 ? 'text-green-700' : 'text-red-700'}`}>
                {(totalReceitas - totalDespesas).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>
        </div>

        {/* Controles do Calendário */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button 
                  className="px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-[#0369a1] text-sm font-medium"
                  onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1))}
                >
                  ←
                </button>
                <h2 className="text-base font-semibold text-gray-900 px-4">
                  {nomesMeses[mesAtual.getMonth()]} {mesAtual.getFullYear()}
                </h2>
                <button 
                  className="px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-[#0369a1] text-sm font-medium"
                  onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1))}
                >
                  →
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  className="px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-[#0369a1] text-sm font-medium"
                  onClick={() => setMesAtual(new Date())}
                >
                  Hoje
                </button>
                <Button 
                  variant="primary" 
                  onClick={() => router.push('/contas-pagar')}
                >
                  Ver Todos os Lançamentos
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">Filtros</h2>
          </div>
          <div className="p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Natureza</label>
                <select 
                  value={filtros.natureza}
                  onChange={(e) => setFiltros({ ...filtros, natureza: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 text-sm"
                >
                  <option value="todas">Todas</option>
                  <option value="receita">Receitas</option>
                  <option value="despesa">Despesas</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                <select 
                  value={filtros.status}
                  onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 text-sm"
                >
                  <option value="todas">Todos</option>
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" onClick={() => setFiltros({ natureza: 'todas', status: 'todas' })}>
                Limpar Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Calendário */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-300">
              <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
                <h3 className="text-sm font-semibold text-gray-700 uppercase">Calendário</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {nomesDias.map((dia, index) => (
                    <div key={index} className="text-center text-sm font-medium text-gray-500 py-2">
                      {dia}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {diasDoMes().map((dia, index) => {
                    if (!dia) {
                      return <div key={`empty-${index}`} className="h-12"></div>;
                    }
                    
                    const lancamentosDia = lancamentosDoDia(dia);
                    const dataDoDia = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), dia);
                    const isHoje = new Date().toDateString() === dataDoDia.toDateString();
                    const isSelecionado = dataSelecionada.toDateString() === dataDoDia.toDateString();
                    const uniqueKey = `${mesAtual.getFullYear()}-${mesAtual.getMonth()}-${dia}-${index}`;
                    
                    return (
                      <div
                        key={uniqueKey}
                        onClick={() => setDataSelecionada(new Date(mesAtual.getFullYear(), mesAtual.getMonth(), dia))}
                        className={`h-12 border border-gray-200 rounded cursor-pointer flex flex-col items-center justify-center text-sm hover:bg-gray-50 ${
                          isSelecionado ? 'bg-blue-100 border-blue-300' : ''
                        } ${isHoje ? 'bg-blue-50' : ''}`}
                      >
                        <span className={`font-medium ${isSelecionado ? 'text-blue-900' : 'text-gray-900'}`}>
                          {dia}
                        </span>
                        {lancamentosDia.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {lancamentosDia.slice(0, 2).map((l, i) => (
                              <div
                                key={`${l.id}-${i}`}
                                className={`w-1 h-1 rounded-full ${
                                  l.natureza === 'receita' ? 'bg-green-500' : 'bg-red-500'
                                }`}
                              />
                            ))}
                            {lancamentosDia.length > 2 && (
                              <div key={`more-${uniqueKey}`} className="w-1 h-1 rounded-full bg-gray-400" />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Legenda */}
                <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                    <span>Hoje</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Receber</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Pagar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lançamentos do Dia Selecionado */}
          <div>
            <div className="bg-white border border-gray-300">
              <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
                <h3 className="text-sm font-semibold text-gray-700 uppercase">
                  Lançamentos no dia selecionado
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  {dataSelecionada.toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="p-4">
                {lancamentosDoDiaSelecionado.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Nenhum lançamento neste dia</p>
                ) : (
                  <div className="space-y-3">
                    {lancamentosDoDiaSelecionado.map((lancamento) => (
                      <div key={lancamento.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{lancamento.descricao}</p>
                            <p className={`text-sm font-semibold ${
                              lancamento.natureza === 'receita' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {lancamento.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            lancamento.status === 'pago' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {lancamento.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
