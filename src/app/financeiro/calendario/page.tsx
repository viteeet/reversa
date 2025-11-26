'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatCard from '@/components/ui/StatCard';
import FilterBar from '@/components/ui/FilterBar';

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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) { router.replace('/login'); return; }
      loadData();
    });
  }, [router]);

  useEffect(() => {
    loadData();
  }, [mesAtual, filtros]);

  const loadData = async () => {
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
  };

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

  const lancamentosDoDia = (dia: number) => {
    const data = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), dia);
    return lancamentos.filter(l => {
      const lancamentoData = new Date(l.data_competencia);
      return lancamentoData.toDateString() === data.toDateString();
    });
  };

  const lancamentosDoDiaSelecionado = lancamentosDoDia(dataSelecionada.getDate());

  const totalReceitas = lancamentos.filter(l => l.natureza === 'receita').reduce((acc, l) => acc + l.valor, 0);
  const totalDespesas = lancamentos.filter(l => l.natureza === 'despesa').reduce((acc, l) => acc + l.valor, 0);
  const totalPendente = lancamentos.filter(l => l.status === 'pendente').reduce((acc, l) => acc + l.valor, 0);

  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const nomesDias = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <main className="min-h-screen p-6">
      <div className="container max-w-7xl space-y-6">
        <header className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <button 
                onClick={() => {
                  if (typeof window !== 'undefined' && window.history.length > 1) {
                    router.back();
                  } else {
                    router.push('/menu/financeiro');
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-lg bg-white border border-gray-200 hover:border-[#0369a1] hover:bg-blue-50 transition-all shadow-sm hover:shadow-md text-[#0369a1] font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Voltar
              </button>
              <h1 className="text-3xl font-bold text-[#0369a1]">Calendário de Lançamentos</h1>
              <p className="text-[#64748b]">Visualização mensal dos lançamentos</p>
            </div>
          </div>
        </header>

        {/* Cards de Resumo */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Total Receitas" 
            value={totalReceitas} 
            variant="success"
          />
          <StatCard 
            title="Total Despesas" 
            value={totalDespesas} 
            variant="error"
          />
          <StatCard 
            title="Pendente" 
            value={totalPendente} 
            variant="warning"
          />
          <StatCard 
            title="Saldo" 
            value={totalReceitas - totalDespesas} 
            variant={totalReceitas - totalDespesas > 0 ? "success" : "error"}
          />
        </div>

        {/* Controles do Calendário */}
        <Card>
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1))}
                >
                  ←
                </Button>
                <h2 className="text-xl font-semibold text-gray-900">
                  {nomesMeses[mesAtual.getMonth()]} {mesAtual.getFullYear()}
                </h2>
                <Button 
                  variant="outline" 
                  onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1))}
                >
                  →
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setMesAtual(new Date())}
                >
                  Hoje
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => router.push('/contas-pagar')}
                >
                  Ver Todos os Lançamentos
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Filtros */}
        <FilterBar
          filters={filtros}
          onFilterChange={(key, value) => setFiltros({ ...filtros, [key]: value })}
          onClear={() => setFiltros({ natureza: 'todas', status: 'todas' })}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Natureza</label>
              <select 
                value={filtros.natureza}
                onChange={(e) => setFiltros({ ...filtros, natureza: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todas">Todas</option>
                <option value="receita">Receitas</option>
                <option value="despesa">Despesas</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                value={filtros.status}
                onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todas">Todos</option>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
              </select>
            </div>
          </div>
        </FilterBar>

        {/* Calendário */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Calendário</h3>
              </div>
              <div className="p-6">
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
                      return <div key={index} className="h-12"></div>;
                    }
                    
                    const lancamentosDia = lancamentosDoDia(dia);
                    const isHoje = new Date().toDateString() === new Date(mesAtual.getFullYear(), mesAtual.getMonth(), dia).toDateString();
                    const isSelecionado = dataSelecionada.getDate() === dia;
                    
                    return (
                      <div
                        key={dia}
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
                                key={i}
                                className={`w-1 h-1 rounded-full ${
                                  l.natureza === 'receita' ? 'bg-green-500' : 'bg-red-500'
                                }`}
                              />
                            ))}
                            {lancamentosDia.length > 2 && (
                              <div className="w-1 h-1 rounded-full bg-gray-400" />
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
            </Card>
          </div>

          {/* Lançamentos do Dia Selecionado */}
          <div>
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Lançamentos no dia selecionado
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {dataSelecionada.toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="p-6">
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
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
