'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatCard from '@/components/ui/StatCard';
import FilterBar from '@/components/ui/FilterBar';

type LancamentoRanking = {
  id: string;
  descricao: string;
  valor: number;
  natureza: 'receita' | 'despesa';
  categoria: string;
  data: string;
  status: string;
};

export default function TopReceitasDespesasPage() {
  const [receitas, setReceitas] = useState<LancamentoRanking[]>([]);
  const [despesas, setDespesas] = useState<LancamentoRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState<'receitas' | 'despesas'>('receitas');
  const [filtros, setFiltros] = useState({
    periodo: 'mes',
    ano: new Date().getFullYear().toString(),
    limite: '15'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: lancamentos, error } = await supabase
        .from('lancamentos')
        .select('*')
        .order('valor', { ascending: false });

      if (error) throw error;

      // Separar receitas e despesas
      const receitasData = lancamentos
        ?.filter(l => l.natureza === 'receita')
        .slice(0, parseInt(filtros.limite)) || [];

      const despesasData = lancamentos
        ?.filter(l => l.natureza === 'despesa')
        .slice(0, parseInt(filtros.limite)) || [];

      setReceitas(receitasData);
      setDespesas(despesasData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filtros]);

  const totalReceitas = receitas.reduce((acc, item) => acc + item.valor, 0);
  const totalDespesas = despesas.reduce((acc, item) => acc + item.valor, 0);
  const dadosAtuais = tipo === 'receitas' ? receitas : despesas;

  return (
    <main className="min-h-screen p-6">
      <div className="container max-w-7xl space-y-6">
        <header className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Top Receitas/Despesas</h1>
              <p className="text-slate-600">Ranking dos maiores lançamentos</p>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm text-slate-600">
                Última atualização: {new Date().toLocaleString('pt-BR')}
              </p>
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
            title="Maior Receita" 
            value={receitas[0]?.valor || 0} 
            variant="success"
          />
          <StatCard 
            title="Maior Despesa" 
            value={despesas[0]?.valor || 0} 
            variant="error"
          />
        </div>

        {/* Toggle Receitas/Despesas */}
        <Card>
          <div className="px-6 py-4">
            <div className="flex items-center justify-center">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setTipo('receitas')}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${
                    tipo === 'receitas'
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Receitas
                </button>
                <button
                  onClick={() => setTipo('despesas')}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${
                    tipo === 'despesas'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Despesas
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Filtros */}
        <FilterBar
          filters={filtros}
          onFilterChange={(key, value) => setFiltros({ ...filtros, [key]: value })}
          onClear={() => setFiltros({ periodo: 'mes', ano: new Date().getFullYear().toString(), limite: '15' })}
        >
          <div className="grid gap-4 sm:grid-cols-3">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Limite</label>
              <select 
                value={filtros.limite}
                onChange={(e) => setFiltros({ ...filtros, limite: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="10">Top 10</option>
                <option value="15">Top 15</option>
                <option value="20">Top 20</option>
                <option value="50">Top 50</option>
              </select>
            </div>
          </div>
        </FilterBar>

        {/* Tabela de Ranking */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Top {filtros.limite} {tipo === 'receitas' ? 'Receitas' : 'Despesas'}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dadosAtuais.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.descricao}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.categoria || '—'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                      item.natureza === 'receita' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(item.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.status === 'pago' 
                          ? 'bg-green-100 text-green-800'
                          : item.status === 'pendente'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Gráfico de Barras Simulado */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Distribuição dos Valores - {tipo === 'receitas' ? 'Receitas' : 'Despesas'}
            </h3>
          </div>
          <div className="p-6">
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Gráfico de barras dos valores</p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
