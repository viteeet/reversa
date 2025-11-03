'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase';

type FoundDataItem = {
  id?: string;
  tipo: string;
  titulo: string;
  conteudo: string;
  observacoes?: string;
  fonte?: string;
  data_encontrado?: string;
};

type FoundDataManagerProps = {
  cnpj: string;
  items: FoundDataItem[];
  onRefresh: () => void;
};

const TIPOS = [
  { value: 'telefone', label: '📞 Telefone', icon: '📞' },
  { value: 'email', label: '📧 Email', icon: '📧' },
  { value: 'endereco', label: '📍 Endereço', icon: '📍' },
  { value: 'pessoa', label: '👤 Pessoa', icon: '👤' },
  { value: 'empresa', label: '🏢 Empresa', icon: '🏢' },
  { value: 'processo', label: '⚖️ Processo', icon: '⚖️' },
  { value: 'outros', label: '📝 Outros', icon: '📝' }
];

const FONTES = [
  'Google',
  'Indicação',
  'LinkedIn',
  'Site da Empresa',
  'Redes Sociais',
  'Telefone',
  'Email',
  'Outros'
];

export default function FoundDataManager({ cnpj, items, onRefresh }: FoundDataManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FoundDataItem | null>(null);
  const [form, setForm] = useState<FoundDataItem>({
    tipo: '',
    titulo: '',
    conteudo: '',
    observacoes: '',
    fonte: '',
    data_encontrado: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setForm({
      tipo: '',
      titulo: '',
      conteudo: '',
      observacoes: '',
      fonte: '',
      data_encontrado: new Date().toISOString().split('T')[0]
    });
    setEditingItem(null);
  };

  const openModal = (item?: FoundDataItem) => {
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
    if (!form.tipo || !form.titulo || !form.conteudo) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const dataToSave = {
        sacado_cnpj: cnpj,
        tipo: form.tipo,
        titulo: form.titulo,
        conteudo: form.conteudo,
        observacoes: form.observacoes || null,
        fonte: form.fonte || null,
        data_encontrado: form.data_encontrado || new Date().toISOString().split('T')[0],
        ativo: true
      };

      if (editingItem?.id) {
        const { error } = await supabase
          .from('sacados_dados_encontrados')
          .update(dataToSave)
          .eq('id', editingItem.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sacados_dados_encontrados')
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
        .from('sacados_dados_encontrados')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await onRefresh();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir dados');
    }
  };

  const getIcon = (tipo: string) => {
    return TIPOS.find(t => t.value === tipo)?.icon || '📝';
  };

  const getTypeLabel = (tipo: string) => {
    return TIPOS.find(t => t.value === tipo)?.label || tipo;
  };

  // Agrupar items por tipo
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.tipo]) {
      acc[item.tipo] = [];
    }
    acc[item.tipo].push(item);
    return acc;
  }, {} as Record<string, FoundDataItem[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#0369a1]">Dados Encontrados</h2>
        <Button variant="primary" size="sm" onClick={() => openModal()}>
          <span className="text-lg mr-1">+</span> Adicionar Informação
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 bg-[#f8fafc] rounded-lg border border-dashed border-[#cbd5e1]">
          <p className="text-[#64748b]">Nenhum dado encontrado ainda</p>
          <p className="text-sm text-[#94a3b8] mt-1">
            Clique em "+ Adicionar Informação" para registrar dados encontrados
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {TIPOS.map(tipo => {
            const itemsDoTipo = groupedItems[tipo.value] || [];
            if (itemsDoTipo.length === 0) return null;

            return (
              <div key={tipo.value} className="bg-[#f8fafc] rounded-lg p-4 border border-[#e2e8f0]">
                <h3 className="text-sm font-semibold text-[#0369a1] mb-3 flex items-center gap-2">
                  <span>{tipo.icon}</span>
                  {tipo.label}
                  <Badge variant="neutral" size="sm">{itemsDoTipo.length}</Badge>
                </h3>
                <div className="space-y-2">
                  {itemsDoTipo.map(item => (
                    <div key={item.id} className="bg-white rounded-lg p-3 shadow-sm border border-[#e2e8f0]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-[#1e293b] text-sm">{item.titulo}</p>
                            {item.fonte && (
                              <Badge variant="info" size="sm">
                                {item.fonte}
                              </Badge>
                            )}
                          </div>
                          <p className="text-[#64748b] text-sm break-words">{item.conteudo}</p>
                          {item.observacoes && (
                            <p className="text-xs text-[#94a3b8] mt-1 italic">{item.observacoes}</p>
                          )}
                          {item.data_encontrado && (
                            <p className="text-xs text-[#94a3b8] mt-1">
                              Encontrado em: {new Date(item.data_encontrado).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openModal(item)}
                            className="!px-2 !py-1 text-xs"
                          >
                            Editar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDelete(item.id!)}
                            className="!px-2 !py-1 text-xs"
                          >
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingItem ? 'Editar Informação' : 'Adicionar Informação Encontrada'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              Tipo de Informação<span className="text-[#ef4444]">*</span>
            </label>
            <select
              className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0369a1] bg-white text-[#1e293b]"
              value={form.tipo}
              onChange={e => setForm({ ...form, tipo: e.target.value })}
              required
            >
              <option value="">Selecione o tipo...</option>
              {TIPOS.map(tipo => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Título"
            placeholder="Ex: Telefone Celular do Sócio, Email Financeiro..."
            value={form.titulo}
            onChange={e => setForm({ ...form, titulo: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              Conteúdo<span className="text-[#ef4444]">*</span>
            </label>
            <textarea
              className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0369a1] bg-white text-[#1e293b] min-h-[80px]"
              placeholder="Digite a informação encontrada..."
              value={form.conteudo}
              onChange={e => setForm({ ...form, conteudo: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              Fonte
            </label>
            <select
              className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0369a1] bg-white text-[#1e293b]"
              value={form.fonte}
              onChange={e => setForm({ ...form, fonte: e.target.value })}
            >
              <option value="">Selecione a fonte...</option>
              {FONTES.map(fonte => (
                <option key={fonte} value={fonte}>
                  {fonte}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              Observações
            </label>
            <textarea
              className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0369a1] bg-white text-[#1e293b] min-h-[60px]"
              placeholder="Notas adicionais (opcional)..."
              value={form.observacoes}
              onChange={e => setForm({ ...form, observacoes: e.target.value })}
            />
          </div>

          <Input
            label="Data Encontrado"
            type="date"
            value={form.data_encontrado}
            onChange={e => setForm({ ...form, data_encontrado: e.target.value })}
          />

          <div className="flex gap-3 pt-4 border-t border-[#e2e8f0]">
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
