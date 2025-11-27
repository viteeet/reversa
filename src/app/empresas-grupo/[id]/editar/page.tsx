'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj } from '@/lib/format';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/ToastContainer';

type EmpresaGrupo = {
  id: string;
  nome_grupo: string;
  cnpj_matriz: string;
  observacoes: string | null;
};

type CNPJVinculado = {
  id: string;
  cnpj: string;
  tipo_entidade: string;
  tipo_unidade: string;
  ordem: number;
  observacoes: string | null;
  empresa?: {
    razao_social: string;
    nome_fantasia: string | null;
  };
};

type EmpresaDisponivel = {
  cnpj: string;
  razao_social: string;
  tipo: 'sacado' | 'cedente';
};

export default function EditarEmpresaGrupoPage() {
  const router = useRouter();
  const params = useParams();
  const grupoId = params.id as string;
  const { showToast } = useToast();
  
  const [grupo, setGrupo] = useState<EmpresaGrupo | null>(null);
  const [cnpjs, setCnpjs] = useState<CNPJVinculado[]>([]);
  const [empresasDisponiveis, setEmpresasDisponiveis] = useState<EmpresaDisponivel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formAdd, setFormAdd] = useState({
    cnpj: '',
    tipo_entidade: 'sacado' as 'sacado' | 'cedente',
    tipo_unidade: 'filial',
  });

  useEffect(() => {
    loadData();
  }, [grupoId]);

  async function loadData() {
    setLoading(true);
    
    // Carrega o grupo
    const { data: grupoData } = await supabase
      .from('empresas_grupo')
      .select('*')
      .eq('id', grupoId)
      .single();
    
    setGrupo(grupoData);
    
    // Carrega CNPJs vinculados
    const { data: cnpjsData } = await supabase
      .from('empresas_grupo_cnpjs')
      .select('*')
      .eq('grupo_id', grupoId)
      .eq('ativo', true)
      .order('ordem', { ascending: true });
    
    // Para cada CNPJ, busca informações da empresa
    if (cnpjsData) {
      const cnpjsComInfo = await Promise.all(
        cnpjsData.map(async (cnpjItem) => {
          const tableName = cnpjItem.tipo_entidade === 'sacado' ? 'sacados' : 'cedentes';
          const { data: empresaData } = await supabase
            .from(tableName)
            .select('razao_social, nome_fantasia')
            .eq('cnpj', cnpjItem.cnpj)
            .single();
          
          return {
            ...cnpjItem,
            empresa: empresaData || undefined
          };
        })
      );
      
      setCnpjs(cnpjsComInfo);
    }
    
    await loadEmpresasDisponiveis();
    setLoading(false);
  }

  async function loadEmpresasDisponiveis() {
    // Carrega sacados e cedentes que não estão em nenhum grupo
    const [sacadosResult, cedentesResult] = await Promise.all([
      supabase.from('sacados').select('cnpj, razao_social').not('cnpj', 'is', null),
      supabase.from('cedentes').select('cnpj, razao_social, nome').not('cnpj', 'is', null)
    ]);

    const todosCnpjs = [
      ...(sacadosResult.data || []).map(s => ({ cnpj: s.cnpj, razao_social: s.razao_social || '', tipo: 'sacado' as const })),
      ...(cedentesResult.data || []).map(c => ({ cnpj: c.cnpj, razao_social: c.razao_social || c.nome || '', tipo: 'cedente' as const }))
    ];

    // Remove CNPJs já vinculados a este grupo
    const cnpjsVinculados = cnpjs.map(c => c.cnpj);
    const disponiveis = todosCnpjs.filter(e => !cnpjsVinculados.includes(e.cnpj));
    
    setEmpresasDisponiveis(disponiveis);
  }

  async function saveGrupo() {
    if (!grupo || !grupo.nome_grupo.trim()) {
      showToast('Nome do grupo é obrigatório', 'error');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('empresas_grupo')
        .update({
          nome_grupo: grupo.nome_grupo.trim(),
          observacoes: grupo.observacoes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', grupoId);
      
      if (error) throw error;
      
      showToast('Grupo salvo com sucesso!', 'success');
    } catch (error: any) {
      console.error('Erro ao salvar grupo:', error);
      showToast('Erro ao salvar grupo', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function adicionarCNPJ() {
    if (!formAdd.cnpj) {
      showToast('Selecione um CNPJ', 'error');
      return;
    }

    const cnpjLimpo = formAdd.cnpj.replace(/\D+/g, '');
    
    // Verifica se já está vinculado
    const jaVinculado = cnpjs.some(c => c.cnpj === cnpjLimpo);
    if (jaVinculado) {
      showToast('Este CNPJ já está vinculado ao grupo', 'warning');
      return;
    }

    try {
      const { error } = await supabase
        .from('empresas_grupo_cnpjs')
        .insert({
          grupo_id: grupoId,
          cnpj: cnpjLimpo,
          tipo_entidade: formAdd.tipo_entidade,
          tipo_unidade: formAdd.tipo_unidade,
          ordem: cnpjs.length,
          ativo: true
        });

      if (error) throw error;

      // Atualiza o campo grupo_empresa_id na tabela de origem
      const tableName = formAdd.tipo_entidade === 'sacado' ? 'sacados' : 'cedentes';
      await supabase
        .from(tableName)
        .update({ grupo_empresa_id: grupoId })
        .eq('cnpj', cnpjLimpo);

      showToast('CNPJ adicionado ao grupo!', 'success');
      setFormAdd({ cnpj: '', tipo_entidade: 'sacado', tipo_unidade: 'filial' });
      setShowAddForm(false);
      await loadData();
    } catch (error: any) {
      console.error('Erro ao adicionar CNPJ:', error);
      showToast('Erro ao adicionar CNPJ', 'error');
    }
  }

  async function removerCNPJ(cnpjItemId: string, cnpj: string, tipoEntidade: string) {
    if (!confirm('Tem certeza que deseja remover este CNPJ do grupo?')) return;

    try {
      // Remove o vínculo
      const { error } = await supabase
        .from('empresas_grupo_cnpjs')
        .update({ ativo: false })
        .eq('id', cnpjItemId);

      if (error) throw error;

      // Remove o campo grupo_empresa_id na tabela de origem
      const tableName = tipoEntidade === 'sacado' ? 'sacados' : 'cedentes';
      await supabase
        .from(tableName)
        .update({ grupo_empresa_id: null })
        .eq('cnpj', cnpj);

      showToast('CNPJ removido do grupo!', 'success');
      await loadData();
    } catch (error: any) {
      console.error('Erro ao remover CNPJ:', error);
      showToast('Erro ao remover CNPJ', 'error');
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0369a1]"></div>
            <p className="mt-2 text-[#64748b]">Carregando...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!grupo) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <Card>
            <div className="p-6 text-center">
              <p className="text-[#64748b] mb-4">Grupo não encontrado</p>
              <Button variant="primary" onClick={() => router.push('/empresas-grupo')}>
                Voltar
              </Button>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  const empresasFiltradas = empresasDisponiveis.filter(e => e.tipo === formAdd.tipo_entidade);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <Card>
          <div className="p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-[#0369a1] mb-2">Editar Grupo</h1>
                <p className="text-[#64748b]">CNPJ Matriz: {formatCpfCnpj(grupo.cnpj_matriz)}</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => router.push(`/empresas-grupo/${grupoId}`)}
              >
                Voltar
              </Button>
            </div>

            {/* Formulário de Edição do Grupo */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1">
                  Nome do Grupo *
                </label>
                <Input
                  value={grupo.nome_grupo}
                  onChange={(e) => setGrupo({ ...grupo, nome_grupo: e.target.value })}
                  placeholder="Nome do grupo"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1">
                  Observações
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0369a1] min-h-[100px] resize-y"
                  value={grupo.observacoes || ''}
                  onChange={(e) => setGrupo({ ...grupo, observacoes: e.target.value })}
                  placeholder="Observações sobre o grupo..."
                />
              </div>

              <Button
                variant="primary"
                onClick={saveGrupo}
                loading={saving}
              >
                Salvar Alterações do Grupo
              </Button>
            </div>

            {/* CNPJs Vinculados */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#0369a1]">
                  CNPJs Vinculados ({cnpjs.length})
                </h2>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(!showAddForm);
                    loadEmpresasDisponiveis();
                  }}
                >
                  {showAddForm ? 'Cancelar' : '+ Adicionar CNPJ'}
                </Button>
              </div>

              {/* Formulário de Adicionar CNPJ */}
              {showAddForm && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-[#1e293b] mb-1">
                        Tipo de Entidade
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0369a1] bg-white"
                        value={formAdd.tipo_entidade}
                        onChange={(e) => {
                          setFormAdd({ ...formAdd, tipo_entidade: e.target.value as 'sacado' | 'cedente', cnpj: '' });
                        }}
                      >
                        <option value="sacado">Sacado</option>
                        <option value="cedente">Cedente</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1e293b] mb-1">
                        CNPJ
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0369a1] bg-white"
                        value={formAdd.cnpj}
                        onChange={(e) => setFormAdd({ ...formAdd, cnpj: e.target.value })}
                      >
                        <option value="">Selecione...</option>
                        {empresasFiltradas.map(emp => (
                          <option key={`${emp.tipo}-${emp.cnpj}`} value={emp.cnpj}>
                            {emp.razao_social} - {formatCpfCnpj(emp.cnpj)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1e293b] mb-1">
                        Tipo de Unidade
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0369a1] bg-white"
                        value={formAdd.tipo_unidade}
                        onChange={(e) => setFormAdd({ ...formAdd, tipo_unidade: e.target.value })}
                      >
                        <option value="matriz">Matriz</option>
                        <option value="filial">Filial</option>
                        <option value="unidade">Unidade</option>
                      </select>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={adicionarCNPJ}
                    disabled={!formAdd.cnpj}
                  >
                    Adicionar ao Grupo
                  </Button>
                </div>
              )}

              {/* Lista de CNPJs */}
              {cnpjs.length === 0 ? (
                <p className="text-[#64748b]">Nenhum CNPJ vinculado ainda.</p>
              ) : (
                <div className="space-y-3">
                  {cnpjs.map((cnpjItem) => (
                    <div
                      key={cnpjItem.id}
                      className="bg-white rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-[#0369a1]">
                              {cnpjItem.empresa?.razao_social || 'Empresa não encontrada'}
                            </span>
                            <Badge variant={cnpjItem.tipo_unidade === 'matriz' ? 'success' : 'info'}>
                              {cnpjItem.tipo_unidade}
                            </Badge>
                            <Badge variant="neutral">
                              {cnpjItem.tipo_entidade}
                            </Badge>
                          </div>
                          <p className="text-sm text-[#64748b] font-mono">
                            CNPJ: {formatCpfCnpj(cnpjItem.cnpj)}
                          </p>
                        </div>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => removerCNPJ(cnpjItem.id, cnpjItem.cnpj, cnpjItem.tipo_entidade)}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}

