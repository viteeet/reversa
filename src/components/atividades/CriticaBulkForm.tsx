'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/ui/ToastContainer';

type CriticaBulkFormProps = {
  titulosIds: string[];
  onSuccess: () => void;
};

type Critica = {
  id: string;
  nome: string;
};

export default function CriticaBulkForm({ titulosIds, onSuccess }: CriticaBulkFormProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [criticas, setCriticas] = useState<Critica[]>([]);
  const [criticaSelecionada, setCriticaSelecionada] = useState<string>('');

  useEffect(() => {
    loadCriticas();
  }, []);

  async function loadCriticas() {
    try {
      const { data, error } = await supabase
        .from('criticas_titulos')
        .select('id, nome')
        .eq('ativo', true)
        .order('ordem', { ascending: true });
      
      if (error) throw error;
      setCriticas(data || []);
    } catch (error) {
      console.error('Erro ao carregar críticas:', error);
    }
  }

  async function salvarCriticaBulk() {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('titulos_negociados')
        .update({ critica: criticaSelecionada || null })
        .in('id', titulosIds);

      if (error) throw error;

      showToast(`${titulosIds.length} crítica(s) atualizada(s) com sucesso`, 'success');
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar crítica em massa:', error);
      showToast('Erro ao salvar crítica em massa', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
        <p className="text-sm text-gray-700">
          <strong>{titulosIds.length} título(s)</strong> selecionado(s) para crítica em massa
        </p>
      </div>

      <Select
        label="Crítica"
        value={criticaSelecionada}
        onChange={(e) => setCriticaSelecionada(e.target.value)}
        options={[
          { value: '', label: 'Sem crítica' },
          ...criticas.map(c => ({ value: c.nome, label: c.nome }))
        ]}
        required
      />

      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button
          variant="secondary"
          onClick={() => onSuccess()}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          variant="warning"
          onClick={salvarCriticaBulk}
          disabled={loading}
          className="!text-white"
        >
          {loading ? 'Salvando...' : `Aplicar em ${titulosIds.length} título(s)`}
        </Button>
      </div>
    </div>
  );
}

