'use client';

import { Fragment, useState } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Tooltip from '@/components/ui/Tooltip';
import Skeleton from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/ToastContainer';
import { supabase } from '@/lib/supabase';
import PessoaLigadaSelector from './PessoaLigadaSelector';

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
  readOnly?: boolean;
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
  onOpenDetails,
  readOnly = false
}: CompactDataManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItemForm, setNewItemForm] = useState<Record<string, any>>({});
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [showNewForm, setShowNewForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingAPI, setFetchingAPI] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{id: string, field: string} | null>(null);
  const [cellValue, setCellValue] = useState('');
  const showActionsColumn = !readOnly;
  const tableColSpan = displayFields.length + 1 + (showActionsColumn ? 1 : 0);
  const { showToast } = useToast();

  const resetNewForm = () => {
    const initialForm: Record<string, any> = {};
    fields.forEach(f => initialForm[f.key] = '');
    setNewItemForm(initialForm);
  };

  const handleAddNew = () => {
    if (readOnly) return;
    resetNewForm();
    setShowNewForm(true);
    setEditingId(null);
  };

  const handleEdit = (item: DataItem) => {
    if (readOnly) return;
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
    if (readOnly) return;
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
    if (readOnly) return;
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
    if (readOnly) return;
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
    if (readOnly) return;
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

  const handleCellSave = async (id: string, field: string, value: any) => {
    if (readOnly) return;
    if (editingCell?.id !== id || editingCell?.field !== field) return;
    
    setLoading(true);
    try {
      const fieldConfig = fields.find(f => f.key === field);
      let processedValue = value;
      
      // Processar valor conforme tipo do campo
      if (fieldConfig?.type === 'number') {
        processedValue = value === '' || value === null || value === undefined ? null : Number(String(value).replace(/,/g, '.'));
      } else if (fieldConfig?.type === 'date') {
        processedValue = value ? value : null;
      } else {
        processedValue = value?.trim() || null;
      }
      
      const { error } = await supabase
        .from(tableName)
        .update({ [field]: processedValue })
        .eq('id', id);
      
      if (error) throw error;
      
      setEditingCell(null);
      setCellValue('');
      // Otimização: atualizar apenas o item editado localmente antes de recarregar
      const updatedItems = items.map(it => 
        it.id === id ? { ...it, [field]: processedValue } : it
      );
      // Não recarrega tudo, apenas atualiza localmente
      // await onRefresh(); // Comentado para melhor performance
      showToast(`${fieldConfig?.label || field} atualizado!`, 'success');
      // Recarrega após um pequeno delay para garantir sincronização
      setTimeout(() => onRefresh(), 300);
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      showToast(`Erro ao atualizar ${field}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const isEditableField = (fieldKey: string): boolean => {
    // Edição é controlada na página inteira, não por célula/item.
    return false;
  };

  const renderEditableCell = (item: DataItem, fieldKey: string, fieldConfig: any) => {
    const isEditing = editingCell?.id === item.id && editingCell?.field === fieldKey;
    const value = item[fieldKey] || '';
    
    if (!isEditing) {
      return (
        <span 
          className="inline-flex items-center gap-1 px-1 py-0.5 rounded text-sm text-gray-900 break-words whitespace-normal"
        >
          <span>{value || '—'}</span>
        </span>
      );
    }
    
    // Renderizar campo editável
    if (fieldConfig?.type === 'select' && fieldConfig.options) {
      return (
        <select
          className="w-full px-1 py-0.5 border border-blue-500 text-xs bg-white"
          value={cellValue}
          onChange={(e) => setCellValue(e.target.value)}
          onBlur={() => handleCellSave(item.id!, fieldKey, cellValue)}
          autoFocus
        >
          <option value="">—</option>
          {fieldConfig.options.map((opt: string) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    } else if (fieldConfig?.type === 'number') {
      return (
        <input
          type="number"
          className="w-full px-1 py-0.5 border border-blue-500 text-xs bg-white"
          value={cellValue}
          onChange={(e) => setCellValue(e.target.value)}
          onBlur={() => handleCellSave(item.id!, fieldKey, cellValue)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleCellSave(item.id!, fieldKey, cellValue);
            }
          }}
          autoFocus
        />
      );
    } else {
      return (
        <input
          type="text"
          className="w-full px-1 py-0.5 border border-blue-500 text-xs bg-white"
          value={cellValue}
          onChange={(e) => setCellValue(e.target.value)}
          onBlur={() => handleCellSave(item.id!, fieldKey, cellValue)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleCellSave(item.id!, fieldKey, cellValue);
            }
            if (e.key === 'Escape') {
              setEditingCell(null);
              setCellValue('');
            }
          }}
          autoFocus
        />
      );
    }
  };

  const renderField = (field: any, value: any, onChange: (val: any) => void, formState?: any) => {
    const baseClass = `w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`;
    
    // Se for campo CPF na tabela de pessoas_ligadas, usar o seletor especial
    if (field.key === 'cpf' && (tableName === 'cedentes_pessoas_ligadas' || tableName === 'sacados_pessoas_ligadas')) {
      const nomeField = fields.find(f => f.key === 'nome');
      return (
        <PessoaLigadaSelector
          value={value || ''}
          onCpfChange={(cpf) => {
            onChange(cpf);
          }}
          onSelect={(pessoa) => {
            // Callback quando pessoa é selecionada
          }}
          onNomeChange={(nome) => {
            // Preencher nome automaticamente quando pessoa for encontrada/selecionada
            if (nomeField && formState && formState.setNome) {
              formState.setNome(nome);
            }
          }}
        />
      );
    }
    
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
            <div key={i} className="border border-gray-300 p-3 bg-white">
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
      <div className="compact-table-title -mx-4 -mt-4 mb-4">
        <div>
          <h3 className="compact-table-title-main">{title}</h3>
          <p className="compact-table-title-sub">{items.length} registro(s) na visualizacao compacta</p>
        </div>
        {!readOnly && (
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
        )}
      </div>

      {/* Conteúdo com padding */}
      <div className="px-4">
      {/* Formulário de novo item - com animação */}
      {!readOnly && showNewForm && (
        <div className="bg-blue-50 border border-blue-200 p-4 animate-fade-in transition-item">
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
                {renderField(
                  field, 
                  newItemForm[field.key], 
                  (val: any) => {
                    const updated = { ...newItemForm, [field.key]: val };
                    setNewItemForm(updated);
                  },
                  {
                    setNome: (nome: string) => {
                      setNewItemForm({ ...newItemForm, nome });
                    }
                  }
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de items - tabela compacta */}
      {items.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-400 border border-dashed border-gray-300 bg-gray-50">
          <p>Nenhum registro encontrado</p>
          <p className="text-xs mt-1 text-gray-400">Clique em "Novo" para adicionar</p>
        </div>
      ) : (
        <div className="compact-table-shell overflow-x-auto">
          <table className="compact-table min-w-[860px]">
            <thead>
              <tr>
                {displayFields.map((field) => {
                  const fieldConfig = fields.find(f => f.key === field);
                  return (
                    <th key={field}>
                      {fieldConfig?.label || field}
                    </th>
                  );
                })}
                <th>Origem</th>
                {showActionsColumn && (
                  <th className="text-center w-[96px]">Acoes</th>
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <Fragment key={item.id ?? `row-${index}`}>
                  <tr className={`${deletingId === item.id ? 'opacity-50 pointer-events-none' : ''}`}>
                    {displayFields.map((field) => {
                      const fieldConfig = fields.find(f => f.key === field);
                      const isEditable = isEditableField(field);
                      return (
                        <td key={`${item.id}-${field}`} className="text-sm">
                          {isEditable ? renderEditableCell(item, field, fieldConfig) : (item[field] || '—')}
                        </td>
                      );
                    })}
                    <td>
                      {item._from_pessoa_fisica ? (
                        <span title="Vinculada de Pessoas Físicas">
                          <Badge variant="success" size="sm">
                            Pessoa Física
                          </Badge>
                        </span>
                      ) : item.origem === 'api' ? (
                        <Badge variant="info" size="sm">
                          API
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          Manual
                        </Badge>
                      )}
                    </td>
                    {showActionsColumn && (
                      <td>
                      <div className="flex items-center justify-center gap-1.5">
                        {showDetailsButton && !readOnly && onOpenDetails && (
                          <button
                            onClick={() => onOpenDetails(item)}
                            className="w-7 h-7 inline-flex items-center justify-center text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
                            title="Abrir detalhes"
                            aria-label="Abrir detalhes"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                        )}

                        {!readOnly && (
                          <>
                            {item._from_pessoa_fisica || (item.cpf && onOpenDetails) ? (
                              <Tooltip content={item._from_pessoa_fisica ? 'Esta pessoa é gerenciada em Pessoas Físicas → Vinculações' : 'Ver perfil completo da pessoa física'}>
                                <span>
                                  {item.cpf && onOpenDetails ? (
                                    <button
                                      onClick={() => onOpenDetails(item)}
                                      className="w-7 h-7 inline-flex items-center justify-center text-green-600 bg-white border border-green-300 rounded-md hover:bg-green-50 transition-colors"
                                      title="Ver Perfil Completo"
                                      aria-label="Ver perfil completo"
                                    >
                                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21a8 8 0 10-16 0" />
                                        <circle cx="12" cy="7" r="4" />
                                      </svg>
                                    </button>
                                  ) : (
                                    <button
                                      disabled
                                      className="w-7 h-7 inline-flex items-center justify-center text-gray-400 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed"
                                      title="Gerenciar em Pessoas Físicas"
                                      aria-label="Gerenciado em pessoas fisicas"
                                    >
                                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0110 0v4" />
                                      </svg>
                                    </button>
                                  )}
                                </span>
                              </Tooltip>
                            ) : null}

                            {item._from_pessoa_fisica ? (
                              <Tooltip content="Esta pessoa é gerenciada em Pessoas Físicas → Vinculações">
                                <span>
                                  <button
                                    disabled
                                    className="w-7 h-7 inline-flex items-center justify-center text-gray-400 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed"
                                    title="Gerenciar em Pessoas Físicas"
                                    aria-label="Gerenciado em pessoas fisicas"
                                  >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                      <path d="M7 11V7a5 5 0 0110 0v4" />
                                    </svg>
                                  </button>
                                </span>
                              </Tooltip>
                            ) : (
                              <button
                                onClick={() => handleDelete(item.id!)}
                                disabled={loading || deletingId === item.id}
                                className="w-7 h-7 inline-flex items-center justify-center text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50 transition-colors"
                                title="Excluir"
                                aria-label="Excluir"
                              >
                                {deletingId === item.id ? (
                                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-red-400 border-t-transparent"></div>
                                ) : (
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18" />
                                    <path d="M8 6V4h8v2" />
                                    <path d="M19 6l-1 14H6L5 6" />
                                    <path d="M10 11v6" />
                                    <path d="M14 11v6" />
                                  </svg>
                                )}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    )}
                  </tr>

                  {showDetailsButton && !onOpenDetails && item.observacoes && (
                    <tr key={`${item.id}-observacoes`} className="bg-gray-50">
                      <td colSpan={tableColSpan} className="text-sm text-gray-700">
                        <span className="font-semibold text-blue-700">Observações:</span>
                        <div className="mt-1 whitespace-pre-wrap">{item.observacoes}</div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  );
}
