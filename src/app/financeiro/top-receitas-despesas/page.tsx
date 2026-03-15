'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/ui/PageHeader';

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
  const router = useRouter();
  const [receitas, setReceitas] = useState<LancamentoRanking[]>([]);
  const [despesas, setDespesas] = useState<LancamentoRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState<'receitas' | 'despesas'>('receitas');
  const [filtros, setFiltros] = useState({
    periodo: 'mes',
    ano: new Date().getFullYear().toString(),
    limite: '15'
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
  }, [filtros]);

  const loadData = async () => {
    setLoading(true);
    try {
      let dataInicio: Date;
      let dataFim: Date;
      
      const ano = parseInt(filtros.ano);
      const hoje = new Date();
      
      if (filtros.periodo === 'mes') {
        // Mês atual do ano selecionado
        const mesAtual = hoje.getMonth();
        dataInicio = new Date(ano, mesAtual, 1);
        dataFim = new Date(ano, mesAtual + 1, 0);
      } else if (filtros.periodo === 'trimestre') {
        // Trimestre atual do ano selecionado
        const trimestreAtual = Math.floor(hoje.getMonth() / 3);
        dataInicio = new Date(ano, trimestreAtual * 3, 1);
        dataFim = new Date(ano, (trimestreAtual + 1) * 3, 0);
      } else { // ano
        // Todo o ano selecionado
        dataInicio = new Date(ano, 0, 1);
        dataFim = new Date(ano, 11, 31);
      }

      const { data: lancamentos, error } = await supabase
        .from('lancamentos')
        .select('*')
        .gte('data_competencia', dataInicio.toISOString().split('T')[0])
        .lte('data_competencia', dataFim.toISOString().split('T')[0])
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
    <main className="min-h-screen bg-gray-50">
      <div className="container max-w-7xl mx-auto px-4 py-6 space-y-4">
        <PageHeader
          title="Top Receitas/Despesas"
          subtitle="Ranking dos maiores lancamentos"
          backHref="/menu/financeiro"
          className="mb-4"
        />

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
              <p className="text-xs text-gray-500 uppercase mb-1">Maior Receita</p>
              <p className="text-lg font-semibold text-green-700">
                {(receitas[0]?.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs text-gray-500 uppercase mb-1">Maior Despesa</p>
              <p className="text-lg font-semibold text-red-700">
                {(despesas[0]?.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>
        </div>

        {/* Toggle Receitas/Despesas */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">Tipo</h2>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-center">
              <div className="flex border border-gray-300">
                <button
                  onClick={() => setTipo('receitas')}
                  className={`px-6 py-2 text-sm font-medium border-r border-gray-300 ${
                    tipo === 'receitas'
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Receitas
                </button>
                <button
                  onClick={() => setTipo('despesas')}
                  className={`px-6 py-2 text-sm font-medium ${
                    tipo === 'despesas'
                      ? 'bg-red-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Despesas
                </button>
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
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Período</label>
                <select 
                  value={filtros.periodo}
                  onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 text-sm"
                >
                  <option value="mes">Mês</option>
                  <option value="ano">Ano</option>
                  <option value="trimestre">Trimestre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Ano</label>
                <select 
                  value={filtros.ano}
                  onChange={(e) => setFiltros({ ...filtros, ano: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 text-sm"
                >
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Limite</label>
                <select 
                  value={filtros.limite}
                  onChange={(e) => setFiltros({ ...filtros, limite: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 text-sm"
                >
                  <option value="10">Top 10</option>
                  <option value="15">Top 15</option>
                  <option value="20">Top 20</option>
                  <option value="50">Top 50</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" onClick={() => setFiltros({ periodo: 'mes', ano: new Date().getFullYear().toString(), limite: '15' })}>
                Limpar Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Tabela de Ranking */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">
              Top {filtros.limite} {tipo === 'receitas' ? 'Receitas' : 'Despesas'}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">#</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Descrição</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Categoria</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Valor</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Data</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {dadosAtuais.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50 border-b border-gray-300">
                    <td className="px-4 py-2 text-sm font-medium text-gray-900 border-r border-gray-300">
                      {index + 1}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 border-r border-gray-300">
                      {item.descricao}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 border-r border-gray-300">
                      {item.categoria || '—'}
                    </td>
                    <td className={`px-4 py-2 text-sm font-semibold border-r border-gray-300 ${
                      item.natureza === 'receita' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 border-r border-gray-300">
                      {new Date(item.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold border border-gray-300 ${
                        item.status === 'pago' 
                          ? 'bg-green-50 text-green-700'
                          : item.status === 'pendente'
                          ? 'bg-yellow-50 text-yellow-700'
                          : 'bg-gray-50 text-gray-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gráfico de Barras Simulado */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">
              Distribuição dos Valores - {tipo === 'receitas' ? 'Receitas' : 'Despesas'}
            </h2>
          </div>
          <div className="p-6">
            <div className="h-64 bg-gray-100 border border-gray-300 flex items-center justify-center">
              <p className="text-gray-600">Gráfico de barras dos valores</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
