'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import FilterBar from '@/components/ui/FilterBar';

type FaturamentoData = {
  periodo: string;
  receitas: number;
  despesas: number;
  lucro: number;
  crescimento: number;
};

export default function FaturamentoPage() {
  const [data, setData] = useState<FaturamentoData[]>([]);
  const [filtros, setFiltros] = useState({
    periodo: 'mes',
    ano: new Date().getFullYear().toString(),
    empresa: 'todas'
  });

  const loadData = useCallback(async () => {
    try {
      const { data: lancamentos, error } = await supabase
        .from('lancamentos')
        .select('*')
        .gte('data_competencia', `${filtros.ano}-01-01`)
        .lt('data_competencia', `${parseInt(filtros.ano) + 1}-01-01`);

      if (error) throw error;

      // Processar dados reais do banco por período
      const faturamentoData: FaturamentoData[] = [];
      
      if (filtros.periodo === 'mes') {
        // Agrupar por mês
        const meses = Array.from({ length: 12 }, (_, i) => i + 1);
        meses.forEach(mes => {
          const receitas = lancamentos
            ?.filter(l => l.natureza === 'receita' && new Date(l.data_competencia).getMonth() + 1 === mes)
            .reduce((acc, l) => acc + l.valor, 0) || 0;
          
          const despesas = lancamentos
            ?.filter(l => l.natureza === 'despesa' && new Date(l.data_competencia).getMonth() + 1 === mes)
            .reduce((acc, l) => acc + l.valor, 0) || 0;
          
          const lucro = receitas - despesas;
          
          if (receitas > 0 || despesas > 0) {
            faturamentoData.push({
              periodo: new Date(2024, mes - 1).toLocaleDateString('pt-BR', { month: 'long' }),
              receitas,
              despesas,
              lucro,
              crescimento: 0 // Calcular crescimento baseado no mês anterior
            });
          }
        });
      } else if (filtros.periodo === 'trimestre') {
        // Agrupar por trimestre
        const trimestres = [
          { nome: 'Q1', meses: [1, 2, 3] },
          { nome: 'Q2', meses: [4, 5, 6] },
          { nome: 'Q3', meses: [7, 8, 9] },
          { nome: 'Q4', meses: [10, 11, 12] }
        ];
        
        trimestres.forEach(trimestre => {
          const receitas = lancamentos
            ?.filter(l => l.natureza === 'receita' && trimestre.meses.includes(new Date(l.data_competencia).getMonth() + 1))
            .reduce((acc, l) => acc + l.valor, 0) || 0;
          
          const despesas = lancamentos
            ?.filter(l => l.natureza === 'despesa' && trimestre.meses.includes(new Date(l.data_competencia).getMonth() + 1))
            .reduce((acc, l) => acc + l.valor, 0) || 0;
          
          const lucro = receitas - despesas;
          
          if (receitas > 0 || despesas > 0) {
            faturamentoData.push({
              periodo: trimestre.nome,
              receitas,
              despesas,
              lucro,
              crescimento: 0
            });
          }
        });
      } else {
        // Agrupar por ano
        const receitas = lancamentos
          ?.filter(l => l.natureza === 'receita')
          .reduce((acc, l) => acc + l.valor, 0) || 0;
        
        const despesas = lancamentos
          ?.filter(l => l.natureza === 'despesa')
          .reduce((acc, l) => acc + l.valor, 0) || 0;
        
        const lucro = receitas - despesas;
        
        faturamentoData.push({
          periodo: filtros.ano,
          receitas,
          despesas,
          lucro,
          crescimento: 0
        });
      }

      setData(faturamentoData);
    } catch (error) {
      console.error('Erro ao carregar faturamento:', error);
    }
  }, [filtros]);

  useEffect(() => {
    loadData();
  }, [filtros, loadData]);

  const totalReceitas = data.reduce((acc, item) => acc + item.receitas, 0);
  const totalDespesas = data.reduce((acc, item) => acc + item.despesas, 0);
  const totalLucro = totalReceitas - totalDespesas;
  const crescimentoMedio = data.length > 0 ? data.reduce((acc, item) => acc + item.crescimento, 0) / data.length : 0;

  return (
    <main className="min-h-screen p-6">
      <div className="container max-w-7xl space-y-6">
        <header className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Faturamento</h1>
              <p className="text-slate-600">Análise de receitas e lucros</p>
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
            trend={{ value: crescimentoMedio, isPositive: crescimentoMedio > 0 }}
          />
          <StatCard 
            title="Total Despesas" 
            value={totalDespesas} 
            variant="error"
          />
          <StatCard 
            title="Lucro Total" 
            value={totalLucro} 
            variant={totalLucro > 0 ? "success" : "error"}
          />
          <StatCard 
            title="Crescimento Médio" 
            value={crescimentoMedio} 
            variant={crescimentoMedio > 0 ? "success" : "error"}
          />
        </div>

        {/* Filtros */}
        <FilterBar
          filters={filtros}
          onFilterChange={(key, value) => setFiltros({ ...filtros, [key]: value })}
          onClear={() => setFiltros({ periodo: 'mes', ano: new Date().getFullYear().toString(), empresa: 'todas' })}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
              <select 
                value={filtros.empresa}
                onChange={(e) => setFiltros({ ...filtros, empresa: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todas">Todas</option>
                <option value="empresa1">Empresa 1</option>
                <option value="empresa2">Empresa 2</option>
              </select>
            </div>
          </div>
        </FilterBar>

        {/* Tabela de Dados */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Faturamento por Período</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receitas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Despesas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lucro</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crescimento</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.periodo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                      {item.receitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                      {item.despesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${item.lucro > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.lucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${item.crescimento > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.crescimento > 0 ? '↗' : '↘'} {Math.abs(item.crescimento)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Gráfico Simulado */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Evolução do Faturamento</h3>
          </div>
          <div className="p-6">
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Gráfico de evolução do faturamento</p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
