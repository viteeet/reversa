'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/ui/ToastContainer';

type CobrancaBulkFormProps = {
  titulosIds: string[];
  demandas: any[];
  onSuccess: () => void;
};

export default function CobrancaBulkForm({ titulosIds, demandas, onSuccess }: CobrancaBulkFormProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    tipo: 'ligacao' as 'ligacao' | 'email' | 'reuniao' | 'observacao' | 'lembrete' | 'documento' | 'negociacao',
    descricao: '',
    status: 'concluida' as 'pendente' | 'concluida' | 'cancelada',
    proxima_acao: '',
    data_lembrete: '',
    observacoes: ''
  });

  const tiposAtividade = [
    { value: 'ligacao', label: 'Ligação' },
    { value: 'email', label: 'Email' },
    { value: 'reuniao', label: 'Reunião' },
    { value: 'observacao', label: 'Observação' },
    { value: 'lembrete', label: 'Lembrete' },
    { value: 'documento', label: 'Documento' },
    { value: 'negociacao', label: 'Negociação' }
  ];

  async function salvarCobrancaBulk() {
    if (!form.descricao.trim()) {
      showToast('Preencha a descrição', 'error');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast('Usuário não autenticado', 'error');
        return;
      }

      // Salvar apenas a descrição limpa (sem timestamp)
      const atividades = titulosIds.map(tituloId => ({
        titulo_id: tituloId,
        user_id: user.id,
        tipo: form.tipo,
        descricao: form.descricao.trim(), // Descrição limpa, sem timestamp
        status: form.status,
        data_hora: new Date().toISOString(),
        proxima_acao: form.proxima_acao.trim() || null,
        data_lembrete: form.data_lembrete ? new Date(form.data_lembrete).toISOString() : null,
        observacoes: form.observacoes.trim() || null
      }));

      const { error } = await supabase
        .from('titulos_atividades')
        .insert(atividades);

      if (error) throw error;

      showToast(`${titulosIds.length} atividade(s) registrada(s) com sucesso`, 'success');
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar cobrança em massa:', error);
      showToast('Erro ao salvar cobrança em massa', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 p-3 rounded">
        <p className="text-sm text-gray-700">
          <strong>{titulosIds.length} título(s)</strong> selecionado(s) para cobrança em massa
        </p>
      </div>

      <Select
        label="Tipo de Atividade"
        value={form.tipo}
        onChange={(e) => setForm({ ...form, tipo: e.target.value as any })}
        options={tiposAtividade.map(t => ({ value: t.value, label: t.label }))}
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descrição *
        </label>
        <textarea
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Descreva a atividade de cobrança realizada..."
          required
        />
      </div>

      <Select
        label="Status"
        value={form.status}
        onChange={(e) => setForm({ ...form, status: e.target.value as any })}
        options={[
          { value: 'pendente', label: 'Pendente' },
          { value: 'concluida', label: 'Concluída' },
          { value: 'cancelada', label: 'Cancelada' }
        ]}
        required
      />

      <Input
        label="Próxima Ação"
        value={form.proxima_acao}
        onChange={(e) => setForm({ ...form, proxima_acao: e.target.value })}
        placeholder="Ex: Ligar novamente em 3 dias"
      />

      <Input
        label="Data de Lembrete"
        type="datetime-local"
        value={form.data_lembrete}
        onChange={(e) => setForm({ ...form, data_lembrete: e.target.value })}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Observações
        </label>
        <textarea
          value={form.observacoes}
          onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          placeholder="Observações adicionais..."
        />
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button
          variant="secondary"
          onClick={() => onSuccess()}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={salvarCobrancaBulk}
          disabled={loading}
          className="!text-white"
        >
          {loading ? 'Salvando...' : `Salvar em ${titulosIds.length} título(s)`}
        </Button>
      </div>
    </div>
  );
}

