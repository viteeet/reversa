'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/ToastContainer';
import Badge from '@/components/ui/Badge';
import { formatCpfCnpj } from '@/lib/format';

type EmpresaLigada = {
  id?: string;
  pessoa_id: string;
  empresa_cnpj: string;
  empresa_razao_social: string;
  tipo_relacionamento?: string;
  participacao?: number;
  cargo?: string;
  data_inicio?: string;
  data_fim?: string;
  observacoes?: string;
};

type EmpresasLigadasManagerProps = {
  pessoaId: string;
  items: EmpresaLigada[];
  onRefresh: () => void;
};

export default function EmpresasLigadasManager({
  pessoaId,
  items,
  onRefresh
}: EmpresasLigadasManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<EmpresaLigada>>({});
  const { showToast } = useToast();

  const resetForm = () => {
    setForm({
      empresa_cnpj: '',
      empresa_razao_social: '',
      tipo_relacionamento: '',
      participacao: undefined,
      cargo: '',
      data_inicio: '',
      data_fim: '',
      observacoes: ''
    });
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
    setEditingId(null);
  };

  const handleEdit = (item: EmpresaLigada) => {
    setForm({
      empresa_cnpj: item.empresa_cnpj || '',
      empresa_razao_social: item.empresa_razao_social || '',
      tipo_relacionamento: item.tipo_relacionamento || '',
      participacao: item.participacao,
      cargo: item.cargo || '',
      data_inicio: item.data_inicio ? item.data_inicio.split('T')[0] : '',
      data_fim: item.data_fim ? item.data_fim.split('T')[0] : '',
      observacoes: item.observacoes || ''
    });
    setEditingId(item.id || null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.empresa_cnpj || !form.empresa_razao_social) {
      showToast('CNPJ e Razão Social são obrigatórios', 'warning');
      return;
    }

    setLoading(true);
    try {
      const data: any = {
        pessoa_id: pessoaId,
        empresa_cnpj: form.empresa_cnpj.replace(/\D+/g, ''),
        empresa_razao_social: form.empresa_razao_social,
        tipo_relacionamento: form.tipo_relacionamento || null,
        participacao: form.participacao || null,
        cargo: form.cargo || null,
        data_inicio: form.data_inicio || null,
        data_fim: form.data_fim || null,
        observacoes: form.observacoes || null,
        origem: 'manual',
        ativo: true
      };

      if (editingId) {
        const { error } = await supabase
          .from('pessoas_fisicas_empresas')
          .update(data)
          .eq('id', editingId);
        
        if (error) throw error;
        showToast('Empresa atualizada com sucesso', 'success');
      } else {
        const { error } = await supabase
          .from('pessoas_fisicas_empresas')
          .insert(data);
        
        if (error) throw error;
        showToast('Empresa adicionada com sucesso', 'success');
      }

      resetForm();
      setShowForm(false);
      setEditingId(null);
      onRefresh();
    } catch (error: any) {
      console.error('Erro ao salvar empresa:', error);
      showToast(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('pessoas_fisicas_empresas')
        .update({ ativo: false })
        .eq('id', id);
      
      if (error) throw error;
      showToast('Empresa excluída com sucesso', 'success');
      onRefresh();
    } catch (error: any) {
      console.error('Erro ao excluir empresa:', error);
      showToast(`Erro ao excluir: ${error.message || 'Erro desconhecido'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const tiposRelacionamento = ['socio', 'administrador', 'funcionario', 'proprietario', 'outro'];

  return (
    <div className="bg-white border border-gray-300">
      <div className="border-b border-gray-300 bg-gray-100 px-4 py-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 uppercase">Empresas Ligadas</h2>
        <Button variant="primary" size="sm" onClick={handleAddNew}>
          + Nova
        </Button>
      </div>

      {showForm && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">CNPJ *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  value={form.empresa_cnpj || ''}
                  onChange={(e) => setForm({ ...form, empresa_cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Razão Social *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  value={form.empresa_razao_social || ''}
                  onChange={(e) => setForm({ ...form, empresa_razao_social: e.target.value })}
                  placeholder="Nome da empresa"
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
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Cargo</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  value={form.cargo || ''}
                  onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                  placeholder="Cargo/função na empresa"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Participação (%)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  value={form.participacao || ''}
                  onChange={(e) => setForm({ ...form, participacao: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Data Início</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  value={form.data_inicio || ''}
                  onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Data Fim</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  value={form.data_fim || ''}
                  onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
                />
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
          <p className="text-sm text-gray-500 text-center py-4">Nenhuma empresa cadastrada</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="p-3 border border-gray-200 rounded flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900">{item.empresa_razao_social}</p>
                    <p className="text-xs text-gray-600">CNPJ: {formatCpfCnpj(item.empresa_cnpj)}</p>
                    {item.tipo_relacionamento && (
                      <Badge variant="info" size="sm">{item.tipo_relacionamento}</Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    {item.cargo && <p>Cargo: {item.cargo}</p>}
                    {item.participacao && <p>Participação: {item.participacao}%</p>}
                    {item.data_inicio && <p>Data Início: {new Date(item.data_inicio).toLocaleDateString('pt-BR')}</p>}
                    {item.data_fim && <p>Data Fim: {new Date(item.data_fim).toLocaleDateString('pt-BR')}</p>}
                    {item.observacoes && <p className="mt-1">{item.observacoes}</p>}
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

