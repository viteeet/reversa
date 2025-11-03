'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj } from '@/lib/format';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import AtividadesManager from '@/components/atividades/AtividadesManager';
import FoundDataManagerGeneric from '@/components/shared/FoundDataManagerGeneric';

type FoundDataItem = {
  id?: string;
  tipo: string;
  titulo: string;
  conteudo: string;
  observacoes?: string;
  fonte?: string;
  data_encontrado?: string;
};

type Cedente = {
  id: string;
  nome: string;
  razao_social: string | null;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  porte: string | null;
  natureza_juridica: string | null;
  situacao: string | null;
  data_abertura: string | null;
  capital_social: number | null;
  atividade_principal_codigo: string | null;
  atividade_principal_descricao: string | null;
  atividades_secundarias: string | null;
  simples_nacional: boolean | null;
  ultima_atualizacao: string | null;
};

type Sacado = {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  situacao: string | null;
  porte: string | null;
  atividade_principal_descricao: string | null;
};

export default function CedentePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [cedente, setCedente] = useState<Cedente | null>(null);
  const [sacados, setSacados] = useState<Sacado[]>([]);
  const [foundData, setFoundData] = useState<FoundDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'sacados' | 'atividades'>('info');
  const [sacadosQuery, setSacadosQuery] = useState('');
  const [showAddSacado, setShowAddSacado] = useState(false);
  const [sacadoForm, setSacadoForm] = useState({ cnpj: '', razao_social: '', nome_fantasia: '' });
  const [loadingSacadoCnpj, setLoadingSacadoCnpj] = useState(false);
  const [savingSacado, setSavingSacado] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    
    // Carrega cedente
    const { data: cedenteData, error: cedenteError } = await supabase
      .from('cedentes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (cedenteError) {
      console.error('Erro ao carregar cedente:', cedenteError);
    } else {
      setCedente(cedenteData);
    }

    // Carrega sacados deste cedente
    await loadSacados();

    // Carrega dados encontrados do cedente
    await loadFoundData();
    
    setLoading(false);
  }

  async function loadSacados() {
    const { data, error } = await supabase
      .from('sacados')
      .select('cnpj, razao_social, nome_fantasia, situacao, porte, atividade_principal_descricao')
      .eq('cedente_id', id)
      .order('razao_social', { ascending: true });
    
    if (error) {
      console.error('Erro ao carregar sacados:', error);
    } else {
      setSacados(data || []);
    }
  }

  async function loadFoundData() {
    const { data, error } = await supabase
      .from('cedentes_dados_encontrados')
      .select('*')
      .eq('cedente_id', id)
      .eq('ativo', true)
      .order('data_encontrado', { ascending: false });
    
    if (error) {
      console.error('Erro ao carregar dados encontrados:', error);
    } else {
      setFoundData(data || []);
    }
  }

  async function consultarCnpjSacado() {
    const raw = sacadoForm.cnpj.replace(/\D+/g, '');
    if (!raw || raw.length !== 14) {
      alert('CNPJ inválido');
      return;
    }

    setLoadingSacadoCnpj(true);
    try {
      const res = await fetch(`/api/cnpjws?cnpj=${raw}`);
      const data = await res.json();
      
      if (!res.ok) {
        alert(data?.error || 'Erro ao consultar CNPJ');
        return;
      }

      const estabelecimento = data?.estabelecimento || {};
      const razao = data?.razao_social || '';
      const fantasia = estabelecimento?.nome_fantasia || '';

      setSacadoForm(f => ({
        ...f,
        razao_social: razao,
        nome_fantasia: fantasia
      }));
    } catch (err) {
      alert('Erro ao consultar CNPJ');
    } finally {
      setLoadingSacadoCnpj(false);
    }
  }

  async function adicionarSacado() {
    const raw = sacadoForm.cnpj.replace(/\D+/g, '');
    if (!raw || !sacadoForm.razao_social.trim()) {
      alert('Preencha CNPJ e Razão Social');
      return;
    }

    setSavingSacado(true);
    try {
      // Verifica se já existe
      const { data: existing } = await supabase
        .from('sacados')
        .select('cnpj')
        .eq('cnpj', raw)
        .single();

      if (existing) {
        alert('Sacado já cadastrado com este CNPJ');
        setSavingSacado(false);
        return;
      }

      // Insere novo sacado
      const { error } = await supabase.from('sacados').insert({
        cnpj: raw,
        cedente_id: id,
        razao_social: sacadoForm.razao_social.trim(),
        nome_fantasia: sacadoForm.nome_fantasia.trim() || null,
      });

      if (error) {
        console.error('Erro ao adicionar sacado:', error);
        alert('Erro ao adicionar sacado');
      } else {
        setSacadoForm({ cnpj: '', razao_social: '', nome_fantasia: '' });
        setShowAddSacado(false);
        await loadSacados();
      }
    } finally {
      setSavingSacado(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6 bg-white">
        <div className="container max-w-6xl">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0369a1]"></div>
            <p className="mt-2 text-[#64748b]">Carregando...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!cedente) {
    return (
      <main className="min-h-screen p-6 bg-white">
        <div className="container max-w-6xl">
          <div className="text-center py-8">
            <p className="text-[#64748b]">Cedente não encontrado</p>
            <Button variant="primary" onClick={() => router.back()} className="mt-4">
              Voltar
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 bg-white">
      <div className="container max-w-6xl space-y-6">
        {/* Header compacto */}
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-[#0369a1]">{cedente.nome}</h1>
            {cedente.razao_social && <p className="text-[#64748b]">{cedente.razao_social}</p>}
            {cedente.cnpj && <p className="text-sm text-[#64748b] font-mono">{formatCpfCnpj(cedente.cnpj)}</p>}
          </div>
          <div className="flex gap-1">
            <button
              className="px-3 py-2 rounded border border-[#cbd5e1] text-sm text-[#0369a1] hover:bg-[#f1f5f9]"
              onClick={() => router.back()}
              aria-label="Voltar"
              title="Voltar"
            >←</button>
            <button
              className="px-3 py-2 rounded border border-[#0369a1] bg-[#0369a1] text-white text-sm hover:opacity-90"
              onClick={() => router.push(`/cedentes/${cedente.id}/editar`)}
              aria-label="Editar"
              title="Editar"
            >✏️</button>
          </div>
        </header>

        {/* Abas */}
        <Card>
          <div className="border-b border-[#cbd5e1]">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('info')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'info'
                    ? 'border-[#0369a1] text-[#0369a1]'
                    : 'border-transparent text-[#64748b] hover:text-[#1e293b] hover:border-[#cbd5e1]'
                }`}
              >
                📋 Informações
              </button>
              <button
                onClick={() => setActiveTab('sacados')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'sacados'
                    ? 'border-[#0369a1] text-[#0369a1]'
                    : 'border-transparent text-[#64748b] hover:text-[#1e293b] hover:border-[#cbd5e1]'
                }`}
              >
                👥 Sacados ({sacados.length})
              </button>
              <button
                onClick={() => setActiveTab('atividades')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'atividades'
                    ? 'border-[#0369a1] text-[#0369a1]'
                    : 'border-transparent text-[#64748b] hover:text-[#1e293b] hover:border-[#cbd5e1]'
                }`}
              >
                📞 Atividades
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'info' ? (
              <div className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Informações Básicas */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-[#0369a1]">Informações Básicas</h2>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-[#64748b]">Nome</label>
                        <p className="text-[#1e293b]">{cedente.nome}</p>
                      </div>
                      {cedente.razao_social && (
                        <div>
                          <label className="text-sm font-medium text-[#64748b]">Razão Social</label>
                          <p className="text-[#1e293b]">{cedente.razao_social}</p>
                        </div>
                      )}
                      {cedente.cnpj && (
                        <div>
                          <label className="text-sm font-medium text-[#64748b]">CNPJ</label>
                          <p className="text-[#1e293b] font-mono">{formatCpfCnpj(cedente.cnpj)}</p>
                        </div>
                      )}
                      {cedente.situacao && (
                        <div>
                          <label className="text-sm font-medium text-[#64748b]">Situação</label>
                          <div className="mt-1">
                            <Badge variant={cedente.situacao === 'ATIVA' ? 'success' : cedente.situacao === 'INATIVA' ? 'error' : 'neutral'} size="sm">
                              {cedente.situacao}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informações de Contato */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-[#0369a1]">Contato</h2>
                    <div className="space-y-3">
                      {cedente.telefone && (
                        <div>
                          <label className="text-sm font-medium text-[#64748b]">Telefone</label>
                          <p className="text-[#1e293b]">{cedente.telefone}</p>
                        </div>
                      )}
                      {cedente.email && (
                        <div>
                          <label className="text-sm font-medium text-[#64748b]">E-mail</label>
                          <p className="text-[#1e293b]">{cedente.email}</p>
                        </div>
                      )}
                      {cedente.endereco && (
                        <div>
                          <label className="text-sm font-medium text-[#64748b]">Endereço</label>
                          <p className="text-[#1e293b]">{cedente.endereco}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informações Empresariais */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-[#0369a1]">Informações Empresariais</h2>
                    <div className="space-y-3">
                      {cedente.porte && (
                        <div>
                          <label className="text-sm font-medium text-[#64748b]">Porte</label>
                          <p className="text-[#1e293b]">{cedente.porte}</p>
                        </div>
                      )}
                      {cedente.natureza_juridica && (
                        <div>
                          <label className="text-sm font-medium text-[#64748b]">Natureza Jurídica</label>
                          <p className="text-[#1e293b]">{cedente.natureza_juridica}</p>
                        </div>
                      )}
                      {cedente.data_abertura && (
                        <div>
                          <label className="text-sm font-medium text-[#64748b]">Data de Abertura</label>
                          <p className="text-[#1e293b]">{new Date(cedente.data_abertura).toLocaleDateString('pt-BR')}</p>
                        </div>
                      )}
                      {cedente.capital_social && (
                        <div>
                          <label className="text-sm font-medium text-[#64748b]">Capital Social</label>
                          <p className="text-[#1e293b]">R$ {cedente.capital_social.toLocaleString('pt-BR')}</p>
                        </div>
                      )}
                      {cedente.simples_nacional !== null && (
                        <div>
                          <label className="text-sm font-medium text-[#64748b]">Simples Nacional</label>
                          <div className="mt-1">
                            <Badge variant={cedente.simples_nacional ? 'success' : 'neutral'} size="sm">
                              {cedente.simples_nacional ? 'Sim' : 'Não'}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Atividades */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-[#0369a1]">Atividades</h2>
                    <div className="space-y-3">
                      {cedente.atividade_principal_codigo && (
                        <div>
                          <label className="text-sm font-medium text-[#64748b]">Código da Atividade Principal</label>
                          <p className="text-[#1e293b] font-mono">{cedente.atividade_principal_codigo}</p>
                        </div>
                      )}
                      {cedente.atividade_principal_descricao && (
                        <div>
                          <label className="text-sm font-medium text-[#64748b]">Atividade Principal</label>
                          <p className="text-[#1e293b]">{cedente.atividade_principal_descricao}</p>
                        </div>
                      )}
                      {cedente.atividades_secundarias && (
                        <div>
                          <label className="text-sm font-medium text-[#64748b]">Atividades Secundárias</label>
                          <p className="text-[#1e293b] text-sm">{cedente.atividades_secundarias}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dados Encontrados */}
                <div className="border-t border-[#e2e8f0] pt-6">
                  <FoundDataManagerGeneric 
                    entityId={id}
                    entityType="cedente"
                    items={foundData}
                    onRefresh={loadFoundData}
                  />
                </div>
              </div>
            ) : activeTab === 'sacados' ? (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-[#0369a1]">Sacados do Cedente</h2>
                    <p className="text-xs text-[#64748b]">Os sacados (devedores) pertencem a este cedente.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      value={sacadosQuery}
                      onChange={(e) => setSacadosQuery(e.target.value)}
                      placeholder="Buscar sacado (nome, CNPJ)"
                      className="px-3 py-2 border border-[#cbd5e1] rounded text-sm w-64"
                    />
                    <button 
                      className="px-3 py-2 rounded border border-[#0369a1] bg-[#0369a1] text-white text-sm hover:opacity-90"
                      onClick={() => setShowAddSacado(true)}
                    >
                      + Adicionar Sacado
                    </button>
                  </div>
                </div>

                {sacados.length === 0 ? (
                  <div className="text-center py-12 bg-[#f8fafc] rounded-lg border border-dashed border-[#cbd5e1]">
                    <p className="text-[#64748b] text-lg mb-2">Nenhum sacado cadastrado ainda</p>
                    <p className="text-sm text-[#94a3b8] mb-4">
                      Adicione os devedores deste cedente para iniciar a cobrança
                    </p>
                    <button 
                      className="px-4 py-2 rounded border border-[#0369a1] bg-[#0369a1] text-white text-sm hover:opacity-90"
                      onClick={() => setShowAddSacado(true)}
                    >
                      + Adicionar Primeiro Sacado
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-[#e0efff] to-[#f0f7ff]">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[#0369a1]">Razão Social</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[#0369a1]">Nome Fantasia</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[#0369a1]">CNPJ</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[#0369a1]">Situação</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[#0369a1]">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#cbd5e1]">
                        {sacados
                          .filter(s => {
                            const t = sacadosQuery.trim().toLowerCase();
                            if (!t) return true;
                            return (
                              s.razao_social.toLowerCase().includes(t) ||
                              (s.nome_fantasia || '').toLowerCase().includes(t) ||
                              s.cnpj.replace(/\D+/g, '').includes(t.replace(/\D+/g, ''))
                            );
                          })
                          .map(sacado => (
                          <tr key={sacado.cnpj} className="hover:bg-[#f8fbff] transition-colors">
                            <td className="px-4 py-3 text-sm text-[#1e293b] font-medium">{sacado.razao_social}</td>
                            <td className="px-4 py-3 text-sm text-[#64748b]">{sacado.nome_fantasia || '—'}</td>
                            <td className="px-4 py-3 text-sm text-[#64748b] font-mono">{formatCpfCnpj(sacado.cnpj)}</td>
                            <td className="px-4 py-3">
                              {sacado.situacao && (
                                <Badge variant={sacado.situacao === 'ATIVA' ? 'success' : 'error'} size="sm">
                                  {sacado.situacao}
                                </Badge>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                <Link href={`/sacados/${encodeURIComponent(sacado.cnpj)}`} title="Ver">
                                  <button className="p-2 rounded hover:bg-[#e2e8f0]" aria-label="Ver">👁️</button>
                                </Link>
                                <Link href={`/sacados/${encodeURIComponent(sacado.cnpj)}/editar`} title="Editar">
                                  <button className="p-2 rounded hover:bg-[#e2e8f0]" aria-label="Editar">✏️</button>
                                </Link>
                                <Link href={`/sacados/${encodeURIComponent(sacado.cnpj)}/cobranca`} title="Ficha de Cobrança">
                                  <button className="p-2 rounded hover:bg-[#e2e8f0]" aria-label="Ficha">📄</button>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <AtividadesManager 
                tipo="cedente" 
                id={id} 
                nome={cedente.nome} 
              />
            )}
          </div>
        </Card>

        {cedente.ultima_atualizacao && (
          <Card>
            <div className="text-center">
              <p className="text-sm text-[#64748b]">
                Última atualização: {new Date(cedente.ultima_atualizacao).toLocaleString('pt-BR')}
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Modal Adicionar Sacado */}
      {showAddSacado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-[#e2e8f0]">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <h2 className="text-lg font-semibold text-[#0369a1]">Adicionar Sacado</h2>
              <button
                onClick={() => {
                  setShowAddSacado(false);
                  setSacadoForm({ cnpj: '', razao_social: '', nome_fantasia: '' });
                }}
                className="px-2 py-1 text-[#64748b] hover:text-[#0f172a] text-xl"
                aria-label="Fechar"
              >×</button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#64748b] mb-1">CNPJ*</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sacadoForm.cnpj}
                    onChange={(e) => setSacadoForm(f => ({ ...f, cnpj: formatCpfCnpj(e.target.value) }))}
                    placeholder="00.000.000/0000-00"
                    className="flex-1 px-3 py-2 border border-[#cbd5e1] rounded text-sm"
                    maxLength={18}
                  />
                  <button
                    onClick={consultarCnpjSacado}
                    disabled={loadingSacadoCnpj}
                    className="px-3 py-2 border border-[#0369a1] text-[#0369a1] rounded text-sm hover:bg-[#f0f7ff] disabled:opacity-50"
                  >
                    {loadingSacadoCnpj ? 'Consultando...' : '🔍 Consultar'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#64748b] mb-1">Razão Social*</label>
                <input
                  type="text"
                  value={sacadoForm.razao_social}
                  onChange={(e) => setSacadoForm(f => ({ ...f, razao_social: e.target.value }))}
                  placeholder="Razão social da empresa"
                  className="w-full px-3 py-2 border border-[#cbd5e1] rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#64748b] mb-1">Nome Fantasia</label>
                <input
                  type="text"
                  value={sacadoForm.nome_fantasia}
                  onChange={(e) => setSacadoForm(f => ({ ...f, nome_fantasia: e.target.value }))}
                  placeholder="Nome fantasia (opcional)"
                  className="w-full px-3 py-2 border border-[#cbd5e1] rounded text-sm"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => {
                    setShowAddSacado(false);
                    setSacadoForm({ cnpj: '', razao_social: '', nome_fantasia: '' });
                  }}
                  className="px-4 py-2 border border-[#cbd5e1] rounded text-sm text-[#64748b] hover:bg-[#f1f5f9]"
                >
                  Cancelar
                </button>
                <button
                  onClick={adicionarSacado}
                  disabled={savingSacado || !sacadoForm.cnpj || !sacadoForm.razao_social}
                  className="px-4 py-2 bg-[#0369a1] text-white rounded text-sm hover:opacity-90 disabled:opacity-50"
                >
                  {savingSacado ? 'Salvando...' : 'Adicionar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
