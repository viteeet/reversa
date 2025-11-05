'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';

type Atividade = {
  id: string;
  tipo: 'ligacao' | 'email' | 'reuniao' | 'observacao' | 'lembrete' | 'documento' | 'negociacao';
  descricao: string;
  data_hora: string;
  usuario_id: string;
  usuario_nome?: string;
  status: 'pendente' | 'concluida' | 'cancelada';
  proxima_acao?: string;
  data_lembrete?: string;
  observacoes?: string;
  created_at: string;
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
      const { data, error } = await supabase
        .from(tabela)
        .select('*')
        .eq(campoId, id)
        .order('data_hora', { ascending: false });
      
      if (error) {
        // Não loga erro se a tabela não existir - apenas define array vazio
        if (error.code !== 'PGRST116' && error.code !== '42P01') {
          console.error('Erro ao carregar atividades:', error);
        }
        setAtividades([]);
      } else {
        // Processa dados sem fazer join com usuário para evitar erros
        const atividadesProcessadas = data?.map(item => ({
          ...item,
          usuario_nome: 'Usuário'
        })) || [];
        setAtividades(atividadesProcessadas);
      }
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
      descricao: atividade.descricao,
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

      {/* Lista de Atividades */}
      <Card>
        <div className="p-3">
          {atividadesFiltradas.length === 0 ? (
            <div className="text-center py-6 text-[#64748b] text-sm">
              <p>
                {atividades.length === 0 
                  ? 'Nenhuma atividade registrada ainda.'
                  : `Nenhuma atividade ${filtroStatus === 'pendente' ? 'pendente' : filtroStatus === 'concluida' ? 'realizada' : ''} encontrada.`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {atividadesFiltradas.map(atividade => {
                const tipoInfo = tiposAtividade.find(t => t.value === atividade.tipo);
                return (
                  <div 
                    key={atividade.id} 
                    className="border-l-2 pl-3 py-2 hover:bg-[#f8fafc] transition-colors"
                    style={{ borderLeftColor: tipoInfo?.cor }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-[#1e293b]">{tipoInfo?.label}</span>
                          <Badge 
                            variant={atividade.status === 'concluida' ? 'success' : 'warning'} 
                            size="sm"
                          >
                            {atividade.status === 'concluida' ? 'Realizada' : 'Pendente'}
                          </Badge>
                        </div>
                        <p className="text-sm text-[#1e293b] mb-1">{atividade.descricao}</p>
                        {atividade.proxima_acao && (
                          <p className="text-xs text-[#64748b] mb-1">
                            <strong>Próxima ação:</strong> {atividade.proxima_acao}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-[#64748b]">
                          <span>{formatarData(atividade.data_hora)}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {atividade.status === 'pendente' && (
                          <button
                            onClick={() => atualizarStatus(atividade.id, 'concluida')}
                            className="px-2 py-1 text-xs font-medium text-green-600 bg-green-50 border border-green-300 rounded hover:bg-green-100"
                            title="Marcar como realizada"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={() => abrirEdicao(atividade)}
                          className="px-2 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => excluirAtividade(atividade.id)}
                          className="px-2 py-1 text-xs font-medium text-red-600 bg-white border border-red-300 rounded hover:bg-red-50"
                          title="Excluir"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
