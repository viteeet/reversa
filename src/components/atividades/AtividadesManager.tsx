'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';

type Atividade = {
  id: string;
  tipo: 'ligacao' | 'email' | 'reuniao' | 'observacao' | 'lembrete' | 'documento' | 'negociacao' | 'whatsapp';
  descricao: string;
  data_hora: string;
  usuario_id: string;
  usuario_nome?: string;
  status: 'pendente' | 'concluida' | 'cancelada';
  proxima_acao?: string;
  data_lembrete?: string;
  observacoes?: string;
  created_at: string;
  origem?: 'cedente' | 'sacado' | 'titulo';
  titulo_numero?: string;
};

type AtividadesManagerProps = {
  tipo: 'sacado' | 'cedente';
  id: string; // cnpj para sacado ou id para cedente
  nome: string;
};

export default function AtividadesManager({ tipo, id, nome }: AtividadesManagerProps) {
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pendente' | 'concluida'>('todos');
  const [form, setForm] = useState({
    tipo: 'ligacao' as Atividade['tipo'],
    descricao: '',
    status: 'concluida' as 'pendente' | 'concluida' | 'cancelada',
    proxima_acao: '',
    data_lembrete: '',
    observacoes: ''
  });

  const tiposAtividade = [
    { value: 'ligacao', label: 'Ligação', cor: '#3b82f6' },
    { value: 'email', label: 'Email', cor: '#10b981' },
    { value: 'whatsapp', label: 'WhatsApp', cor: '#25D366' },
    { value: 'reuniao', label: 'Reunião', cor: '#8b5cf6' },
    { value: 'observacao', label: 'Observação', cor: '#6b7280' },
    { value: 'lembrete', label: 'Lembrete', cor: '#f59e0b' },
    { value: 'documento', label: 'Documento', cor: '#ef4444' },
    { value: 'negociacao', label: 'Negociação', cor: '#059669' }
  ];

  useEffect(() => {
    loadAtividades();
  }, [tipo, id]);

  async function loadAtividades() {
    setLoading(true);
    const tabela = tipo === 'sacado' ? 'sacados_atividades' : 'cedentes_atividades';
    const campoId = tipo === 'sacado' ? 'sacado_cnpj' : 'cedente_id';
    
    try {
      // Buscar atividades do cedente/sacado
      const { data, error } = await supabase
        .from(tabela)
        .select('*')
        .eq(campoId, id)
        .order('data_hora', { ascending: false });
      
      let atividadesProcessadas: Atividade[] = [];
      
      if (error) {
        // Não loga erro se a tabela não existir - apenas define array vazio
        if (error.code !== 'PGRST116' && error.code !== '42P01') {
          console.error('Erro ao carregar atividades:', error);
        }
      } else {
        // Processa dados sem fazer join com usuário para evitar erros
        atividadesProcessadas = data?.map(item => ({
          ...item,
          usuario_nome: 'Usuário',
          origem: tipo === 'cedente' ? 'cedente' : 'sacado'
        })) || [];
      }

      // Buscar atividades de títulos relacionados (tanto para cedente quanto para sacado)
      try {
        let titulosIds: string[] = [];
        
        if (tipo === 'cedente') {
          // Buscar IDs dos títulos do cedente
          const { data: titulosData } = await supabase
            .from('titulos_negociados')
            .select('id')
            .eq('cedente_id', id)
            .eq('ativo', true);
          
          titulosIds = titulosData?.map(t => t.id) || [];
        } else if (tipo === 'sacado') {
          // Buscar IDs dos títulos do sacado
          const { data: titulosData } = await supabase
            .from('titulos_negociados')
            .select('id')
            .eq('sacado_cnpj', id)
            .eq('ativo', true);
          
          titulosIds = titulosData?.map(t => t.id) || [];
        }

        if (titulosIds.length > 0) {
          // Buscar atividades dos títulos
          const { data: titulosAtividadesData, error: titulosError } = await supabase
            .from('titulos_atividades')
            .select('*')
            .in('titulo_id', titulosIds)
            .order('data_hora', { ascending: false });

          if (!titulosError && titulosAtividadesData) {
            // Buscar informações dos títulos para exibir número
            const { data: titulosInfo } = await supabase
              .from('titulos_negociados')
              .select('id, numero_titulo')
              .in('id', titulosIds);

            const titulosMap = new Map((titulosInfo || []).map((t: any) => [t.id, t.numero_titulo]));

            const atividadesTitulos = titulosAtividadesData.map(item => ({
              ...item,
              usuario_nome: 'Usuário',
              origem: 'titulo',
              titulo_numero: titulosMap.get(item.titulo_id) || 'N/A'
            }));

            // Combinar atividades com atividades de títulos
            atividadesProcessadas = [...atividadesProcessadas, ...atividadesTitulos];
            
            // Ordenar por data_hora (mais recente primeiro)
            atividadesProcessadas.sort((a, b) => 
              new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime()
            );
          }
        }
      } catch (titulosErr) {
        // Erro ao buscar atividades de títulos não é crítico
        console.warn('Erro ao carregar atividades de títulos:', titulosErr);
      }

      setAtividades(atividadesProcessadas);
    } catch (err) {
      // Silenciosamente trata erros - tabela pode não existir ainda
      setAtividades([]);
    } finally {
      setLoading(false);
    }
  }

  async function adicionarAtividade() {
    if (!form.descricao.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const tabela = tipo === 'sacado' ? 'sacados_atividades' : 'cedentes_atividades';
    const campoId = tipo === 'sacado' ? 'sacado_cnpj' : 'cedente_id';
    
    try {
      const { error } = await supabase.from(tabela).insert({
        [campoId]: id,
        user_id: user.id,
        tipo: form.tipo,
        descricao: form.descricao.trim(),
        data_hora: new Date().toISOString(),
        status: form.status,
        proxima_acao: form.proxima_acao || null,
        data_lembrete: form.data_lembrete || null,
        observacoes: form.observacoes || null
      });

      if (error) {
        console.error('Erro ao adicionar atividade:', error);
        if (error.code === 'PGRST116') {
          alert('Tabela de atividades ainda não foi criada. Execute o SQL: database_schema_atividades.sql');
        } else {
          alert('Erro ao salvar atividade: ' + error.message);
        }
      } else {
        resetForm();
        setShowForm(false);
        loadAtividades();
      }
    } catch (err) {
      console.error('Erro inesperado ao adicionar atividade:', err);
      alert('Erro inesperado ao salvar atividade');
    }
  }

  async function atualizarStatus(atividadeId: string, novoStatus: 'pendente' | 'concluida' | 'cancelada') {
    const tabela = tipo === 'sacado' ? 'sacados_atividades' : 'cedentes_atividades';
    
    try {
      const { error } = await supabase
        .from(tabela)
        .update({ status: novoStatus })
        .eq('id', atividadeId);

      if (error) {
        console.error('Erro ao atualizar status:', error);
        alert('Erro ao atualizar status da atividade');
      } else {
        loadAtividades();
      }
    } catch (err) {
      console.error('Erro inesperado ao atualizar status:', err);
      alert('Erro ao atualizar status');
    }
  }

  async function editarAtividade() {
    if (!form.descricao.trim() || !editingId) return;

    const tabela = tipo === 'sacado' ? 'sacados_atividades' : 'cedentes_atividades';
    
    try {
      const { error } = await supabase
        .from(tabela)
        .update({
          tipo: form.tipo,
          descricao: form.descricao.trim(),
          status: form.status,
          proxima_acao: form.proxima_acao || null,
          data_lembrete: form.data_lembrete || null,
          observacoes: form.observacoes || null
        })
        .eq('id', editingId);

      if (error) {
        console.error('Erro ao editar atividade:', error);
        alert('Erro ao editar atividade');
      } else {
        resetForm();
        setEditingId(null);
        loadAtividades();
      }
    } catch (err) {
      console.error('Erro inesperado ao editar atividade:', err);
      alert('Erro ao editar atividade');
    }
  }

  async function excluirAtividade(atividadeId: string) {
    if (!confirm('Tem certeza que deseja excluir esta atividade?')) return;

    const tabela = tipo === 'sacado' ? 'sacados_atividades' : 'cedentes_atividades';
    
    try {
      const { error } = await supabase
        .from(tabela)
        .delete()
        .eq('id', atividadeId);

      if (error) {
        console.error('Erro ao excluir atividade:', error);
        alert('Erro ao excluir atividade');
      } else {
        loadAtividades();
      }
    } catch (err) {
      console.error('Erro inesperado ao excluir atividade:', err);
      alert('Erro ao excluir atividade');
    }
  }

  function abrirEdicao(atividade: Atividade) {
    setForm({
      tipo: atividade.tipo,
      descricao: limparDescricao(atividade.descricao), // Limpa timestamp ao editar
      status: atividade.status,
      proxima_acao: atividade.proxima_acao || '',
      data_lembrete: atividade.data_lembrete ? new Date(atividade.data_lembrete).toISOString().slice(0, 16) : '',
      observacoes: atividade.observacoes || ''
    });
    setEditingId(atividade.id);
    setShowForm(false);
  }

  function resetForm() {
    setForm({
      tipo: 'ligacao',
      descricao: '',
      status: 'concluida',
      proxima_acao: '',
      data_lembrete: '',
      observacoes: ''
    });
    setEditingId(null);
  }

  function formatarData(data: string) {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function limparDescricao(descricao: string): string {
    // Remove padrões como [usuario - DD/MM/AAAA, HH:MM] ou [usuario - data]
    // Mas mantém a informação de direcionamento (antes do |)
    let descricaoLimpa = descricao.replace(/\s*\[[^\]]*\]\s*$/, '').trim();
    
    // Se tiver informação de direcionamento (| Cobrança direcionada...), separa
    const partes = descricaoLimpa.split(' | ');
    if (partes.length > 1) {
      // Retorna apenas a descrição principal (sem a parte de direcionamento)
      return partes[0].trim();
    }
    
    return descricaoLimpa;
  }

  function extrairDirecionamento(descricao: string): 'cedente' | 'sacado' | null {
    // Extrai informação de direcionamento da descrição
    if (descricao.includes('Cobrança direcionada ao CEDENTE')) {
      return 'cedente';
    } else if (descricao.includes('Cobrança direcionada ao SACADO')) {
      return 'sacado';
    }
    return null;
  }

  function isLembreteVencido(dataLembrete?: string) {
    if (!dataLembrete) return false;
    return new Date(dataLembrete) <= new Date();
  }

  if (loading) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#0369a1]"></div>
          <p className="mt-2 text-[#64748b]">Carregando atividades...</p>
        </div>
      </Card>
    );
  }

  const atividadesFiltradas = atividades.filter(a => {
    if (filtroStatus === 'todos') return true;
    return a.status === filtroStatus;
  });

  const atividadesPendentes = atividades.filter(a => a.status === 'pendente').length;
  const atividadesConcluidas = atividades.filter(a => a.status === 'concluida').length;

  return (
    <div className="space-y-3">
      {/* Header compacto */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#0369a1]">Atividades</h2>
        <Button 
          variant="primary" 
          onClick={() => setShowForm(!showForm)}
          size="sm"
        >
          {showForm ? 'Cancelar' : '+ Nova'}
        </Button>
      </div>

      {/* Filtros de Status */}
      <div className="flex gap-2">
        <button
          onClick={() => setFiltroStatus('todos')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            filtroStatus === 'todos'
              ? 'bg-[#0369a1] text-white'
              : 'bg-white border border-[#cbd5e1] text-[#64748b] hover:bg-[#f8fafc]'
          }`}
        >
          Todas ({atividades.length})
        </button>
        <button
          onClick={() => setFiltroStatus('pendente')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            filtroStatus === 'pendente'
              ? 'bg-[#f59e0b] text-white'
              : 'bg-white border border-[#cbd5e1] text-[#64748b] hover:bg-[#f8fafc]'
          }`}
        >
          Pendentes ({atividadesPendentes})
        </button>
        <button
          onClick={() => setFiltroStatus('concluida')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            filtroStatus === 'concluida'
              ? 'bg-[#10b981] text-white'
              : 'bg-white border border-[#cbd5e1] text-[#64748b] hover:bg-[#f8fafc]'
          }`}
        >
          Realizadas ({atividadesConcluidas})
        </button>
      </div>

      {/* Formulário de Nova Atividade */}
      {showForm && (
        <Card>
          <div className="p-4 space-y-3">
            <h3 className="font-semibold text-[#0369a1] text-sm">Nova Atividade</h3>
            
            {/* Tipo de Atividade */}
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-2">Tipo</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {tiposAtividade.map(tipoItem => (
                  <button
                    key={tipoItem.value}
                    onClick={() => setForm({ ...form, tipo: tipoItem.value as Atividade['tipo'] })}
                    className={`p-2 rounded border text-xs font-medium transition-colors ${
                      form.tipo === tipoItem.value
                        ? 'border-[#0369a1] bg-[#f0f7ff] text-[#0369a1]'
                        : 'border-[#cbd5e1] hover:border-[#0369a1] hover:bg-[#f8fafc]'
                    }`}
                  >
                    {tipoItem.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1">Status</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setForm({ ...form, status: 'pendente' })}
                  className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    form.status === 'pendente'
                      ? 'bg-[#f59e0b] text-white'
                      : 'bg-white border border-[#cbd5e1] text-[#64748b] hover:bg-[#f8fafc]'
                  }`}
                >
                  Pendente
                </button>
                <button
                  onClick={() => setForm({ ...form, status: 'concluida' })}
                  className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    form.status === 'concluida'
                      ? 'bg-[#10b981] text-white'
                      : 'bg-white border border-[#cbd5e1] text-[#64748b] hover:bg-[#f8fafc]'
                  }`}
                >
                  Realizada
                </button>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1">Descrição *</label>
              <input
                type="text"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Descreva a atividade..."
                className="w-full p-2 border border-[#cbd5e1] rounded text-sm focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1]"
              />
            </div>

            {/* Próxima Ação */}
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1">Próxima Ação</label>
              <input
                type="text"
                value={form.proxima_acao}
                onChange={(e) => setForm({ ...form, proxima_acao: e.target.value })}
                placeholder="O que fazer em seguida?"
                className="w-full p-2 border border-[#cbd5e1] rounded text-sm focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1]"
              />
            </div>

            {/* Data do Lembrete */}
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1">Lembrete</label>
              <input
                type="datetime-local"
                value={form.data_lembrete}
                onChange={(e) => setForm({ ...form, data_lembrete: e.target.value })}
                className="w-full p-2 border border-[#cbd5e1] rounded text-sm focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1]"
              />
            </div>

            {/* Observações */}
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1">Observações</label>
              <textarea
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Observações adicionais..."
                className="w-full p-2 border border-[#cbd5e1] rounded text-sm focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1] h-16 resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="secondary" onClick={() => { setShowForm(false); resetForm(); }} size="sm">
                Cancelar
              </Button>
              <Button variant="primary" onClick={adicionarAtividade} size="sm">
                Salvar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Modal de Edição */}
      {editingId && (
        <Modal
          isOpen={!!editingId}
          onClose={() => { setEditingId(null); resetForm(); }}
          title="Editar Atividade"
        >
          <div className="space-y-3">
            {/* Tipo de Atividade */}
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-2">Tipo</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {tiposAtividade.map(tipoItem => (
                  <button
                    key={tipoItem.value}
                    onClick={() => setForm({ ...form, tipo: tipoItem.value as Atividade['tipo'] })}
                    className={`p-2 rounded border text-xs font-medium transition-colors ${
                      form.tipo === tipoItem.value
                        ? 'border-[#0369a1] bg-[#f0f7ff] text-[#0369a1]'
                        : 'border-[#cbd5e1] hover:border-[#0369a1] hover:bg-[#f8fafc]'
                    }`}
                  >
                    {tipoItem.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1">Status</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setForm({ ...form, status: 'pendente' })}
                  className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    form.status === 'pendente'
                      ? 'bg-[#f59e0b] text-white'
                      : 'bg-white border border-[#cbd5e1] text-[#64748b] hover:bg-[#f8fafc]'
                  }`}
                >
                  Pendente
                </button>
                <button
                  onClick={() => setForm({ ...form, status: 'concluida' })}
                  className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    form.status === 'concluida'
                      ? 'bg-[#10b981] text-white'
                      : 'bg-white border border-[#cbd5e1] text-[#64748b] hover:bg-[#f8fafc]'
                  }`}
                >
                  Realizada
                </button>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1">Descrição *</label>
              <input
                type="text"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Descreva a atividade..."
                className="w-full p-2 border border-[#cbd5e1] rounded text-sm focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1]"
              />
            </div>

            {/* Próxima Ação */}
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1">Próxima Ação</label>
              <input
                type="text"
                value={form.proxima_acao}
                onChange={(e) => setForm({ ...form, proxima_acao: e.target.value })}
                placeholder="O que fazer em seguida?"
                className="w-full p-2 border border-[#cbd5e1] rounded text-sm focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1]"
              />
            </div>

            {/* Data do Lembrete */}
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1">Lembrete</label>
              <input
                type="datetime-local"
                value={form.data_lembrete}
                onChange={(e) => setForm({ ...form, data_lembrete: e.target.value })}
                className="w-full p-2 border border-[#cbd5e1] rounded text-sm focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1]"
              />
            </div>

            {/* Observações */}
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1">Observações</label>
              <textarea
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Observações adicionais..."
                className="w-full p-2 border border-[#cbd5e1] rounded text-sm focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1] h-16 resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="secondary" onClick={() => { setEditingId(null); resetForm(); }} size="sm">
                Cancelar
              </Button>
              <Button variant="primary" onClick={editarAtividade} size="sm">
                Salvar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Tabela Compacta Estilo Excel */}
      <div className="compact-table-shell">
        <div className="compact-table-title">
          <div className="flex items-center gap-2">
            <h3 className="compact-table-title-main">Historico de Atividades</h3>
            <span className="compact-table-count">{atividadesFiltradas.length}</span>
          </div>
        </div>
        {atividadesFiltradas.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm bg-white">
            {atividades.length === 0 
              ? 'Nenhuma atividade registrada ainda.'
              : `Nenhuma atividade ${filtroStatus === 'pendente' ? 'pendente' : filtroStatus === 'concluida' ? 'realizada' : ''} encontrada.`
            }
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="compact-table">
              <thead>
                <tr>
                  <th className="whitespace-nowrap">
                    Data/Hora
                  </th>
                  <th className="whitespace-nowrap">
                    Tipo
                  </th>
                  <th className="whitespace-nowrap">
                    Status
                  </th>
                  <th className="whitespace-nowrap">
                    Titulo
                  </th>
                  <th className="whitespace-nowrap">
                    Descricao
                  </th>
                  <th className="whitespace-nowrap">
                    Proxima Acao
                  </th>
                  <th className="text-center whitespace-nowrap">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody>
                {atividadesFiltradas.map(atividade => {
                  const tipoInfo = tiposAtividade.find(t => t.value === atividade.tipo);
                  return (
                    <tr key={atividade.id}>
                      <td>
                        <div className="text-xs">
                          <div className="font-medium text-gray-900">
                            {new Date(atividade.data_hora).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-gray-500">
                            {new Date(atividade.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge
                          variant={
                            atividade.tipo === 'ligacao' ? 'info' :
                            atividade.tipo === 'email' ? 'success' :
                            atividade.tipo === 'negociacao' ? 'warning' :
                            'neutral'
                          }
                          size="sm"
                          className="text-xs"
                        >
                          {tipoInfo?.label || atividade.tipo}
                        </Badge>
                      </td>
                      <td>
                        <Badge
                          variant={
                            atividade.status === 'pendente' ? 'warning' :
                            atividade.status === 'concluida' ? 'success' :
                            'error'
                          }
                          size="sm"
                          className="text-xs"
                        >
                          {atividade.status === 'concluida' ? 'Realizada' : 'Pendente'}
                        </Badge>
                      </td>
                      <td>
                        {atividade.origem === 'titulo' && atividade.titulo_numero ? (
                          <Badge variant="info" size="sm" className="text-xs">
                            #{atividade.titulo_numero}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td>
                        <div className="text-xs text-gray-700 max-w-xs">
                          <div className="truncate" title={limparDescricao(atividade.descricao)}>
                            {limparDescricao(atividade.descricao)}
                          </div>
                          {atividade.origem === 'titulo' && extrairDirecionamento(atividade.descricao) && (
                            <div className={`text-xs font-medium mt-0.5 ${
                              extrairDirecionamento(atividade.descricao) === 'cedente' 
                                ? 'text-blue-600' 
                                : 'text-green-600'
                            }`}>
                              → {extrairDirecionamento(atividade.descricao) === 'cedente' ? 'Cedente' : 'Sacado'}
                            </div>
                          )}
                        </div>
                        {atividade.observacoes && (
                          <div className="text-xs text-gray-500 italic mt-0.5 truncate" title={atividade.observacoes}>
                            {atividade.observacoes}
                          </div>
                        )}
                      </td>
                      <td>
                        {atividade.proxima_acao ? (
                          <span className="text-xs text-gray-700">{atividade.proxima_acao}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-1 justify-center">
                          {atividade.status === 'pendente' && (
                            <button
                              onClick={() => atualizarStatus(atividade.id, 'concluida')}
                              className="px-2 py-0.5 text-xs border border-green-300 bg-white hover:bg-green-50 text-green-600 font-medium"
                              title="Marcar como realizada"
                            >
                              ✓
                            </button>
                          )}
                          <button
                            onClick={() => abrirEdicao(atividade)}
                            className="px-2 py-0.5 text-xs border border-blue-300 bg-white hover:bg-blue-50 text-blue-600 font-medium"
                            title="Editar"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => excluirAtividade(atividade.id)}
                            className="px-2 py-0.5 text-xs border border-red-300 bg-white hover:bg-red-50 text-red-600 font-medium"
                            title="Excluir"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
