'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatCard from '@/components/ui/StatCard';
import FilterBar from '@/components/ui/FilterBar';

type FluxoCaixaData = {
  data: string;
  receitas: number;
  despesas: number;
  saldo: number;
  saldo_acumulado: number;
};

export default function FluxoCaixaPage() {
  const [data, setData] = useState<FluxoCaixaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipoVisualizacao, setTipoVisualizacao] = useState<'previsto' | 'realizado'>('previsto');
  const [periodo, setPeriodo] = useState<'mes' | 'ano'>('mes');
  const [filtros, setFiltros] = useState({
    ano: new Date().getFullYear().toString(),
    mes: (new Date().getMonth() + 1).toString(),
    empresa: 'todas'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: lancamentos, error } = await supabase
        .from('lancamentos')
        .select('*');

      if (error) throw error;

      // Simular dados de fluxo de caixa
      const fluxoData: FluxoCaixaData[] = [];
      const diasNoMes = new Date(parseInt(filtros.ano), parseInt(filtros.mes), 0).getDate();
      
      for (let dia = 1; dia <= diasNoMes; dia++) {
        const dataStr = `${filtros.ano}-${filtros.mes.padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
        const receitas = Math.random() * 5000 + 1000;
        const despesas = Math.random() * 3000 + 500;
        const saldo = receitas - despesas;
        
        fluxoData.push({
          data: dataStr,
          receitas,
          despesas,
          saldo,
          saldo_acumulado: fluxoData.length > 0 ? fluxoData[fluxoData.length - 1].saldo_acumulado + saldo : saldo
        });
      }

      setData(fluxoData);
    } catch (error) {
      console.error('Erro ao carregar fluxo de caixa:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filtros]);

  const totalReceitas = data.reduce((acc, item) => acc + item.receitas, 0);
  const totalDespesas = data.reduce((acc, item) => acc + item.despesas, 0);
  const saldoFinal = totalReceitas - totalDespesas;
  const saldoAcumulado = data.length > 0 ? data[data.length - 1].saldo_acumulado : 0;

  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <main className="min-h-screen p-6">
      <div className="container max-w-7xl space-y-6">
        <header className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Fluxo de Caixa</h1>
              <p className="text-slate-600">Análise de entradas e saídas de caixa</p>
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
            title="Saldo Final" 
            value={saldoFinal} 
            variant={saldoFinal > 0 ? "success" : "error"}
          />
          <StatCard 
            title="Saldo Acumulado" 
            value={saldoAcumulado} 
            variant={saldoAcumulado > 0 ? "success" : "error"}
          />
        </div>

        {/* Controles de Visualização */}
        <Card>
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setPeriodo('mes')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                      periodo === 'mes'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Mês
                  </button>
                  <button
                    onClick={() => setPeriodo('ano')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                      periodo === 'ano'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Ano
                  </button>
                </div>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setTipoVisualizacao('previsto')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                      tipoVisualizacao === 'previsto'
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Previsto
                  </button>
                  <button
                    onClick={() => setTipoVisualizacao('realizado')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                      tipoVisualizacao === 'realizado'
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Realizado
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Filtros */}
        <FilterBar
          filters={filtros}
          onFilterChange={(key, value) => setFiltros({ ...filtros, [key]: value })}
          onClear={() => setFiltros({ ano: new Date().getFullYear().toString(), mes: (new Date().getMonth() + 1).toString(), empresa: 'todas' })}
        >
          <div className="grid gap-4 sm:grid-cols-3">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
              <select 
                value={filtros.mes}
                onChange={(e) => setFiltros({ ...filtros, mes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {nomesMeses.map((mes, index) => (
                  <option key={index} value={(index + 1).toString()}>{mes}</option>
                ))}
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

        {/* Gráfico de Linha */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Evolução do Fluxo de Caixa - {nomesMeses[parseInt(filtros.mes) - 1]} {filtros.ano}
            </h3>
          </div>
          <div className="p-6">
            <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500 mb-2">Gráfico de linha do fluxo de caixa</p>
                <p className="text-sm text-gray-400">
                  Eixo Y: Valores em R$ | Eixo X: Dias do mês (1-{data.length})
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabela de Dados */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Fluxo de Caixa Diário</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receitas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Despesas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo do Dia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo Acumulado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(item.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                      {item.receitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                      {item.despesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${item.saldo > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${item.saldo_acumulado > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.saldo_acumulado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </main>
  );
}
