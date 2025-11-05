'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Card from '@/components/ui/Card';
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
  const [filtroPeriodo, setFiltroPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'todos'>('semana');
  const [dataSelecionada, setDataSelecionada] = useState<string>(new Date().toISOString().split('T')[0]);

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
      const sacadosQuery = Promise.resolve(
        supabase
          .from('sacados_atividades')
          .select('id, tipo, descricao, data_hora, status, proxima_acao, data_lembrete, observacoes, sacado_cnpj')
          .gte('data_hora', dataInicio.toISOString())
          .lte('data_hora', dataFim.toISOString())
          .order('data_hora', { ascending: true })
      ).then(result => ({ data: result.data, error: result.error }))
      .catch(() => ({ data: null, error: null }));

      // Buscar sacados para obter nomes
      const sacadosNomesQuery = Promise.resolve(
        supabase
          .from('sacados')
          .select('cnpj, razao_social')
      ).then(result => ({ data: result.data, error: result.error }))
      .catch(() => ({ data: null, error: null }));

      // Buscar atividades de cedentes
      const cedentesQuery = Promise.resolve(
        supabase
          .from('cedentes_atividades')
          .select('id, tipo, descricao, data_hora, status, proxima_acao, data_lembrete, observacoes, cedente_id')
          .gte('data_hora', dataInicio.toISOString())
          .lte('data_hora', dataFim.toISOString())
          .order('data_hora', { ascending: true })
      ).then(result => ({ data: result.data, error: result.error }))
      .catch(() => ({ data: null, error: null }));

      // Buscar cedentes para obter nomes
      const cedentesNomesQuery = Promise.resolve(
        supabase
          .from('cedentes')
          .select('id, nome')
      ).then(result => ({ data: result.data, error: result.error }))
      .catch(() => ({ data: null, error: null }));

      const [sacadosResult, sacadosNomesResult, cedentesResult, cedentesNomesResult] = await Promise.all([
        sacadosQuery,
        sacadosNomesQuery,
        cedentesQuery,
        cedentesNomesQuery
      ]);

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

      setAtividades(atividadesList);
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
      setAtividades([]);
    } finally {
      setLoading(false);
    }
  }, [filtroPeriodo]);

  useEffect(() => {
    loadAtividades();
  }, [loadAtividades]);

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

    return filtradas;
  }, [atividades, filtroStatus, filtroTipo]);

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
    <main className="min-h-screen p-6">
      <div className="container max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Atividades Agendadas</h1>
          <p className="text-slate-600">Visualize todas as atividades por data</p>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Ver Data Específica</label>
              <Input
                type="date"
                value={dataSelecionada}
                onChange={(e) => setDataSelecionada(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {loading ? (
          <Card>
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Carregando atividades...</p>
            </div>
          </Card>
        ) : atividadesOrdenadas.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <p className="text-gray-600">Nenhuma atividade encontrada no período selecionado</p>
            </div>
          </Card>
        ) : (
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Entidade</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {atividadesOrdenadas.map(atividade => {
                    const tipoInfo = getTipoInfo(atividade.tipo);
                    const dataHora = atividade.data_hora.split('T');
                    return (
                      <tr
                        key={`${atividade.tipo_entidade}-${atividade.id}`}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => router.push(atividade.link)}
                      >
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {formatarData(dataHora[0])}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {formatarHora(atividade.data_hora)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ backgroundColor: `${tipoInfo.cor}20`, color: tipoInfo.cor }}>
                            {tipoInfo.label}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <Badge
                            variant={atividade.status === 'concluida' ? 'success' : 'warning'}
                            size="sm"
                          >
                            {atividade.status === 'concluida' ? 'Concluída' : 'Pendente'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {atividade.tipo_entidade === 'sacado' ? '🏢' : '👤'} {atividade.entidade_nome}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-900 max-w-xs truncate">
                          {atividade.descricao}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}

