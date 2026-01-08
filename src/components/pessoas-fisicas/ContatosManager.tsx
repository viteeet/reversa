'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/ToastContainer';
import Badge from '@/components/ui/Badge';

type Endereco = {
  id?: string;
  pessoa_id: string;
  endereco: string;
  tipo?: string;
  cep?: string;
  cidade?: string;
  estado?: string;
  principal?: boolean;
};

type Telefone = {
  id?: string;
  pessoa_id: string;
  telefone: string;
  tipo?: string;
  nome_contato?: string;
  principal?: boolean;
};

type Email = {
  id?: string;
  pessoa_id: string;
  email: string;
  tipo?: string;
  nome_contato?: string;
  principal?: boolean;
};

type ContatosManagerProps = {
  pessoaId: string;
  tipo: 'enderecos' | 'telefones' | 'emails';
  items: (Endereco | Telefone | Email)[];
  onRefresh: () => void;
};

export default function ContatosManager({
  pessoaId,
  tipo,
  items,
  onRefresh
}: ContatosManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({});
  const { showToast } = useToast();

  const tableName = 
    tipo === 'enderecos' ? 'pessoas_fisicas_enderecos' :
    tipo === 'telefones' ? 'pessoas_fisicas_telefones' :
    'pessoas_fisicas_emails';

  const resetForm = () => {
    if (tipo === 'enderecos') {
      setForm({
        endereco: '',
        tipo: '',
        cep: '',
        cidade: '',
        estado: '',
        principal: false
      });
    } else if (tipo === 'telefones') {
      setForm({
        telefone: '',
        tipo: '',
        nome_contato: '',
        principal: false
      });
    } else {
      setForm({
        email: '',
        tipo: '',
        nome_contato: '',
        principal: false
      });
    }
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
    setEditingId(null);
  };

  const handleEdit = (item: any) => {
    setForm({
      ...item,
      principal: item.principal || false
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    const campoPrincipal = tipo === 'enderecos' ? 'endereco' : tipo === 'telefones' ? 'telefone' : 'email';
    
    if (!form[campoPrincipal]?.trim()) {
      showToast(`${tipo === 'enderecos' ? 'Endereço' : tipo === 'telefones' ? 'Telefone' : 'Email'} é obrigatório`, 'warning');
      return;
    }

    // Validação de email
    if (tipo === 'emails') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        showToast('Email inválido', 'warning');
        return;
      }
    }

    setLoading(true);
    try {
      const data: any = {
        pessoa_id: pessoaId,
        origem: 'manual',
        ativo: true
      };

      if (tipo === 'enderecos') {
        data.endereco = form.endereco.trim();
        data.tipo = form.tipo || null;
        data.cep = form.cep?.trim() || null;
        data.cidade = form.cidade?.trim() || null;
        data.estado = form.estado?.trim() || null;
        data.principal = form.principal || false;
      } else if (tipo === 'telefones') {
        data.telefone = form.telefone.trim();
        data.tipo = form.tipo || null;
        data.nome_contato = form.nome_contato?.trim() || null;
        data.principal = form.principal || false;
      } else {
        data.email = form.email.trim().toLowerCase();
        data.tipo = form.tipo || null;
        data.nome_contato = form.nome_contato?.trim() || null;
        data.principal = form.principal || false;
      }

      // Se marcar como principal, desmarcar outros
      if (data.principal) {
        const { data: existingItems } = await supabase
          .from(tableName)
          .select('id')
          .eq('pessoa_id', pessoaId)
          .eq('principal', true)
          .eq('ativo', true);
        
        if (existingItems && existingItems.length > 0) {
          await supabase
            .from(tableName)
            .update({ principal: false })
            .in('id', existingItems.map((item: any) => item.id));
        }
      }

      if (editingId) {
        const { error } = await supabase
          .from(tableName)
          .update(data)
          .eq('id', editingId);
        if (error) throw error;
        showToast(`${tipo === 'enderecos' ? 'Endereço' : tipo === 'telefones' ? 'Telefone' : 'Email'} atualizado com sucesso!`, 'success');
      } else {
        const { error } = await supabase
          .from(tableName)
          .insert(data);
        if (error) throw error;
        showToast(`${tipo === 'enderecos' ? 'Endereço' : tipo === 'telefones' ? 'Telefone' : 'Email'} adicionado com sucesso!`, 'success');
      }

      setShowForm(false);
      resetForm();
      setEditingId(null);
      onRefresh();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      showToast(error.message || `Erro ao salvar ${tipo}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Tem certeza que deseja remover este ${tipo === 'enderecos' ? 'endereço' : tipo === 'telefones' ? 'telefone' : 'email'}?`)) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      if (error) throw error;
      showToast(`${tipo === 'enderecos' ? 'Endereço' : tipo === 'telefones' ? 'Telefone' : 'Email'} removido com sucesso!`, 'success');
      onRefresh();
    } catch (error: any) {
      console.error('Erro ao remover:', error);
      showToast(`Erro ao remover ${tipo}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getLabel = () => {
    if (tipo === 'enderecos') return 'Endereços';
    if (tipo === 'telefones') return 'Telefones';
    return 'Emails';
  };

  return (
    <div className="bg-white border border-gray-300">
      <div className="border-b border-gray-300 bg-gray-100 px-4 py-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 uppercase">
          {getLabel()}
        </h2>
        {!showForm && (
          <Button variant="primary" size="sm" onClick={handleAddNew}>
            + Adicionar
          </Button>
        )}
      </div>

      {showForm && (
        <div className="p-4 bg-blue-50 border-b border-gray-300">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            {editingId ? 'Editar' : 'Novo'} {tipo === 'enderecos' ? 'Endereço' : tipo === 'telefones' ? 'Telefone' : 'Email'}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {tipo === 'enderecos' ? (
              <>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Endereço *
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 text-sm bg-white"
                    rows={2}
                    placeholder="Rua, número, complemento..."
                    value={form.endereco || ''}
                    onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 text-sm bg-white"
                    value={form.tipo || ''}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    <option value="residencial">Residencial</option>
                    <option value="comercial">Comercial</option>
                    <option value="correspondencia">Correspondência</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    CEP
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 text-sm bg-white"
                    placeholder="00000-000"
                    value={form.cep || ''}
                    onChange={(e) => setForm({ ...form, cep: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 text-sm bg-white"
                    placeholder="Cidade"
                    value={form.cidade || ''}
                    onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 text-sm bg-white"
                    placeholder="UF"
                    maxLength={2}
                    value={form.estado || ''}
                    onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.principal || false}
                      onChange={(e) => setForm({ ...form, principal: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-xs font-medium text-gray-700">Endereço principal</span>
                  </label>
                </div>
              </>
            ) : tipo === 'telefones' ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Telefone *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 text-sm bg-white"
                    placeholder="(00) 00000-0000"
                    value={form.telefone || ''}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 text-sm bg-white"
                    value={form.tipo || ''}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    <option value="celular">Celular</option>
                    <option value="fixo">Fixo</option>
                    <option value="comercial">Comercial</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nome do Contato
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 text-sm bg-white"
                    placeholder="Nome da pessoa que atende este telefone"
                    value={form.nome_contato || ''}
                    onChange={(e) => setForm({ ...form, nome_contato: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.principal || false}
                      onChange={(e) => setForm({ ...form, principal: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-xs font-medium text-gray-700">Telefone principal</span>
                  </label>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 text-sm bg-white"
                    placeholder="email@exemplo.com"
                    value={form.email || ''}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 text-sm bg-white"
                    value={form.tipo || ''}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    <option value="pessoal">Pessoal</option>
                    <option value="comercial">Comercial</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nome do Contato
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 text-sm bg-white"
                    placeholder="Nome da pessoa que usa este email"
                    value={form.nome_contato || ''}
                    onChange={(e) => setForm({ ...form, nome_contato: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.principal || false}
                      onChange={(e) => setForm({ ...form, principal: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-xs font-medium text-gray-700">Email principal</span>
                  </label>
                </div>
              </>
            )}
          </div>
          <div className="flex gap-2 justify-end mt-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowForm(false);
                resetForm();
                setEditingId(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      )}

      <div className="p-4">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            Nenhum {tipo === 'enderecos' ? 'endereço' : tipo === 'telefones' ? 'telefone' : 'email'} cadastrado
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item: any) => (
              <div
                key={item.id}
                className="flex items-start justify-between p-3 border border-gray-200 rounded hover:bg-gray-50"
              >
                <div className="flex-1">
                  {tipo === 'enderecos' ? (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">{item.endereco}</span>
                        {item.principal && (
                          <Badge variant="success" size="sm">Principal</Badge>
                        )}
                        {item.tipo && (
                          <Badge variant="info" size="sm">{item.tipo}</Badge>
                        )}
                      </div>
                      {(item.cep || item.cidade || item.estado) && (
                        <p className="text-xs text-gray-600">
                          {[item.cep, item.cidade, item.estado].filter(Boolean).join(' - ')}
                        </p>
                      )}
                    </div>
                  ) : tipo === 'telefones' ? (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">{item.telefone}</span>
                        {item.principal && (
                          <Badge variant="success" size="sm">Principal</Badge>
                        )}
                        {item.tipo && (
                          <Badge variant="info" size="sm">{item.tipo}</Badge>
                        )}
                      </div>
                      {item.nome_contato && (
                        <p className="text-xs text-gray-600">Contato: {item.nome_contato}</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">{item.email}</span>
                        {item.principal && (
                          <Badge variant="success" size="sm">Principal</Badge>
                        )}
                        {item.tipo && (
                          <Badge variant="info" size="sm">{item.tipo}</Badge>
                        )}
                      </div>
                      {item.nome_contato && (
                        <p className="text-xs text-gray-600">Contato: {item.nome_contato}</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(item)}
                    className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                    disabled={loading}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                    disabled={loading}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

