'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatCard from '@/components/ui/StatCard';
import FilterBar from '@/components/ui/FilterBar';
import Badge from '@/components/ui/Badge';

type LancamentoReceber = {
  id: string;
  descricao: string;
  valor: number;
  data_competencia: string;
  data_vencimento?: string;
  data_pagamento?: string;
  status: string;
  categoria_id: string;
  conta_id: string;
  terceiro?: string;
  observacoes?: string;
  categoria?: {
    id: string;
    nome: string;
    natureza: string;
  };
};

export default function AReceberPage() {
  const [lancamentos, setLancamentos] = useState<LancamentoReceber[]>([]);
  const [filtros, setFiltros] = useState({
    status: 'pendente',
    periodo: 'mes',
    ano: new Date().getFullYear().toString(),
    mes: (new Date().getMonth() + 1).toString(),
    terceiro: 'todos'
  });

  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from('lancamentos')
        .select(`
          *,
          categoria:categorias(nome, natureza),
          conta:contas_financeiras(nome, tipo)
        `)
        .eq('natureza', 'receita');

      if (error) throw error;

      // Processar dados reais do banco
      setLancamentos(data || []);
    } catch (error) {
      console.error('Erro ao carregar receitas:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [filtros]);

  const filteredLancamentos = lancamentos.filter(l => {
    if (filtros.status !== 'todos' && l.status !== filtros.status) return false;
    if (filtros.terceiro !== 'todos' && l.terceiro !== filtros.terceiro) return false;
    return true;
  });

  const totalPendente = lancamentos.filter(l => l.status === 'pendente').reduce((acc, l) => acc + l.valor, 0);
  const totalPago = lancamentos.filter(l => l.status === 'pago').reduce((acc, l) => acc + l.valor, 0);
  const emAtraso = lancamentos.filter(l => l.status === 'pendente' && new Date(l.data_vencimento || '') < new Date()).reduce((acc, l) => acc + l.valor, 0);

  const marcarComoPago = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lancamentos')
        .update({ status: 'pago' })
        .eq('id', id);
      
      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Erro ao marcar como pago:', error);
    }
  };

  return (
    <main className="min-h-screen p-6">
      <div className="container max-w-7xl space-y-6">
        <header className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">A Receber</h1>
              <p className="text-slate-600">Gestão de receitas e valores a receber</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="primary" size="lg">
                NOVO RECEBIMENTO
              </Button>
              <p className="text-sm text-slate-600">
                Última atualização: {new Date().toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </header>

        {/* Cards de Resumo */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="A Receber Hoje" 
            value={totalPendente} 
            variant="info"
          />
          <StatCard 
            title="Restante do Mês" 
            value={totalPendente} 
            variant="warning"
          />
          <StatCard 
            title="Recebimentos em Atraso" 
            value={emAtraso} 
            variant="error"
          />
          <StatCard 
            title="Total Recebido" 
            value={totalPago} 
            variant="success"
          />
        </div>

        {/* Filtros */}
        <FilterBar
          filters={filtros}
          onFilterChange={(key, value) => setFiltros({ ...filtros, [key]: value })}
          onClear={() => setFiltros({ status: 'pendente', periodo: 'mes', ano: new Date().getFullYear().toString(), mes: (new Date().getMonth() + 1).toString(), terceiro: 'todos' })}
        >
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                value={filtros.status}
                onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todos">Todos</option>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="atrasado">Em Atraso</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
              <select 
                value={filtros.periodo}
                onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="mes">Mês</option>
                <option value="ano">Ano</option>
                <option value="trimestre">Trimestre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
              <select 
                value={filtros.ano}
                onChange={(e) => setFiltros({ ...filtros, ano: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Terceiro</label>
              <select 
                value={filtros.terceiro}
                onChange={(e) => setFiltros({ ...filtros, terceiro: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todos">Todos</option>
                {/* Opções serão carregadas dinamicamente do banco */}
              </select>
            </div>
          </div>
        </FilterBar>

        {/* Tabela de Lançamentos */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Lançamentos a Receber</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terceiro</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLancamentos.map((lancamento) => (
                  <tr key={lancamento.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {lancamento.descricao}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {lancamento.terceiro}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                      {lancamento.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(lancamento.data_vencimento).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={lancamento.status === 'pago' ? 'success' : lancamento.status === 'pendente' ? 'warning' : 'error'} 
                        size="sm"
                      >
                        {lancamento.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {lancamento.categoria?.nome || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        {lancamento.status === 'pendente' && (
                          <Button 
                            variant="success" 
                            size="sm"
                            onClick={() => marcarComoPago(lancamento.id)}
                          >
                            ✓
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          ✏
                        </Button>
                        <Button variant="error" size="sm">
                          ✕
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Link para ver todos */}
        <div className="text-center">
          <Button variant="outline" onClick={() => window.location.href = '/contas-pagar'}>
            Ver todos os lançamentos
          </Button>
        </div>
      </div>
    </main>
  );
}
