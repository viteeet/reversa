'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/ToastContainer';
import Badge from '@/components/ui/Badge';
import { formatMoney } from '@/lib/format';

type Processo = {
  id?: string;
  pessoa_id: string;
  numero_processo: string;
  tribunal?: string;
  vara?: string;
  tipo_acao?: string;
  valor_causa?: number;
  data_distribuicao?: string;
  status?: string;
  parte_contraria?: string;
  observacoes?: string;
  link_processo?: string;
};

type ProcessosManagerProps = {
  pessoaId: string;
  items: Processo[];
  onRefresh: () => void;
};

export default function ProcessosManager({
  pessoaId,
  items,
  onRefresh
}: ProcessosManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<Processo>>({});
  const { showToast } = useToast();

  const resetForm = () => {
    setForm({
      numero_processo: '',
      tribunal: '',
      vara: '',
      tipo_acao: '',
      valor_causa: undefined,
      data_distribuicao: '',
      status: '',
      parte_contraria: '',
      observacoes: '',
      link_processo: ''
    });
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
    setEditingId(null);
  };

  const handleEdit = (item: Processo) => {
    setForm({
      numero_processo: item.numero_processo || '',
      tribunal: item.tribunal || '',
      vara: item.vara || '',
      tipo_acao: item.tipo_acao || '',
      valor_causa: item.valor_causa,
      data_distribuicao: item.data_distribuicao ? item.data_distribuicao.split('T')[0] : '',
      status: item.status || '',
      parte_contraria: item.parte_contraria || '',
      observacoes: item.observacoes || '',
      link_processo: item.link_processo || ''
    });
    setEditingId(item.id || null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.numero_processo) {
      showToast('Número do processo é obrigatório', 'warning');
      return;
    }

    setLoading(true);
    try {
      const data: any = {
        pessoa_id: pessoaId,
        numero_processo: form.numero_processo,
        tribunal: form.tribunal || null,
        vara: form.vara || null,
        tipo_acao: form.tipo_acao || null,
        valor_causa: form.valor_causa || null,
        data_distribuicao: form.data_distribuicao || null,
        status: form.status || null,
        parte_contraria: form.parte_contraria || null,
        observacoes: form.observacoes || null,
        link_processo: form.link_processo || null,
        origem: 'manual',
        ativo: true
      };

      if (editingId) {
        const { error } = await supabase
          .from('pessoas_fisicas_processos')
          .update(data)
          .eq('id', editingId);
        
        if (error) throw error;
        showToast('Processo atualizado com sucesso', 'success');
      } else {
        const { error } = await supabase
          .from('pessoas_fisicas_processos')
          .insert(data);
        
        if (error) throw error;
        showToast('Processo adicionado com sucesso', 'success');
      }

      resetForm();
      setShowForm(false);
      setEditingId(null);
      onRefresh();
    } catch (error: any) {
      console.error('Erro ao salvar processo:', error);
      showToast(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este processo?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('pessoas_fisicas_processos')
        .update({ ativo: false })
        .eq('id', id);
      
      if (error) throw error;
      showToast('Processo excluído com sucesso', 'success');
      onRefresh();
    } catch (error: any) {
      console.error('Erro ao excluir processo:', error);
      showToast(`Erro ao excluir: ${error.message || 'Erro desconhecido'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-300">
      <div className="border-b border-gray-300 bg-gray-100 px-4 py-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 uppercase">Processos Judiciais</h2>
        <Button variant="primary" size="sm" onClick={handleAddNew}>
          + Novo
        </Button>
      </div>

      {showForm && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Número do Processo *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  value={form.numero_processo || ''}
                  onChange={(e) => setForm({ ...form, numero_processo: e.target.value })}
                  placeholder="0000000-00.0000.0.00.0000"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  value={form.status || ''}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  placeholder="Status do processo"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tribunal</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  value={form.tribunal || ''}
                  onChange={(e) => setForm({ ...form, tribunal: e.target.value })}
                  placeholder="Nome do tribunal"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Vara</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  value={form.vara || ''}
                  onChange={(e) => setForm({ ...form, vara: e.target.value })}
                  placeholder="Nome da vara"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Ação</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  value={form.tipo_acao || ''}
                  onChange={(e) => setForm({ ...form, tipo_acao: e.target.value })}
                  placeholder="Tipo de ação"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Valor da Causa</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  value={form.valor_causa || ''}
                  onChange={(e) => setForm({ ...form, valor_causa: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Data de Distribuição</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  value={form.data_distribuicao || ''}
                  onChange={(e) => setForm({ ...form, data_distribuicao: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Link do Processo</label>
                <input
                  type="url"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  value={form.link_processo || ''}
                  onChange={(e) => setForm({ ...form, link_processo: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Parte Contrária</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                value={form.parte_contraria || ''}
                onChange={(e) => setForm({ ...form, parte_contraria: e.target.value })}
                placeholder="Nome da parte contrária"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
              <textarea
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                rows={3}
                value={form.observacoes || ''}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Observações sobre o processo"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" size="sm" onClick={() => { setShowForm(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Nenhum processo cadastrado</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="p-3 border border-gray-200 rounded flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900">{item.numero_processo}</p>
                    {item.status && (
                      <Badge variant="warning" size="sm">{item.status}</Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    {item.tribunal && <p>Tribunal: {item.tribunal}</p>}
                    {item.vara && <p>Vara: {item.vara}</p>}
                    {item.tipo_acao && <p>Tipo de Ação: {item.tipo_acao}</p>}
                    {item.valor_causa && <p>Valor da Causa: {formatMoney(item.valor_causa)}</p>}
                    {item.data_distribuicao && <p>Data Distribuição: {new Date(item.data_distribuicao).toLocaleDateString('pt-BR')}</p>}
                    {item.parte_contraria && <p>Parte Contrária: {item.parte_contraria}</p>}
                    {item.observacoes && <p className="mt-1">{item.observacoes}</p>}
                    {item.link_processo && (
                      <a href={item.link_processo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Ver processo
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => handleEdit(item)}>
                    Editar
                  </Button>
                  <Button variant="error" size="sm" onClick={() => handleDelete(item.id!)}>
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

