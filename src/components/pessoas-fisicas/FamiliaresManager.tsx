'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/ToastContainer';
import Badge from '@/components/ui/Badge';
import { formatCpfCnpj } from '@/lib/format';

type Familiar = {
  id?: string;
  pessoa_id: string;
  familiar_cpf?: string;
  familiar_nome: string;
  tipo_relacionamento?: string;
  observacoes?: string;
};

type FamiliaresManagerProps = {
  pessoaId: string;
  items: Familiar[];
  onRefresh: () => void;
};

export default function FamiliaresManager({
  pessoaId,
  items,
  onRefresh
}: FamiliaresManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<Familiar>>({});
  const { showToast } = useToast();

  const resetForm = () => {
    setForm({
      familiar_cpf: '',
      familiar_nome: '',
      tipo_relacionamento: '',
      observacoes: ''
    });
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
    setEditingId(null);
  };

  const handleEdit = (item: Familiar) => {
    setForm({
      familiar_cpf: item.familiar_cpf || '',
      familiar_nome: item.familiar_nome || '',
      tipo_relacionamento: item.tipo_relacionamento || '',
      observacoes: item.observacoes || ''
    });
    setEditingId(item.id || null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.familiar_nome) {
      showToast('Nome do familiar é obrigatório', 'warning');
      return;
    }

    setLoading(true);
    try {
      const data: any = {
        pessoa_id: pessoaId,
        familiar_cpf: form.familiar_cpf || null,
        familiar_nome: form.familiar_nome,
        tipo_relacionamento: form.tipo_relacionamento || null,
        observacoes: form.observacoes || null,
        origem: 'manual',
        ativo: true
      };

      if (editingId) {
        const { error } = await supabase
          .from('pessoas_fisicas_familiares')
          .update(data)
          .eq('id', editingId);
        
        if (error) throw error;
        showToast('Familiar atualizado com sucesso', 'success');
      } else {
        const { error } = await supabase
          .from('pessoas_fisicas_familiares')
          .insert(data);
        
        if (error) throw error;
        showToast('Familiar adicionado com sucesso', 'success');
      }

      resetForm();
      setShowForm(false);
      setEditingId(null);
      onRefresh();
    } catch (error: any) {
      console.error('Erro ao salvar familiar:', error);
      showToast(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este familiar?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('pessoas_fisicas_familiares')
        .update({ ativo: false })
        .eq('id', id);
      
      if (error) throw error;
      showToast('Familiar excluído com sucesso', 'success');
      onRefresh();
    } catch (error: any) {
      console.error('Erro ao excluir familiar:', error);
      showToast(`Erro ao excluir: ${error.message || 'Erro desconhecido'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const tiposRelacionamento = [
    'pai', 'mae', 'conjuge', 'filho', 'filha', 'irmao', 'irma', 
    'avô', 'avó', 'neto', 'neta', 'tio', 'tia', 'primo', 'prima', 
    'sobrinho', 'sobrinha', 'cunhado', 'cunhada', 'sogro', 'sogra', 
    'genro', 'nora', 'socio_oculto', 'outro'
  ];

  return (
    <div className="bg-white border border-gray-300">
      <div className="border-b border-gray-300 bg-gray-100 px-4 py-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 uppercase">Familiares / Relacionamentos</h2>
        <Button variant="primary" size="sm" onClick={handleAddNew}>
          + Novo
        </Button>
      </div>

      {showForm && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">CPF do Familiar</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  value={form.familiar_cpf || ''}
                  onChange={(e) => setForm({ ...form, familiar_cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nome do Familiar *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  value={form.familiar_nome || ''}
                  onChange={(e) => setForm({ ...form, familiar_nome: e.target.value })}
                  placeholder="Nome completo"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Relacionamento</label>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  value={form.tipo_relacionamento || ''}
                  onChange={(e) => setForm({ ...form, tipo_relacionamento: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  {tiposRelacionamento.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
              <textarea
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                rows={2}
                value={form.observacoes || ''}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Observações sobre o relacionamento"
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
          <p className="text-sm text-gray-500 text-center py-4">Nenhum familiar cadastrado</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="p-3 border border-gray-200 rounded flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900">{item.familiar_nome}</p>
                    {item.familiar_cpf && (
                      <p className="text-xs text-gray-600">CPF: {formatCpfCnpj(item.familiar_cpf)}</p>
                    )}
                    {item.tipo_relacionamento && (
                      <Badge variant="info" size="sm">{item.tipo_relacionamento}</Badge>
                    )}
                  </div>
                  {item.observacoes && (
                    <p className="text-xs text-gray-600 mt-1">{item.observacoes}</p>
                  )}
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

