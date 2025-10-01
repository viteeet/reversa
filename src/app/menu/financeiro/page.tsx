'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import PizzaChart from '@/components/financeiro/PizzaChart';
import FinanceLineChart from '@/components/financeiro/LineChart';

type Lancamento = {
  id: string;
  valor: number;
  natureza: 'despesa' | 'receita';
  data_competencia: string;
  categoria_id: string;
  descricao: string | null;
};

type Categoria = {
  id: string;
  nome: string;
  natureza: 'despesa' | 'receita';
};

export default function MenuFinanceiroPage() {
  const router = useRouter();
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) { router.replace('/login'); return; }
    });
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      // Carregar lançamentos dos últimos 12 meses
      const dataInicio = new Date();
      dataInicio.setMonth(dataInicio.getMonth() - 12);
      
      const { data: lancamentosData, error: lancamentosError } = await supabase
        .from('lancamentos')
        .select('*')
        .gte('data_competencia', dataInicio.toISOString().slice(0, 10))
        .order('data_competencia', { ascending: true });

      const { data: categoriasData, error: categoriasError } = await supabase
        .from('categorias')
        .select('*');

      if (lancamentosError) throw lancamentosError;
      if (categoriasError) throw categoriasError;

      setLancamentos(lancamentosData || []);
      setCategorias(categoriasData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dados para gráfico de pizza - distribuição por categoria
  const dadosPizza = useMemo(() => {
    const categoriasMap = new Map(categorias.map(c => [c.id, c.nome]));
    const categoriaTotais = new Map<string, number>();

    lancamentos.forEach(lanc => {
      const categoriaNome = categoriasMap.get(lanc.categoria_id) || 'Sem categoria';
      const atual = categoriaTotais.get(categoriaNome) || 0;
      categoriaTotais.set(categoriaNome, atual + lanc.valor);
    });

    const cores = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'];
    
    return Array.from(categoriaTotais.entries())
      .map(([nome, valor], index) => ({
        name: nome,
        value: valor,
        color: cores[index % cores.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 categorias
  }, [lancamentos, categorias]);

  // Dados para gráfico de linha - evolução mensal
  const dadosLinha = useMemo(() => {
    const mesesMap = new Map<string, { receitas: number; despesas: number }>();

    lancamentos.forEach(lanc => {
      const mes = lanc.data_competencia.slice(0, 7); // YYYY-MM
      const atual = mesesMap.get(mes) || { receitas: 0, despesas: 0 };
      
      if (lanc.natureza === 'receita') {
        atual.receitas += lanc.valor;
      } else {
        atual.despesas += lanc.valor;
      }
      
      mesesMap.set(mes, atual);
    });

    const nomesMeses = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    return Array.from(mesesMap.entries())
      .map(([mes, totais]) => {
        const [ano, mesNum] = mes.split('-');
        const nomeMes = nomesMeses[parseInt(mesNum) - 1];
        return {
          periodo: `${nomeMes}/${ano.slice(-2)}`,
          receitas: totais.receitas,
          despesas: totais.despesas,
          saldo: totais.receitas - totais.despesas
        };
      })
      .sort((a, b) => a.periodo.localeCompare(b.periodo))
      .slice(-12); // Últimos 12 meses
  }, [lancamentos]);

  if (loading) {
    return (
      <main className="min-h-screen p-6 bg-white">
        <div className="container max-w-6xl">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0369a1]"></div>
            <p className="mt-2 text-[#64748b]">Carregando dados financeiros...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 bg-white">
      <div className="container max-w-6xl space-y-6">
        <header className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 rounded-lg border border-[#cbd5e1] hover:bg-[#f0f7ff] transition-colors"
          >
            ←
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[#0369a1]">Financeiro</h1>
            <p className="text-[#64748b]">Gestão financeira e relatórios</p>
          </div>
        </header>

        {/* Gráficos Financeiros */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Gráfico de Pizza - Distribuição por Categoria */}
          <Card>
            <div className="p-6">
              {dadosPizza.length > 0 ? (
                <PizzaChart 
                  data={dadosPizza}
                  title="Distribuição por Categoria"
                  height={350}
                />
              ) : (
                <div className="h-[350px] flex items-center justify-center text-[#64748b]">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📊</div>
                    <p>Nenhum dado disponível</p>
                    <p className="text-sm">Adicione lançamentos para ver o gráfico</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Gráfico de Linha - Evolução Mensal */}
          <Card>
            <div className="p-6">
              {dadosLinha.length > 0 ? (
                <FinanceLineChart 
                  data={dadosLinha}
                  title="Evolução Mensal"
                  height={350}
                />
              ) : (
                <div className="h-[350px] flex items-center justify-center text-[#64748b]">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📈</div>
                    <p>Nenhum dado disponível</p>
                    <p className="text-sm">Adicione lançamentos para ver o gráfico</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Cards de Acesso Rápido */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/contas-pagar" className="group">
            <Card hover className="h-full">
              <div className="p-6 text-center">
                <div className="text-4xl mb-4">💰</div>
                <h2 className="text-xl font-bold text-[#0369a1] mb-2">Contas a Pagar</h2>
                <p className="text-[#64748b]">Gestão completa de receitas e despesas</p>
              </div>
            </Card>
          </Link>

          <Link href="/financeiro/fluxo-caixa" className="group">
            <Card hover className="h-full">
              <div className="p-6 text-center">
                <div className="text-4xl mb-4">📊</div>
                <h2 className="text-xl font-bold text-[#0369a1] mb-2">Fluxo de Caixa</h2>
                <p className="text-[#64748b]">Análise de entradas e saídas</p>
              </div>
            </Card>
          </Link>

          <Link href="/financeiro/top-receitas-despesas" className="group">
            <Card hover className="h-full">
              <div className="p-6 text-center">
                <div className="text-4xl mb-4">📈</div>
                <h2 className="text-xl font-bold text-[#0369a1] mb-2">Top Receitas/Despesas</h2>
                <p className="text-[#64748b]">Ranking dos maiores lançamentos</p>
              </div>
            </Card>
          </Link>
        </div>

      </div>
    </main>
  );
}
