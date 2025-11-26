'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj } from '@/lib/format';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

type Sacado = {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  cedente_id: string | null;
};

type Cedente = {
  id: string;
  nome: string;
  razao_social: string | null;
};

export default function VincularSacadosPage() {
  const router = useRouter();
  const [sacados, setSacados] = useState<Sacado[]>([]);
  const [cedentes, setCedentes] = useState<Cedente[]>([]);
  const [loading, setLoading] = useState(true);
  const [vinculando, setVinculando] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    
    // Carrega sacados sem cedente
    const { data: sacadosData } = await supabase
      .from('sacados')
      .select('cnpj, razao_social, nome_fantasia, cedente_id')
      .is('cedente_id', null)
      .order('razao_social');
    
    // Carrega todos os cedentes
    const { data: cedentesData } = await supabase
      .from('cedentes')
      .select('id, nome, razao_social')
      .order('nome');
    
    setSacados(sacadosData || []);
    setCedentes(cedentesData || []);
    setLoading(false);
  }

  async function vincularSacado(cnpj: string, cedenteId: string) {
    if (!cedenteId) {
      alert('Selecione um cedente');
      return;
    }

    setVinculando(cnpj);
    try {
      const { error } = await supabase
        .from('sacados')
        .update({ cedente_id: cedenteId })
        .eq('cnpj', cnpj);

      if (error) {
        console.error('Erro ao vincular:', error);
        alert('Erro ao vincular sacado');
      } else {
        await loadData(); // Recarrega a lista
      }
    } catch (err) {
      console.error('Erro ao vincular:', err);
      alert('Erro ao vincular sacado');
    } finally {
      setVinculando(null);
    }
  }

  async function vincularTodos(cedenteId: string) {
    if (!cedenteId) {
      alert('Selecione um cedente');
      return;
    }

    if (!confirm(`Vincular TODOS os ${sacados.length} sacados ao cedente selecionado?`)) {
      return;
    }

    setVinculando('todos');
    try {
      const { error } = await supabase
        .from('sacados')
        .update({ cedente_id: cedenteId })
        .is('cedente_id', null);

      if (error) {
        console.error('Erro ao vincular todos:', error);
        alert('Erro ao vincular sacados');
      } else {
        alert(`${sacados.length} sacados vinculados com sucesso!`);
        await loadData();
      }
    } catch (err) {
      console.error('Erro ao vincular todos:', err);
      alert('Erro ao vincular sacados');
    } finally {
      setVinculando(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6 bg-white">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0369a1]"></div>
            <p className="mt-2 text-[#64748b]">Carregando...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 bg-white">
      <div className="container max-w-4xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-[#0369a1] mb-2">
            🔗 Vincular Sacados aos Cedentes
          </h1>
          <p className="text-[#64748b]">
            {sacados.length} sacado(s) sem cedente vinculado
          </p>
        </header>

        {sacados.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <p className="text-lg text-green-600 mb-2">✅ Todos os sacados estão vinculados!</p>
              <Button variant="secondary" onClick={() => {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back();
  } else {
    router.push('/menu/operacional');
  }
}}>
                Voltar
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {/* Vincular Todos */}
            <Card>
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">⚡ Vincular Todos</h2>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selecionar Cedente
                    </label>
                    <select
                      id="cedente-todos"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Selecione um cedente...</option>
                      {cedentes.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.nome} {c.razao_social && `(${c.razao_social})`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => {
                      const select = document.getElementById('cedente-todos') as HTMLSelectElement;
                      vincularTodos(select.value);
                    }}
                    disabled={vinculando === 'todos' || cedentes.length === 0}
                  >
                    {vinculando === 'todos' ? 'Vinculando...' : `Vincular Todos (${sacados.length})`}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Lista de Sacados */}
            <Card>
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">📋 Sacados Sem Cedente</h2>
                
                <div className="space-y-3">
                  {sacados.map(sacado => (
                    <div
                      key={sacado.cnpj}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{sacado.razao_social}</div>
                          {sacado.nome_fantasia && (
                            <div className="text-sm text-gray-600">{sacado.nome_fantasia}</div>
                          )}
                          <div className="text-sm text-gray-500 font-mono mt-1">
                            {formatCpfCnpj(sacado.cnpj)}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 items-center">
                          <select
                            id={`cedente-${sacado.cnpj}`}
                            className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            defaultValue=""
                          >
                            <option value="">Selecione...</option>
                            {cedentes.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.nome}
                              </option>
                            ))}
                          </select>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              const select = document.getElementById(`cedente-${sacado.cnpj}`) as HTMLSelectElement;
                              vincularSacado(sacado.cnpj, select.value);
                            }}
                            disabled={vinculando === sacado.cnpj || cedentes.length === 0}
                          >
                            {vinculando === sacado.cnpj ? '...' : 'Vincular'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </>
        )}

        <div className="flex justify-end">
          <Button variant="secondary" onClick={() => {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back();
  } else {
    router.push('/menu/operacional');
  }
}}>
            Voltar
          </Button>
        </div>
      </div>
    </main>
  );
}

