'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';

type DataItem = {
  id?: string;
  [key: string]: any;
};

type InlineDataManagerProps = {
  title: string;
  entityId: string;
  tableName: string;
  items: DataItem[];
  onRefresh: () => void;
  fields: {
    key: string;
    label: string;
    type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'textarea';
    options?: string[];
    required?: boolean;
    placeholder?: string;
  }[];
  displayFields: string[];
  onFetchFromAPI?: () => Promise<void>;
  observacoesGerais?: string;
  onObservacoesChange?: (obs: string) => void;
  showObservacoesGerais?: boolean;
};

export default function InlineDataManager({
  title,
  entityId,
  tableName,
  items,
  onRefresh,
  fields,
  displayFields,
  onFetchFromAPI,
  observacoesGerais,
  onObservacoesChange,
  showObservacoesGerais = false
}: InlineDataManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItemForm, setNewItemForm] = useState<Record<string, any>>({});
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [showNewForm, setShowNewForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingAPI, setFetchingAPI] = useState(false);

  const resetNewForm = () => {
    const initialForm: Record<string, any> = {};
    fields.forEach(f => initialForm[f.key] = '');
    setNewItemForm(initialForm);
  };

  const handleAddNew = () => {
    resetNewForm();
    setShowNewForm(true);
    setEditingId(null);
  };

  const handleEdit = (item: DataItem) => {
    setEditForm(item);
    setEditingId(item.id || null);
    setShowNewForm(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleCancelNew = () => {
    setShowNewForm(false);
    resetNewForm();
  };

  const handleSaveNew = async () => {
    // Validar campos obrigatórios
    const missingFields = fields
      .filter(f => f.required && !newItemForm[f.key])
      .map(f => f.label);
    
    if (missingFields.length > 0) {
      alert(`Preencha os campos obrigatórios: ${missingFields.join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      const dataToSave: any = {
        ...newItemForm,
        cedente_id: entityId,
        origem: 'manual',
        ativo: true
      };

      // Remove formatação de CPF/CNPJ antes de salvar
      if (dataToSave.cpf) {
        dataToSave.cpf = dataToSave.cpf.replace(/\D+/g, '');
      }
      if (dataToSave.cnpj_relacionado) {
        dataToSave.cnpj_relacionado = dataToSave.cnpj_relacionado.replace(/\D+/g, '');
      }

      const { error } = await supabase
        .from(tableName)
        .insert(dataToSave);
      
      if (error) throw error;

      await onRefresh();
      handleCancelNew();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    setLoading(true);
    try {
      const dataToUpdate: any = { ...editForm };
      delete dataToUpdate.id;
      delete dataToUpdate.created_at;
      delete dataToUpdate.updated_at;

      // Remove formatação
      if (dataToUpdate.cpf) {
        dataToUpdate.cpf = dataToUpdate.cpf.replace(/\D+/g, '');
      }
      if (dataToUpdate.cnpj_relacionado) {
        dataToUpdate.cnpj_relacionado = dataToUpdate.cnpj_relacionado.replace(/\D+/g, '');
      }

      const { error } = await supabase
        .from(tableName)
        .update(dataToUpdate)
        .eq('id', id);
      
      if (error) throw error;

      await onRefresh();
      handleCancelEdit();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      alert('Erro ao atualizar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await onRefresh();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir dados');
    }
  };

  const handleFetchAPI = async () => {
    if (!onFetchFromAPI) return;
    
    setFetchingAPI(true);
    try {
      await onFetchFromAPI();
      await onRefresh();
    } catch (error) {
      console.error('Erro ao buscar da API:', error);
      alert('Erro ao buscar dados da API');
    } finally {
      setFetchingAPI(false);
    }
  };

  const renderField = (field: any, value: any, onChange: (val: any) => void) => {
    if (field.type === 'select') {
      return (
        <select
          className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm bg-white"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
        >
          <option value="">Selecione...</option>
          {field.options?.map((opt: string) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm min-h-[60px]"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      );
    }

    return (
      <input
        type={field.type || 'text'}
        className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder}
      />
    );
  };

  return (
    <div className="space-y-4">
      {/* Header com botões */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#0369a1]">{title}</h2>
        <div className="flex gap-2">
          {onFetchFromAPI && (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleFetchAPI}
              loading={fetchingAPI}
            >
              🔄 Buscar da API
            </Button>
          )}
          <Button 
            variant="primary" 
            size="sm" 
            onClick={handleAddNew}
            disabled={showNewForm}
          >
            + Adicionar Novo
          </Button>
        </div>
      </div>

      {/* Observações Gerais */}
      {showObservacoesGerais && onObservacoesChange && (
        <div className="bg-[#fef3c7] border border-[#fbbf24] rounded-lg p-4">
          <label className="block text-sm font-medium text-[#92400e] mb-2">
            💬 Observações Gerais sobre {title}
          </label>
          <textarea
            className="w-full px-3 py-2 border border-[#fbbf24] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f59e0b] text-sm min-h-[80px] bg-white"
            value={observacoesGerais || ''}
            onChange={e => onObservacoesChange(e.target.value)}
            placeholder="Digite observações gerais que se aplicam a todos os itens deste quadro..."
          />
        </div>
      )}

      {/* Formulário de Novo Item */}
      {showNewForm && (
        <div className="bg-[#e0f2fe] border-2 border-[#0ea5e9] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#0369a1]">✨ Novo Registro</h3>
            <div className="flex gap-2">
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleSaveNew}
                loading={loading}
              >
                ✓ Salvar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancelNew}
              >
                ✗ Cancelar
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {fields.map(field => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-[#0369a1] mb-1">
                  {field.label}
                  {field.required && <span className="text-[#ef4444]">*</span>}
                </label>
                {renderField(
                  field,
                  newItemForm[field.key],
                  (val: any) => setNewItemForm({ ...newItemForm, [field.key]: val })
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Items */}
      {items.length === 0 ? (
        <div className="text-center py-8 bg-[#f8fafc] rounded-lg border border-dashed border-[#cbd5e1]">
          <p className="text-[#64748b]">Nenhum registro encontrado</p>
          <p className="text-sm text-[#94a3b8] mt-1">
            Clique em "+ Adicionar Novo" {onFetchFromAPI && 'ou "Buscar da API"'} para começar
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div 
              key={item.id} 
              className={`border rounded-lg p-4 transition-all ${
                editingId === item.id 
                  ? 'bg-[#fef3c7] border-[#fbbf24] border-2' 
                  : 'bg-white border-[#e2e8f0] hover:border-[#cbd5e1]'
              }`}
            >
              {editingId === item.id ? (
                // Modo de Edição
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-[#92400e]">✏️ Editando</h3>
                    <div className="flex gap-2">
                      <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={() => handleSaveEdit(item.id!)}
                        loading={loading}
                      >
                        ✓ Salvar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleCancelEdit}
                      >
                        ✗ Cancelar
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {fields.map(field => (
                      <div key={field.key}>
                        <label className="block text-xs font-medium text-[#92400e] mb-1">
                          {field.label}
                          {field.required && <span className="text-[#ef4444]">*</span>}
                        </label>
                        {renderField(
                          field,
                          editForm[field.key],
                          (val: any) => setEditForm({ ...editForm, [field.key]: val })
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                // Modo de Visualização
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {displayFields.map(field => {
                        const fieldConfig = fields.find(f => f.key === field);
                        return (
                          <div key={field}>
                            <label className="block text-xs font-medium text-[#64748b]">
                              {fieldConfig?.label || field}
                            </label>
                            <p className="text-sm text-[#1e293b] mt-1">
                              {item[field] || '—'}
                            </p>
                          </div>
                        );
                      })}
                      <div>
                        <label className="block text-xs font-medium text-[#64748b]">
                          Origem
                        </label>
                        <div className="mt-1">
                          <Badge 
                            variant={item.origem === 'api' ? 'info' : 'neutral'} 
                            size="sm"
                          >
                            {item.origem === 'api' ? 'API' : 'Manual'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(item)}
                      >
                        ✏️ Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(item.id!)}
                      >
                        🗑️ Excluir
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
