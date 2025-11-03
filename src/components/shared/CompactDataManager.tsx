'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';

type DataItem = {
  id?: string;
  [key: string]: any;
};

type CompactDataManagerProps = {
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
    width?: 'full' | 'half' | 'third';
  }[];
  displayFields: string[];
  onFetchFromAPI?: () => Promise<void>;
  showDetailsButton?: boolean;
};

export default function CompactDataManager({
  title,
  entityId,
  tableName,
  items,
  onRefresh,
  fields,
  displayFields,
  onFetchFromAPI,
  showDetailsButton = false
}: CompactDataManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItemForm, setNewItemForm] = useState<Record<string, any>>({});
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [showNewForm, setShowNewForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingAPI, setFetchingAPI] = useState(false);
  const [showDetailsId, setShowDetailsId] = useState<string | null>(null);

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
    const missingFields = fields
      .filter(f => f.required && !newItemForm[f.key])
      .map(f => f.label);
    
    if (missingFields.length > 0) {
      alert(`Preencha: ${missingFields.join(', ')}`);
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

      if (dataToSave.cpf) dataToSave.cpf = dataToSave.cpf.replace(/\D+/g, '');
      if (dataToSave.cnpj_relacionado) dataToSave.cnpj_relacionado = dataToSave.cnpj_relacionado.replace(/\D+/g, '');

      const { error } = await supabase.from(tableName).insert(dataToSave);
      if (error) throw error;

      await onRefresh();
      handleCancelNew();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar');
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

      if (dataToUpdate.cpf) dataToUpdate.cpf = dataToUpdate.cpf.replace(/\D+/g, '');
      if (dataToUpdate.cnpj_relacionado) dataToUpdate.cnpj_relacionado = dataToUpdate.cnpj_relacionado.replace(/\D+/g, '');

      const { error } = await supabase.from(tableName).update(dataToUpdate).eq('id', id);
      if (error) throw error;

      await onRefresh();
      handleCancelEdit();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      alert('Erro ao atualizar');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este item?')) return;
    
    try {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
      await onRefresh();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir');
    }
  };

  const handleFetchAPI = async () => {
    if (!onFetchFromAPI) return;
    setFetchingAPI(true);
    try {
      await onFetchFromAPI();
      await onRefresh();
    } catch (error) {
      console.error('Erro API:', error);
      alert('Erro ao buscar da API');
    } finally {
      setFetchingAPI(false);
    }
  };

  const renderField = (field: any, value: any, onChange: (val: any) => void, isCompact: boolean = false) => {
    const baseClass = `px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`;
    
    if (field.type === 'select') {
      return (
        <select className={`${baseClass} bg-white`} value={value || ''} onChange={e => onChange(e.target.value)}>
          <option value="">-</option>
          {field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          className={`${baseClass} min-h-[60px] resize-none`}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      );
    }

    return (
      <input
        type={field.type || 'text'}
        className={baseClass}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder}
      />
    );
  };

  return (
    <div className="space-y-3">
      {/* Header compacto */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        <div className="flex gap-2">
          {onFetchFromAPI && (
            <button 
              onClick={handleFetchAPI}
              disabled={fetchingAPI}
              className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              {fetchingAPI ? '...' : 'API'}
            </button>
          )}
          <button 
            onClick={handleAddNew}
            disabled={showNewForm}
            className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            + Novo
          </button>
        </div>
      </div>

      {/* Formulário de novo item - compacto */}
      {showNewForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-blue-800">Novo</span>
            <div className="flex gap-1">
              <button onClick={handleSaveNew} disabled={loading} className="px-2 py-0.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700">
                Salvar
              </button>
              <button onClick={handleCancelNew} className="px-2 py-0.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {fields.map(field => (
              <div key={field.key} className={field.width === 'full' ? 'col-span-full' : field.width === 'half' ? 'col-span-2' : ''}>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  {field.label}{field.required && '*'}
                </label>
                {renderField(field, newItemForm[field.key], (val: any) => setNewItemForm({ ...newItemForm, [field.key]: val }), true)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de items - compacta */}
      {items.length === 0 ? (
        <div className="text-center py-6 text-sm text-gray-400 border border-dashed border-gray-200 rounded">
          Nenhum registro
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className={`border rounded-lg p-2.5 transition-colors ${editingId === item.id ? 'bg-yellow-50 border-yellow-300' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
              {editingId === item.id ? (
                // Modo edição
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-yellow-800">Editando</span>
                    <div className="flex gap-1">
                      <button onClick={() => handleSaveEdit(item.id!)} disabled={loading} className="px-2 py-0.5 text-xs font-medium text-white bg-yellow-600 rounded hover:bg-yellow-700">
                        Salvar
                      </button>
                      <button onClick={handleCancelEdit} className="px-2 py-0.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50">
                        Cancelar
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {fields.map(field => (
                      <div key={field.key} className={field.width === 'full' ? 'col-span-full' : field.width === 'half' ? 'col-span-2' : ''}>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">
                          {field.label}{field.required && '*'}
                        </label>
                        {renderField(field, editForm[field.key], (val: any) => setEditForm({ ...editForm, [field.key]: val }), true)}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                // Modo visualização - super compacto
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1">
                      {displayFields.map(field => {
                        const fieldConfig = fields.find(f => f.key === field);
                        return (
                          <div key={field} className="flex items-baseline gap-1">
                            <span className="text-xs font-medium text-gray-500 shrink-0">{fieldConfig?.label}:</span>
                            <span className="text-sm text-gray-900 truncate">{item[field] || '—'}</span>
                          </div>
                        );
                      })}
                      <div className="flex items-baseline gap-1">
                        <Badge variant={item.origem === 'api' ? 'info' : 'neutral'} size="sm">
                          {item.origem === 'api' ? 'API' : 'Manual'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {showDetailsButton && (
                        <button
                          onClick={() => setShowDetailsId(showDetailsId === item.id ? null : item.id!)}
                          className="px-2 py-0.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50"
                          title={showDetailsId === item.id ? "Ocultar OBS" : "Ver OBS"}
                        >
                          {showDetailsId === item.id ? '▲' : '▼'}
                        </button>
                      )}
                      <button onClick={() => handleEdit(item)} className="px-2 py-0.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50">
                        Editar
                      </button>
                      <button onClick={() => handleDelete(item.id!)} className="px-2 py-0.5 text-xs font-medium text-red-600 bg-white border border-red-300 rounded hover:bg-red-50">
                        Excluir
                      </button>
                    </div>
                  </div>
                  {showDetailsButton && showDetailsId === item.id && item.observacoes && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="text-sm">
                        <span className="font-semibold text-[#0369a1]">OBS:</span>
                        <div className="mt-1 text-[#1e293b] whitespace-pre-wrap bg-gray-50 p-2 rounded">{item.observacoes}</div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
