'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj } from '@/lib/format';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/ToastContainer';

type Empresa = {
  cnpj: string;
  razao_social: string;
  tipo: 'sacado' | 'cedente';
};

export default function NewEmpresaGrupoPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    nome_grupo: '',
    cnpj_matriz: '',
    tipo_entidade: 'sacado' as 'sacado' | 'cedente',
  });
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    loadEmpresas();
  }, [form.tipo_entidade]);

  async function loadEmpresas() {
    setLoadingEmpresas(true);
    try {
      const tableName = form.tipo_entidade === 'sacado' ? 'sacados' : 'cedentes';
      const { data, error } = await supabase
        .from(tableName)
        .select('cnpj, razao_social')
        .not('cnpj', 'is', null)
        .order('razao_social', { ascending: true });
      
      if (error) {
        console.error('Erro ao carregar empresas:', error);
        setEmpresas([]);
      } else {
        setEmpresas((data || []).map(e => ({
          cnpj: e.cnpj,
          razao_social: e.razao_social || 'Sem razão social',
          tipo: form.tipo_entidade
        })));
      }
    } catch (error) {
      console.error('Erro:', error);
      setEmpresas([]);
    } finally {
      setLoadingEmpresas(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
    if (!form.nome_grupo.trim()) {
      setErr('Nome do grupo é obrigatório');
      return;
    }
    
    if (!form.cnpj_matriz) {
      setErr('Selecione o CNPJ matriz');
      return;
    }
    
    setPending(true);
    setErr(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setErr('Não autenticado');
      setPending(false);
      return;
    }

    const cnpjLimpo = form.cnpj_matriz.replace(/\D+/g, '');

    // Cria o grupo
    const { data: grupo, error: grupoError } = await supabase
      .from('empresas_grupo')
      .insert({
        nome_grupo: form.nome_grupo.trim(),
        cnpj_matriz: cnpjLimpo,
        user_id: user.id
      })
      .select()
      .single();

    if (grupoError) {
      setErr(grupoError.message);
      setPending(false);
      return;
    }

    // Vincula o CNPJ matriz ao grupo
    const { error: cnpjError } = await supabase
      .from('empresas_grupo_cnpjs')
      .insert({
        grupo_id: grupo.id,
        cnpj: cnpjLimpo,
        tipo_entidade: form.tipo_entidade,
        tipo_unidade: 'matriz',
        ordem: 0,
        ativo: true
      });

    if (cnpjError) {
      // Se falhar ao vincular, remove o grupo criado
      await supabase.from('empresas_grupo').delete().eq('id', grupo.id);
      setErr(cnpjError.message);
      setPending(false);
      return;
    }

    // Atualiza o campo grupo_empresa_id na tabela de origem
    const tableName = form.tipo_entidade === 'sacado' ? 'sacados' : 'cedentes';
    await supabase
      .from(tableName)
      .update({ grupo_empresa_id: grupo.id })
      .eq('cnpj', cnpjLimpo);

    showToast('Grupo criado com sucesso!', 'success');
    router.replace(`/empresas-grupo/${grupo.id}/editar`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-[#0369a1] mb-2">Novo Grupo de Empresas</h1>
                <p className="text-[#64748b]">Crie um grupo para vincular múltiplos CNPJs da mesma empresa</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => router.back()}
              >
                Voltar
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1">
                  Nome do Grupo *
                </label>
                <Input
                  value={form.nome_grupo}
                  onChange={(e) => setForm({ ...form, nome_grupo: e.target.value })}
                  placeholder="Ex: Paradox Jeans"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1">
                  Tipo de Entidade *
                </label>
                <select
                  className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0369a1] bg-white text-[#1e293b]"
                  value={form.tipo_entidade}
                  onChange={(e) => setForm({ ...form, tipo_entidade: e.target.value as 'sacado' | 'cedente' })}
                  required
                >
                  <option value="sacado">Sacado</option>
                  <option value="cedente">Cedente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1">
                  CNPJ Matriz *
                </label>
                {loadingEmpresas ? (
                  <p className="text-sm text-[#64748b]">Carregando empresas...</p>
                ) : empresas.length === 0 ? (
                  <p className="text-sm text-[#64748b]">
                    Nenhuma empresa encontrada. Cadastre empresas primeiro.
                  </p>
                ) : (
                  <select
                    className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0369a1] bg-white text-[#1e293b]"
                    value={form.cnpj_matriz}
                    onChange={(e) => setForm({ ...form, cnpj_matriz: e.target.value })}
                    required
                  >
                    <option value="">Selecione o CNPJ matriz...</option>
                    {empresas.map(emp => (
                      <option key={`${emp.tipo}-${emp.cnpj}`} value={emp.cnpj}>
                        {emp.razao_social} - {formatCpfCnpj(emp.cnpj)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {err && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">{err}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={pending || empresas.length === 0}
                  className="flex-1"
                >
                  {pending ? 'Criando...' : 'Criar Grupo'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </main>
  );
}

