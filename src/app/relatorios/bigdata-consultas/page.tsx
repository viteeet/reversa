'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { formatCpfCnpj } from '@/lib/format';

type ConsultaBigData = {
  id: string;
  documento: string;
  tipo: string;
  user_id: string | null;
  data_consulta: string;
  created_at: string;
  usuario?: {
    email?: string;
  };
};

type Estatisticas = {
  total: number;
  por_tipo: Record<string, number>;
  por_documento: Record<string, number>;
  por_usuario: Record<string, number>;
  periodo: {
    inicio: string;
    fim: string;
  };
};

export default function RelatorioBigDataConsultasPage() {
  const [consultas, setConsultas] = useState<ConsultaBigData[]>([]);
  const [loading, setLoading] = useState(true);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  
  // Filtros
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [filtroDocumento, setFiltroDocumento] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');

  // Períodos pré-definidos
  const [periodoPredefinido, setPeriodoPredefinido] = useState<'hoje' | 'semana' | 'mes' | 'todos'>('mes');

  useEffect(() => {
    carregarConsultas();
  }, [filtroDataInicio, filtroDataFim, filtroDocumento, filtroTipo, filtroUsuario, periodoPredefinido]);

  async function carregarConsultas() {
    setLoading(true);
    try {
      let query = supabase
        .from('bigdata_consultas')
        .select('*')
        .order('data_consulta', { ascending: false });

      // Aplica filtro de período pré-definido
      if (periodoPredefinido !== 'todos') {
        const agora = new Date();
        let dataInicio: Date;

        switch (periodoPredefinido) {
          case 'hoje':
            dataInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
            break;
          case 'semana':
            dataInicio = new Date(agora);
            dataInicio.setDate(agora.getDate() - 7);
            break;
          case 'mes':
            dataInicio = new Date(agora);
            dataInicio.setMonth(agora.getMonth() - 1);
            break;
          default:
            dataInicio = new Date(0);
        }

        query = query.gte('data_consulta', dataInicio.toISOString());
      }

      // Aplica filtros manuais
      if (filtroDataInicio) {
        query = query.gte('data_consulta', new Date(filtroDataInicio).toISOString());
      }
      if (filtroDataFim) {
        const fim = new Date(filtroDataFim);
        fim.setHours(23, 59, 59, 999);
        query = query.lte('data_consulta', fim.toISOString());
      }
      if (filtroDocumento) {
        const docLimpo = filtroDocumento.replace(/\D/g, '');
        query = query.eq('documento', docLimpo);
      }
      if (filtroTipo) {
        query = query.eq('tipo', filtroTipo);
      }
      if (filtroUsuario) {
        query = query.eq('user_id', filtroUsuario);
      }

      const { data, error } = await query.limit(10000); // Limite alto para relatórios

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          setConsultas([]);
          setEstatisticas(null);
          setLoading(false);
          return;
        }
        throw error;
      }

      // Carrega informações dos usuários (simplificado - não temos acesso admin)
      const consultasComUsuarios = (data || []).map(consulta => ({
        ...consulta,
        usuario: consulta.user_id ? { email: consulta.user_id.substring(0, 8) + '...' } : undefined
      }));

      setConsultas(consultasComUsuarios);

      // Calcula estatísticas
      calcularEstatisticas(consultasComUsuarios);

    } catch (error: any) {
      console.error('Erro ao carregar consultas:', error);
      setConsultas([]);
    } finally {
      setLoading(false);
    }
  }

  function calcularEstatisticas(dados: ConsultaBigData[]) {
    const stats: Estatisticas = {
      total: dados.length,
      por_tipo: {},
      por_documento: {},
      por_usuario: {},
      periodo: {
        inicio: dados.length > 0 ? dados[dados.length - 1].data_consulta : '',
        fim: dados.length > 0 ? dados[0].data_consulta : ''
      }
    };

    dados.forEach(consulta => {
      // Por tipo
      stats.por_tipo[consulta.tipo] = (stats.por_tipo[consulta.tipo] || 0) + 1;

      // Por documento
      stats.por_documento[consulta.documento] = (stats.por_documento[consulta.documento] || 0) + 1;

      // Por usuário
      const userId = consulta.user_id || 'sem_usuario';
      stats.por_usuario[userId] = (stats.por_usuario[userId] || 0) + 1;
    });

    setEstatisticas(stats);
  }

  function exportarCSV() {
    if (consultas.length === 0) {
      alert('Não há dados para exportar');
      return;
    }

    const headers = ['Data/Hora', 'Documento', 'Tipo', 'Usuário', 'ID Consulta'];
    const rows = consultas.map(c => [
      new Date(c.data_consulta).toLocaleString('pt-BR'),
      formatCpfCnpj(c.documento),
      c.tipo,
      c.usuario?.email || c.user_id || 'N/A',
      c.id
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_bigdata_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const tiposDisponiveis = ['basico', 'qsa', 'enderecos', 'telefones', 'emails', 'processos', 'pessoa_fisica'];

  if (loading) {
    return (
      <main className="min-h-screen p-6 bg-white">
        <div className="container max-w-7xl mx-auto">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0369a1]"></div>
            <p className="mt-2 text-[#64748b]">Carregando relatório...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 bg-white">
      <div className="container max-w-7xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-[#0369a1] mb-2">
            📊 Relatório de Consultas BigData
          </h1>
          <p className="text-[#64748b]">
            Controle e análise de todas as consultas realizadas à API BigData
          </p>
        </header>

        {/* Filtros */}
        <Card>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">🔍 Filtros</h2>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Período pré-definido */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Período Rápido
                </label>
                <select
                  value={periodoPredefinido}
                  onChange={(e) => {
                    setPeriodoPredefinido(e.target.value as any);
                    setFiltroDataInicio('');
                    setFiltroDataFim('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="hoje">Hoje</option>
                  <option value="semana">Últimos 7 dias</option>
                  <option value="mes">Últimos 30 dias</option>
                  <option value="todos">Todos os registros</option>
                </select>
              </div>

              {/* Data início */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Início (ou deixe vazio)
                </label>
                <input
                  type="date"
                  value={filtroDataInicio}
                  onChange={(e) => setFiltroDataInicio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              {/* Data fim */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Fim (ou deixe vazio)
                </label>
                <input
                  type="date"
                  value={filtroDataFim}
                  onChange={(e) => setFiltroDataFim(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              {/* Documento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CNPJ/CPF
                </label>
                <input
                  type="text"
                  value={filtroDocumento}
                  onChange={(e) => setFiltroDocumento(e.target.value)}
                  placeholder="Digite o CNPJ ou CPF"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Consulta
                </label>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Todos os tipos</option>
                  {tiposDisponiveis.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>

              {/* Botão limpar */}
              <div className="flex items-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setFiltroDataInicio('');
                    setFiltroDataFim('');
                    setFiltroDocumento('');
                    setFiltroTipo('');
                    setFiltroUsuario('');
                    setPeriodoPredefinido('mes');
                  }}
                  className="w-full"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Estatísticas */}
        {estatisticas && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#0369a1]">{estatisticas.total}</div>
                <div className="text-sm text-gray-600 mt-1">Total de Consultas</div>
              </div>
            </Card>

            <Card>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#0369a1]">
                  {Object.keys(estatisticas.por_documento).length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Documentos Únicos</div>
              </div>
            </Card>

            <Card>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#0369a1]">
                  {Object.keys(estatisticas.por_tipo).length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Tipos Diferentes</div>
              </div>
            </Card>

            <Card>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#0369a1]">
                  {Object.keys(estatisticas.por_usuario).length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Usuários</div>
              </div>
            </Card>
          </div>
        )}

        {/* Detalhamento por Tipo */}
        {estatisticas && Object.keys(estatisticas.por_tipo).length > 0 && (
          <Card>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">📈 Consultas por Tipo</h2>
            <div className="space-y-2">
              {Object.entries(estatisticas.por_tipo)
                .sort((a, b) => b[1] - a[1])
                .map(([tipo, quantidade]) => (
                  <div key={tipo} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">{tipo}</span>
                    <span className="text-lg font-bold text-[#0369a1]">{quantidade}</span>
                  </div>
                ))}
            </div>
          </Card>
        )}

        {/* Tabela de Consultas */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              📋 Consultas Realizadas ({consultas.length})
            </h2>
            <Button variant="primary" onClick={exportarCSV}>
              📥 Exportar CSV
            </Button>
          </div>

          {consultas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma consulta encontrada no período selecionado.</p>
              <p className="text-sm mt-2">
                {periodoPredefinido === 'todos' 
                  ? 'A tabela bigdata_consultas pode não existir ainda. Execute o script SQL primeiro.'
                  : 'Tente ajustar os filtros ou selecionar um período diferente.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Data/Hora</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Documento</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Tipo</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Usuário</th>
                  </tr>
                </thead>
                <tbody>
                  {consultas.map(consulta => (
                    <tr key={consulta.id} className="hover:bg-gray-50 border-b border-gray-200">
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {new Date(consulta.data_consulta).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 font-mono">
                        {formatCpfCnpj(consulta.documento)}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {consulta.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {consulta.usuario?.email || consulta.user_id || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Resumo para Confronto */}
        {estatisticas && (
          <Card>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">💡 Resumo para Confronto com BigData</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <strong className="text-blue-900">Período:</strong>
                  <p className="text-blue-800 text-sm">
                    {estatisticas.periodo.inicio 
                      ? `${new Date(estatisticas.periodo.inicio).toLocaleDateString('pt-BR')} até ${new Date(estatisticas.periodo.fim).toLocaleDateString('pt-BR')}`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <strong className="text-blue-900">Total de Consultas:</strong>
                  <p className="text-blue-800 text-sm font-bold text-lg">{estatisticas.total}</p>
                </div>
              </div>
              <div className="mt-4">
                <strong className="text-blue-900">Detalhamento por Tipo:</strong>
                <ul className="text-blue-800 text-sm mt-2 space-y-1">
                  {Object.entries(estatisticas.por_tipo)
                    .sort((a, b) => b[1] - a[1])
                    .map(([tipo, quantidade]) => (
                      <li key={tipo}>
                        • <strong>{tipo}</strong>: {quantidade} consulta(s)
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
