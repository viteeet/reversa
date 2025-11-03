'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase';

type DataItem = {
  id?: string;
  [key: string]: any;
};

type DataManagerProps = {
  title: string;
  cnpj: string;
  tableName: string;
  items: DataItem[];
  onRefresh: () => void;
  fields: {
    key: string;
    label: string;
    type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'textarea';
    options?: string[];
    required?: boolean;
  }[];
  displayFields: string[];
  onFetchFromAPI?: () => Promise<void>;
  showDetailsButton?: boolean;
};

export default function DataManager({
  title,
  cnpj,
  tableName,
  items,
  onRefresh,
  fields,
  displayFields,
  onFetchFromAPI,
  showDetailsButton = false
}: DataManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<DataItem | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [fetchingAPI, setFetchingAPI] = useState(false);
  const [showDetailsId, setShowDetailsId] = useState<string | null>(null);

  const resetForm = () => {
    const initialForm: Record<string, any> = {};
    fields.forEach(f => initialForm[f.key] = '');
    setForm(initialForm);
    setEditingItem(null);
  };

  const openModal = (item?: DataItem) => {
    if (item) {
      setEditingItem(item);
      setForm(item);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const dataToSave: any = {
        ...form,
        sacado_cnpj: cnpj,
        origem: 'manual',
        ativo: true
      };

      // Remove formatação de CPF antes de salvar
      if (dataToSave.cpf) {
        dataToSave.cpf = dataToSave.cpf.replace(/\D+/g, '');
      }

      if (editingItem?.id) {
        // Update
        const { error } = await supabase
          .from(tableName)
          .update(dataToSave)
          .eq('id', editingItem.id);
        
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from(tableName)
          .insert(dataToSave);
        
        if (error) throw error;
      }

      await onRefresh();
      closeModal();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar dados');
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

  return (
    <div className="space-y-4">
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
              Buscar da API
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={() => openModal()}>
            Adicionar
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-[#64748b]">
          <p>Nenhum registro encontrado</p>
          <p className="text-sm">Clique em "Adicionar" ou "Buscar da API" para começar</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[#e0efff] to-[#f0f7ff]">
              <tr>
                {displayFields.map(field => (
                  <th key={field} className="px-4 py-3 text-left text-sm font-semibold text-[#0369a1]">
                    {fields.find(f => f.key === field)?.label || field}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#0369a1]">Origem</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#0369a1] w-32">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#cbd5e1]">
              {items.map(item => (
                <>
                  <tr key={item.id} className="hover:bg-[#f8fbff] transition-colors">
                    {displayFields.map(field => (
                      <td key={field} className="px-4 py-3 text-sm text-[#1e293b]">
                        {item[field] || '—'}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <Badge 
                        variant={item.origem === 'api' ? 'info' : 'neutral'} 
                        size="sm"
                      >
                        {item.origem === 'api' ? 'API' : 'Manual'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {showDetailsButton && (
                          <button
                            onClick={() => setShowDetailsId(showDetailsId === item.id ? null : item.id!)}
                            className="px-2 py-1 text-xs border border-[#cbd5e1] rounded hover:bg-white"
                            title={showDetailsId === item.id ? "Ocultar OBS" : "Ver OBS"}
                          >
                            {showDetailsId === item.id ? '▲' : '▼'}
                          </button>
                        )}
                        <button
                          onClick={() => openModal(item)}
                          className="px-2 py-1 text-xs border border-[#cbd5e1] rounded hover:bg-white"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(item.id!)}
                          className="px-2 py-1 text-xs border border-[#cbd5e1] rounded hover:bg-white"
                          title="Excluir"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                  {showDetailsButton && showDetailsId === item.id && item.observacoes && (
                    <tr key={`${item.id}-details`} className="bg-[#f0f7ff]">
                      <td colSpan={displayFields.length + 2} className="px-4 py-3">
                        <div className="text-sm">
                          <span className="font-semibold text-[#0369a1]">OBS:</span>
                          <span className="ml-2 text-[#1e293b]">{item.observacoes}</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingItem ? `Editar ${title}` : `Adicionar ${title}`}
      >
        <div className="space-y-4">
          {fields.map(field => (
            <div key={field.key}>
              {field.type === 'select' ? (
                <div>
                  <label className="block text-sm font-medium text-[#1e293b] mb-1">
                    {field.label}
                    {field.required && <span className="text-[#ef4444]">*</span>}
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0369a1] bg-white text-[#1e293b]"
                    value={form[field.key] || ''}
                    onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                    required={field.required}
                  >
                    <option value="">Selecione...</option>
                    {field.options?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              ) : field.type === 'textarea' ? (
                <div>
                  <label className="block text-sm font-medium text-[#1e293b] mb-1">
                    {field.label}
                    {field.required && <span className="text-[#ef4444]">*</span>}
                  </label>
                  <textarea
                    className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0369a1] bg-white text-[#1e293b] min-h-[80px]"
                    value={form[field.key] || ''}
                    onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                    required={field.required}
                  />
                </div>
              ) : (
                <Input
                  label={field.label}
                  type={field.type || 'text'}
                  value={form[field.key] || ''}
                  onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                  required={field.required}
                />
              )}
            </div>
          ))}

          <div className="flex gap-3 pt-4">
            <Button 
              variant="primary" 
              onClick={handleSave} 
              loading={loading}
            >
              Salvar
            </Button>
            <Button variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

