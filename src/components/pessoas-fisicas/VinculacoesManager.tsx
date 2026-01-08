'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/ToastContainer';
import { formatCpfCnpj } from '@/lib/format';

type VinculacaoCedente = {
  id?: string;
  pessoa_id: string;
  cedente_id: string;
  tipo_relacionamento?: string;
  cargo?: string;
  data_inicio?: string;
  data_fim?: string;
  observacoes?: string;
  cedente_nome?: string;
};

type VinculacaoSacado = {
  id?: string;
  pessoa_id: string;
  sacado_cnpj: string;
  tipo_relacionamento?: string;
  cargo?: string;
  data_inicio?: string;
  data_fim?: string;
  observacoes?: string;
  sacado_nome?: string;
};

type VinculacoesManagerProps = {
  pessoaId: string;
  tipo: 'cedentes' | 'sacados';
  items: (VinculacaoCedente | VinculacaoSacado)[];
  onRefresh: () => void;
  cedentesList?: Array<{ id: string; nome?: string; razao_social?: string }>;
  sacadosList?: Array<{ cnpj: string; razao_social?: string; nome_fantasia?: string }>;
};

export default function VinculacoesManager({
  pessoaId,
  tipo,
  items,
  onRefresh,
  cedentesList = [],
  sacadosList = []
}: VinculacoesManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({});
  const { showToast } = useToast();

  const tableName = tipo === 'cedentes' 
    ? 'pessoas_fisicas_cedentes' 
    : 'pessoas_fisicas_sacados';

  const resetForm = () => {
    setForm({
      [tipo === 'cedentes' ? 'cedente_id' : 'sacado_cnpj']: '',
      tipo_relacionamento: '',
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

  const handleEdit = (item: any) => {
    setForm({
      [tipo === 'cedentes' ? 'cedente_id' : 'sacado_cnpj']: tipo === 'cedentes' ? item.cedente_id : item.sacado_cnpj,
      tipo_relacionamento: item.tipo_relacionamento || '',
      cargo: item.cargo || '',
      data_inicio: item.data_inicio || '',
      data_fim: item.data_fim || '',
      observacoes: item.observacoes || ''
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    const campoId = tipo === 'cedentes' ? 'cedente_id' : 'sacado_cnpj';
    if (!form[campoId]) {
      showToast('Selecione um ' + (tipo === 'cedentes' ? 'cedente' : 'sacado'), 'warning');
      return;
    }

    setLoading(true);
    try {
      const entityId = form[campoId].split('|')[0]; // Pega apenas o ID/CNPJ
      const data: any = {
        pessoa_id: pessoaId,
        [campoId]: entityId,
        tipo_relacionamento: form.tipo_relacionamento || null,
        cargo: form.cargo || null,
        data_inicio: form.data_inicio || null,
        data_fim: form.data_fim || null,
        observacoes: form.observacoes || null,
        origem: 'manual',
        ativo: true
      };

      // Buscar dados da pessoa física para sincronizar com QSA
      const { data: pessoaData } = await supabase
        .from('pessoas_fisicas')
        .select('cpf, nome')
        .eq('id', pessoaId)
        .single();

      if (editingId) {
        const { error } = await supabase
          .from(tableName)
          .update(data)
          .eq('id', editingId);
        if (error) throw error;
        
        // Sincronizar com QSA se for sócio/administrador
        if (tipo === 'cedentes' && pessoaData && (form.tipo_relacionamento === 'socio' || form.tipo_relacionamento === 'administrador')) {
          await sincronizarQSA('cedentes_qsa', entityId, pessoaData.cpf, pessoaData.nome, form.cargo || form.tipo_relacionamento, form.data_inicio);
        }
        
        showToast('Vinculação atualizada com sucesso!', 'success');
      } else {
        const { error } = await supabase
          .from(tableName)
          .insert(data);
        if (error) throw error;
        
        // Sincronizar com QSA se for sócio/administrador
        if (tipo === 'cedentes' && pessoaData && (form.tipo_relacionamento === 'socio' || form.tipo_relacionamento === 'administrador')) {
          await sincronizarQSA('cedentes_qsa', entityId, pessoaData.cpf, pessoaData.nome, form.cargo || form.tipo_relacionamento, form.data_inicio);
        } else if (tipo === 'sacados' && pessoaData && (form.tipo_relacionamento === 'socio' || form.tipo_relacionamento === 'administrador')) {
          await sincronizarQSA('sacados_qsa', entityId, pessoaData.cpf, pessoaData.nome, form.cargo || form.tipo_relacionamento, form.data_inicio);
        }
        
        showToast('Vinculação adicionada com sucesso!', 'success');
      }

      setShowForm(false);
      resetForm();
      setEditingId(null);
      onRefresh();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      showToast(error.message || 'Erro ao salvar vinculação', 'error');
    } finally {
      setLoading(false);
    }
  };

  async function sincronizarQSA(
    qsaTable: string,
    entityId: string,
    cpf: string,
    nome: string,
    qualificacao: string | null,
    dataEntrada: string | null
  ) {
    try {
      // Verificar se já existe no QSA
      const campoId = qsaTable === 'cedentes_qsa' ? 'cedente_id' : 'sacado_cnpj';
      const { data: existing } = await supabase
        .from(qsaTable)
        .select('id')
        .eq(campoId, entityId)
        .eq('cpf', cpf.replace(/\D+/g, ''))
        .eq('ativo', true)
        .single();

      if (!existing) {
        // Adicionar ao QSA
        await supabase
          .from(qsaTable)
          .insert({
            [campoId]: entityId,
            cpf: cpf.replace(/\D+/g, ''),
            nome: nome,
            qualificacao: qualificacao || null,
            data_entrada: dataEntrada || null,
            origem: 'pessoa_fisica',
            ativo: true
          });
      }
    } catch (error) {
      // Ignora erros de sincronização (pode não ter QSA configurado ainda)
      console.log('QSA não sincronizado:', error);
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta vinculação?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      if (error) throw error;
      showToast('Vinculação removida com sucesso!', 'success');
      onRefresh();
    } catch (error: any) {
      console.error('Erro ao remover:', error);
      showToast('Erro ao remover vinculação', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getNome = (item: any) => {
    if (tipo === 'cedentes') {
      return item.cedente_nome || cedentesList.find(c => c.id === item.cedente_id)?.nome || item.cedente_id;
    } else {
      return item.sacado_nome || sacadosList.find(s => s.cnpj === item.sacado_cnpj)?.razao_social || formatCpfCnpj(item.sacado_cnpj);
    }
  };

  const options = tipo === 'cedentes'
    ? cedentesList.map(c => `${c.id}|${c.nome || c.razao_social}`)
    : sacadosList.map(s => `${s.cnpj}|${s.razao_social || s.nome_fantasia}`);

  return (
    <div className="bg-white border border-gray-300">
      <div className="border-b border-gray-300 bg-gray-100 px-4 py-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 uppercase">
          {tipo === 'cedentes' ? 'Cedentes Vinculados' : 'Sacados Vinculados'}
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
            {editingId ? 'Editar' : 'Nova'} Vinculação
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {tipo === 'cedentes' ? 'Cedente' : 'Sacado'} *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 text-sm bg-white"
                value={form[tipo === 'cedentes' ? 'cedente_id' : 'sacado_cnpj'] || ''}
                onChange={(e) => setForm({ ...form, [tipo === 'cedentes' ? 'cedente_id' : 'sacado_cnpj']: e.target.value })}
              >
                <option value="">Selecione...</option>
                {options.map(opt => (
                  <option key={opt} value={opt}>{opt.split('|')[1]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tipo de Relacionamento *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 text-sm bg-white"
                value={form.tipo_relacionamento || ''}
                onChange={(e) => setForm({ ...form, tipo_relacionamento: e.target.value })}
              >
                <option value="">Selecione...</option>
                <option value="socio">Sócio</option>
                <option value="administrador">Administrador</option>
                <option value="funcionario">Funcionário</option>
                <option value="contato">Contato</option>
                <option value="representante">Representante</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Cargo</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 text-sm bg-white"
                placeholder="Cargo/função"
                value={form.cargo || ''}
                onChange={(e) => setForm({ ...form, cargo: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Data Início</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 text-sm bg-white"
                value={form.data_inicio || ''}
                onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Data Fim</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 text-sm bg-white"
                value={form.data_fim || ''}
                onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 text-sm bg-white"
                rows={2}
                value={form.observacoes || ''}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              />
            </div>
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
            Nenhuma vinculação cadastrada
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item: any) => (
              <div
                key={item.id}
                className="flex items-start justify-between p-3 border border-gray-200 rounded hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{getNome(item)}</span>
                    {item.tipo_relacionamento && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        {item.tipo_relacionamento}
                      </span>
                    )}
                  </div>
                  {item.cargo && (
                    <p className="text-xs text-gray-600">Cargo: {item.cargo}</p>
                  )}
                  {(item.data_inicio || item.data_fim) && (
                    <p className="text-xs text-gray-600">
                      {item.data_inicio && `Início: ${new Date(item.data_inicio).toLocaleDateString('pt-BR')}`}
                      {item.data_inicio && item.data_fim && ' | '}
                      {item.data_fim && `Fim: ${new Date(item.data_fim).toLocaleDateString('pt-BR')}`}
                    </p>
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

