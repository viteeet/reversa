'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Tooltip from '@/components/ui/Tooltip';
import Skeleton from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/ToastContainer';
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
    tooltip?: string;
  }[];
  displayFields: string[];
  onFetchFromAPI?: () => Promise<void>;
  showDetailsButton?: boolean;
  isLoading?: boolean;
  onOpenDetails?: (item: DataItem) => void;
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
  showDetailsButton = false,
  isLoading = false,
  onOpenDetails
}: CompactDataManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItemForm, setNewItemForm] = useState<Record<string, any>>({});
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [showNewForm, setShowNewForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingAPI, setFetchingAPI] = useState(false);
  const [showDetailsId, setShowDetailsId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { showToast } = useToast();

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
      showToast(`Preencha os campos obrigatórios: ${missingFields.join(', ')}`, 'warning');
      return;
    }

    setLoading(true);
    try {
      // Normaliza tipos para o banco (evita "" em campos numéricos/data)
      const normalized: any = { cedente_id: entityId, origem: 'manual', ativo: true };
      for (const f of fields) {
        const raw = newItemForm[f.key];
        if (f.type === 'number') {
          normalized[f.key] = raw === '' || raw === null || raw === undefined ? null : Number(String(raw).replace(/,/g, '.'));
        } else if (f.type === 'date') {
          normalized[f.key] = raw ? raw : null;
        } else {
          normalized[f.key] = raw ?? null;
        }
      }

      if (normalized.cpf) normalized.cpf = String(normalized.cpf).replace(/\D+/g, '');
      if (normalized.cnpj_relacionado) normalized.cnpj_relacionado = String(normalized.cnpj_relacionado).replace(/\D+/g, '');

      // Caso especial: QSA possui detalhes/observações em tabela separada
      let observacoesQsa: string | undefined;
      if (tableName === 'cedentes_qsa' && 'observacoes' in normalized) {
        observacoesQsa = normalized.observacoes || '';
        delete normalized.observacoes; // não existe essa coluna em cedentes_qsa
      }

      // Inserir e retornar id para possíveis relações
      const { data: inserted, error } = await supabase
        .from(tableName)
        .insert(normalized)
        .select('id')
        .single();
      if (error) throw error;

      // Se tiver observações de QSA, salva na tabela detalhes
      if (tableName === 'cedentes_qsa' && inserted?.id && observacoesQsa !== undefined) {
        const { error: errDet } = await supabase
          .from('cedentes_qsa_detalhes')
          .upsert({
            qsa_id: inserted.id,
            cedente_id: entityId,
            detalhes_completos: observacoesQsa || '',
          }, { onConflict: 'qsa_id' });
        if (errDet) throw errDet;
      }

      await onRefresh();
      handleCancelNew();
      showToast('Item adicionado com sucesso!', 'success');
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      // Mensagem mais amigável para tipos numéricos inválidos
      const msg = (error?.code === '22P02')
        ? 'Valor inválido em campo numérico. Use apenas números (ex: 10.5)'
        : (error.message || 'Erro ao salvar item');
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    setLoading(true);
    try {
      // Normaliza tipos para o banco (evita "" em campos numéricos/data)
      const dataToUpdate: any = { ...editForm };
      delete dataToUpdate.id;
      delete dataToUpdate.created_at;
      delete dataToUpdate.updated_at;
      for (const f of fields) {
        if (!(f.key in dataToUpdate)) continue;
        const raw = dataToUpdate[f.key];
        if (f.type === 'number') {
          dataToUpdate[f.key] = raw === '' || raw === null || raw === undefined ? null : Number(String(raw).replace(/,/g, '.'));
        } else if (f.type === 'date') {
          dataToUpdate[f.key] = raw ? raw : null;
        }
      }

      if (dataToUpdate.cpf) dataToUpdate.cpf = String(dataToUpdate.cpf).replace(/\D+/g, '');
      if (dataToUpdate.cnpj_relacionado) dataToUpdate.cnpj_relacionado = String(dataToUpdate.cnpj_relacionado).replace(/\D+/g, '');

      // Caso especial: QSA - mover observações para tabela de detalhes
      let observacoesQsa: string | undefined;
      if (tableName === 'cedentes_qsa' && 'observacoes' in dataToUpdate) {
        observacoesQsa = dataToUpdate.observacoes || '';
        delete dataToUpdate.observacoes;
      }

      const { error } = await supabase.from(tableName).update(dataToUpdate).eq('id', id);
      if (error) throw error;

      if (tableName === 'cedentes_qsa' && observacoesQsa !== undefined) {
        const { error: errDet } = await supabase
          .from('cedentes_qsa_detalhes')
          .upsert({
            qsa_id: id,
            cedente_id: entityId,
            detalhes_completos: observacoesQsa || '',
          }, { onConflict: 'qsa_id' });
        if (errDet) throw errDet;
      }

      await onRefresh();
      handleCancelEdit();
      showToast('Item atualizado com sucesso!', 'success');
    } catch (error: any) {
      console.error('Erro ao atualizar:', error);
      const msg = (error?.code === '22P02')
        ? 'Valor inválido em campo numérico. Use apenas números (ex: 10.5)'
        : (error.message || 'Erro ao atualizar item');
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    
    setDeletingId(id);
    try {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
      await onRefresh();
      showToast('Item excluído com sucesso!', 'success');
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      showToast(error.message || 'Erro ao excluir item', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleFetchAPI = async () => {
    if (!onFetchFromAPI) return;
    setFetchingAPI(true);
    try {
      await onFetchFromAPI();
      await onRefresh();
      // Sem mensagem de sucesso - importação silenciosa
    } catch (error: any) {
      console.error('Erro API:', error);
      // Apenas erros são mostrados, sucesso é silencioso
    } finally {
      setFetchingAPI(false);
    }
  };

  const renderField = (field: any, value: any, onChange: (val: any) => void) => {
    const baseClass = `w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`;
    
    if (field.type === 'select') {
      return (
        <select className={baseClass} value={value || ''} onChange={e => onChange(e.target.value)}>
          <option value="">-</option>
          {field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          className={`${baseClass} min-h-[80px] resize-y`}
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

  const renderFieldLabel = (field: any) => {
    return (
      <div className="flex items-center gap-1.5 mb-1">
        <label className="text-xs font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {field.tooltip && (
          <Tooltip content={field.tooltip} position="top">
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 transition-colors"
              onClick={(e) => e.preventDefault()}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </button>
          </Tooltip>
        )}
      </div>
    );
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <Skeleton width="200px" height="20px" />
          <div className="flex gap-2">
            <Skeleton width="60px" height="28px" />
            <Skeleton width="70px" height="28px" />
          </div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="border rounded-lg p-3 bg-white">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {displayFields.slice(0, 4).map((_, idx) => (
                  <div key={idx}>
                    <Skeleton width="80px" height="14px" className="mb-1" />
                    <Skeleton width="100%" height="32px" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              {fetchingAPI ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-400 border-t-transparent"></div>
                  <span>Carregando...</span>
                </>
              ) : (
                <>
                  <span>🔄</span>
                  <span>API</span>
                </>
              )}
            </button>
          )}
          <button 
            onClick={handleAddNew}
            disabled={showNewForm || loading}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Novo</span>
          </button>
        </div>
      </div>

      {/* Formulário de novo item - com animação */}
      {showNewForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-fade-in transition-item">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-blue-800">Novo Registro</span>
            <div className="flex gap-2">
              <button 
                onClick={handleSaveNew} 
                disabled={loading} 
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    <span>Salvar</span>
                  </>
                )}
              </button>
              <button 
                onClick={handleCancelNew} 
                disabled={loading}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {fields.map(field => (
              <div 
                key={field.key} 
                className={field.width === 'full' ? 'md:col-span-2 lg:col-span-3' : field.width === 'half' ? 'md:col-span-1 lg:col-span-2' : ''}
              >
                {renderFieldLabel(field)}
                {renderField(field, newItemForm[field.key], (val: any) => setNewItemForm({ ...newItemForm, [field.key]: val }))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de items - com transições */}
      {items.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-400 border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <p>Nenhum registro encontrado</p>
          <p className="text-xs mt-1 text-gray-400">Clique em "Novo" para adicionar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div 
              key={item.id} 
              className={`border rounded-lg p-3 transition-all duration-300 animate-fade-in ${
                editingId === item.id 
                  ? 'bg-yellow-50 border-yellow-300 shadow-md' 
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
              } ${deletingId === item.id ? 'opacity-50 pointer-events-none' : ''}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {editingId === item.id ? (
                // Modo edição
                <div className="animate-fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-yellow-800">Editando Registro</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleSaveEdit(item.id!)} 
                        disabled={loading} 
                        className="px-3 py-1.5 text-xs font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                            <span>Salvando...</span>
                          </>
                        ) : (
                          <>
                            <span>✓</span>
                            <span>Salvar</span>
                          </>
                        )}
                      </button>
                      <button 
                        onClick={handleCancelEdit} 
                        disabled={loading}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {fields.map(field => (
                      <div 
                        key={field.key} 
                        className={field.width === 'full' ? 'md:col-span-2 lg:col-span-3' : field.width === 'half' ? 'md:col-span-1 lg:col-span-2' : ''}
                      >
                        {renderFieldLabel(field)}
                        {renderField(field, editForm[field.key], (val: any) => setEditForm({ ...editForm, [field.key]: val }))}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Modo visualização - compacto
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1.5">
                      {displayFields.map(field => {
                        const fieldConfig = fields.find(f => f.key === field);
                        return (
                          <div key={field} className="flex items-baseline gap-1.5 min-w-0">
                            <span className="text-xs font-medium text-gray-500 shrink-0">{fieldConfig?.label}:</span>
                            <span className="text-sm text-gray-900 truncate">{item[field] || '—'}</span>
                          </div>
                        );
                      })}
                      <div className="flex items-baseline gap-1.5">
                        <Badge variant={item.origem === 'api' ? 'info' : 'neutral'} size="sm">
                          {item.origem === 'api' ? 'API' : 'Manual'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {showDetailsButton && (
                        onOpenDetails ? (
                          <button
                            onClick={() => onOpenDetails(item)}
                            className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
                            title="Abrir detalhes"
                          >
                            Detalhes
                          </button>
                        ) : (
                          <button
                            onClick={() => setShowDetailsId(showDetailsId === item.id ? null : item.id!)}
                            className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            title={showDetailsId === item.id ? "Ocultar Observações" : "Ver Observações"}
                          >
                            {showDetailsId === item.id ? '▲' : '▼'}
                          </button>
                        )
                      )}
                      <button 
                        onClick={() => handleEdit(item)} 
                        disabled={loading || deletingId === item.id}
                        className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id!)} 
                        disabled={loading || deletingId === item.id}
                        className="px-2.5 py-1 text-xs font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50 transition-colors"
                      >
                        {deletingId === item.id ? '...' : 'Excluir'}
                      </button>
                    </div>
                  </div>
                  {showDetailsButton && showDetailsId === item.id && item.observacoes && (
                    <div className="mt-3 pt-3 border-t border-gray-200 animate-fade-in">
                      <div className="text-sm">
                        <span className="font-semibold text-blue-700">Observações:</span>
                        <div className="mt-1.5 text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-md border border-gray-200">
                          {item.observacoes}
                        </div>
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
