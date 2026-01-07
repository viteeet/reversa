'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';

type AtividadeCompleta = {
  id: string;
  tipo: 'ligacao' | 'email' | 'reuniao' | 'observacao' | 'lembrete' | 'documento' | 'negociacao';
  descricao: string;
  data_hora: string;
  status: 'pendente' | 'concluida' | 'cancelada';
  proxima_acao?: string;
  data_lembrete?: string;
  observacoes?: string;
  tipo_entidade: 'sacado' | 'cedente';
  entidade_id: string;
  entidade_nome: string;
  link: string;
};

type AtividadesPorData = {
  data: string;
  atividades: AtividadeCompleta[];
};

export default function AtividadesAgendadasPage() {
  const router = useRouter();
  const [atividades, setAtividades] = useState<AtividadeCompleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pendente' | 'concluida'>('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroPeriodo, setFiltroPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'todos'>('todos');
  const [dataSelecionada, setDataSelecionada] = useState<string>('');

  const tiposAtividade = [
    { value: 'ligacao', label: 'Ligação', cor: '#3b82f6' },
    { value: 'email', label: 'Email', cor: '#10b981' },
    { value: 'reuniao', label: 'Reunião', cor: '#8b5cf6' },
    { value: 'observacao', label: 'Observação', cor: '#6b7280' },
    { value: 'lembrete', label: 'Lembrete', cor: '#f59e0b' },
    { value: 'documento', label: 'Documento', cor: '#ef4444' },
    { value: 'negociacao', label: 'Negociação', cor: '#059669' }
  ];

  const loadAtividades = useCallback(async () => {
    setLoading(true);
    try {
      // Determinar período de busca
      let dataInicio: Date;
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      switch (filtroPeriodo) {
        case 'hoje':
          dataInicio = new Date(hoje);
          break;
        case 'semana':
          dataInicio = new Date(hoje);
          dataInicio.setDate(dataInicio.getDate() - 7);
          break;
        case 'mes':
          dataInicio = new Date(hoje);
          dataInicio.setMonth(dataInicio.getMonth() - 1);
          break;
        default:
          dataInicio = new Date(0); // Todas as atividades
      }

      const dataFim = new Date();
      dataFim.setHours(23, 59, 59, 999);

      // Buscar atividades de sacados
      let sacadosQuery = supabase
        .from('sacados_atividades')
        .select('id, tipo, descricao, data_hora, status, proxima_acao, data_lembrete, observacoes, sacado_cnpj');
      
      // Aplicar filtro de data apenas se não for "todos"
      if (filtroPeriodo !== 'todos') {
        sacadosQuery = sacadosQuery
          .gte('data_hora', dataInicio.toISOString())
          .lte('data_hora', dataFim.toISOString());
      }
      
      sacadosQuery = sacadosQuery.order('data_hora', { ascending: false });

      // Buscar sacados para obter nomes
      const sacadosNomesQuery = supabase
        .from('sacados')
        .select('cnpj, razao_social');

      // Buscar atividades de cedentes
      let cedentesQuery = supabase
        .from('cedentes_atividades')
        .select('id, tipo, descricao, data_hora, status, proxima_acao, data_lembrete, observacoes, cedente_id');
      
      // Aplicar filtro de data apenas se não for "todos"
      if (filtroPeriodo !== 'todos') {
        cedentesQuery = cedentesQuery
          .gte('data_hora', dataInicio.toISOString())
          .lte('data_hora', dataFim.toISOString());
      }
      
      cedentesQuery = cedentesQuery.order('data_hora', { ascending: false });

      // Buscar cedentes para obter nomes
      const cedentesNomesQuery = supabase
        .from('cedentes')
        .select('id, nome');

      const [
        { data: sacadosData, error: sacadosError },
        { data: sacadosNomesData, error: sacadosNomesError },
        { data: cedentesData, error: cedentesError },
        { data: cedentesNomesData, error: cedentesNomesError }
      ] = await Promise.all([
        sacadosQuery,
        sacadosNomesQuery,
        cedentesQuery,
        cedentesNomesQuery
      ]);

      // Tratar erros silenciosamente (tabelas podem não existir)
      if (sacadosError && sacadosError.code !== 'PGRST116' && sacadosError.code !== '42P01') {
        console.error('Erro ao buscar atividades de sacados:', sacadosError);
      }
      if (cedentesError && cedentesError.code !== 'PGRST116' && cedentesError.code !== '42P01') {
        console.error('Erro ao buscar atividades de cedentes:', cedentesError);
      }

      const sacadosResult = { data: sacadosData, error: sacadosError };
      const sacadosNomesResult = { data: sacadosNomesData, error: sacadosNomesError };
      const cedentesResult = { data: cedentesData, error: cedentesError };
      const cedentesNomesResult = { data: cedentesNomesData, error: cedentesNomesError };

      const atividadesList: AtividadeCompleta[] = [];
      const sacadosMap = new Map((sacadosNomesResult.data || []).map((s: any) => [s.cnpj, s.razao_social]));
      const cedentesMap = new Map((cedentesNomesResult.data || []).map((c: any) => [c.id, c.nome]));

      // Processar atividades de sacados
      if (sacadosResult.data) {
        sacadosResult.data.forEach((atividade: any) => {
          atividadesList.push({
            ...atividade,
            tipo_entidade: 'sacado',
            entidade_id: atividade.sacado_cnpj,
            entidade_nome: sacadosMap.get(atividade.sacado_cnpj) || atividade.sacado_cnpj,
            link: `/sacados/${encodeURIComponent(atividade.sacado_cnpj)}`
          });
        });
      }

      // Processar atividades de cedentes
      if (cedentesResult.data) {
        cedentesResult.data.forEach((atividade: any) => {
          atividadesList.push({
            ...atividade,
            tipo_entidade: 'cedente',
            entidade_id: atividade.cedente_id,
            entidade_nome: cedentesMap.get(atividade.cedente_id) || atividade.cedente_id,
            link: `/cedentes/${atividade.cedente_id}`
          });
        });
      }

      console.log('Atividades carregadas:', atividadesList.length);
      console.log('Sacados:', sacadosResult.data?.length || 0);
      console.log('Cedentes:', cedentesResult.data?.length || 0);
      
      setAtividades(atividadesList);
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
      setAtividades([]);
    } finally {
      setLoading(false);
    }
  }, [filtroPeriodo]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) { router.replace('/login'); return; }
      loadAtividades();
    });
  }, [router, loadAtividades]);

  const atividadesFiltradas = useMemo(() => {
    let filtradas = atividades;

    // Filtro por status
    if (filtroStatus !== 'todos') {
      filtradas = filtradas.filter(a => a.status === filtroStatus);
    }

    // Filtro por tipo
    if (filtroTipo !== 'todos') {
      filtradas = filtradas.filter(a => a.tipo === filtroTipo);
    }

    // Filtro por data específica (se selecionada e não vazia)
    if (dataSelecionada && dataSelecionada.trim() !== '') {
      const dataSelecionadaStr = new Date(dataSelecionada).toISOString().split('T')[0];
      filtradas = filtradas.filter(a => {
        const atividadeData = new Date(a.data_hora).toISOString().split('T')[0];
        return atividadeData === dataSelecionadaStr;
      });
    }

    return filtradas;
  }, [atividades, filtroStatus, filtroTipo, dataSelecionada]);

  const atividadesOrdenadas = useMemo(() => {
    return [...atividadesFiltradas].sort((a, b) => 
      new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()
    );
  }, [atividadesFiltradas]);

  function formatarData(data: string): string {
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function formatarHora(dataHora: string): string {
    return new Date(dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function getTipoInfo(tipo: string) {
    return tiposAtividade.find(t => t.value === tipo) || tiposAtividade[0];
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container max-w-7xl mx-auto px-4 py-6 space-y-4">
        <header className="flex flex-col gap-4">
          <div>
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
              <h1 className="text-3xl font-bold text-[#0369a1] mb-1">Atividades Agendadas</h1>
              <p className="text-sm text-gray-600">Visualize todas as atividades por data</p>
            </div>
          </div>
        </header>

        {/* Filtros */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">Filtros</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0369a1] mb-2">Período</label>
                <Select
                  value={filtroPeriodo}
                  onChange={(e) => setFiltroPeriodo(e.target.value as any)}
                  options={[
                    { value: 'hoje', label: 'Hoje' },
                    { value: 'semana', label: 'Últimos 7 dias' },
                    { value: 'mes', label: 'Último mês' },
                    { value: 'todos', label: 'Todos' }
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0369a1] mb-2">Status</label>
                <Select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value as any)}
                  options={[
                    { value: 'todos', label: 'Todos' },
                    { value: 'pendente', label: 'Pendentes' },
                    { value: 'concluida', label: 'Concluídas' }
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0369a1] mb-2">Tipo</label>
                <Select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  options={[
                    { value: 'todos', label: 'Todos' },
                    ...tiposAtividade.map(tipo => ({ value: tipo.value, label: tipo.label }))
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0369a1] mb-2">Data Específica</label>
                <Input
                  type="date"
                  value={dataSelecionada}
                  onChange={(e) => setDataSelecionada(e.target.value)}
                />
              </div>
            </div>
            {(filtroPeriodo !== 'todos' || filtroStatus !== 'todos' || filtroTipo !== 'todos' || dataSelecionada) && (
              <div className="mt-4 flex justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setFiltroPeriodo('todos');
                    setFiltroStatus('todos');
                    setFiltroTipo('todos');
                    setDataSelecionada('');
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-300">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0369a1]"></div>
              <p className="mt-2 text-gray-600">Carregando atividades...</p>
            </div>
          </div>
        ) : atividadesOrdenadas.length === 0 ? (
          <div className="bg-white border border-gray-300">
            <div className="text-center py-12">
              <div className="flex flex-col items-center gap-3">
                <span className="text-4xl">📅</span>
                <p className="text-gray-600">Nenhuma atividade encontrada no período selecionado</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-300">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Data</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Hora</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Tipo</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Status</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Empresa</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase">Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  {atividadesOrdenadas.map(atividade => {
                    const tipoInfo = getTipoInfo(atividade.tipo);
                    const dataHora = atividade.data_hora.split('T');
                    return (
                      <tr
                        key={`${atividade.tipo_entidade}-${atividade.id}`}
                        className="hover:bg-gray-50 border-b border-gray-300 cursor-pointer group"
                        onClick={() => router.push(atividade.link)}
                      >
                        <td className="px-4 py-2 text-sm text-gray-900 font-medium text-center border-r border-gray-300">
                          {formatarData(dataHora[0])}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600 text-center border-r border-gray-300">
                          {formatarHora(atividade.data_hora)}
                        </td>
                        <td className="px-4 py-2 text-center border-r border-gray-300">
                          <span className="text-xs font-medium px-2 py-1 border border-gray-300" style={{ color: tipoInfo.cor }}>
                            {tipoInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center border-r border-gray-300">
                          <Badge
                            variant={atividade.status === 'concluida' ? 'success' : 'warning'}
                            size="sm"
                          >
                            {atividade.status === 'concluida' ? 'Concluída' : 'Pendente'}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600 text-center border-r border-gray-300">
                          {atividade.tipo_entidade === 'sacado' ? '🏢' : '👤'} {atividade.entidade_nome}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600 max-w-xs truncate text-center">
                          {atividade.descricao}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

