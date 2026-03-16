'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/ui/ToastContainer';

type Atividade = {
  id: string;
  tipo: 'ligacao' | 'email' | 'reuniao' | 'observacao' | 'lembrete' | 'documento' | 'negociacao' | 'whatsapp';
  descricao: string;
  data_hora: string;
  usuario_id: string;
  usuario_nome?: string;
  status: 'pendente' | 'concluida' | 'cancelada';
  proxima_acao?: string;
  data_lembrete?: string;
  observacoes?: string;
  created_at: string;
};

type Critica = {
  id: string;
  nome: string;
};

type TituloInfo = {
  id: string;
  critica: string | null;
};

type CriticaHistorico = {
  id: string;
  critica_anterior: string | null;
  critica_nova: string | null;
  user_id: string;
  usuario_nome?: string;
  created_at: string;
};

type TitulosAtividadesManagerProps = {
  tituloId: string;
  numeroTitulo: string;
  sacadoNome: string;
};

export default function TitulosAtividadesManager({ 
  tituloId, 
  numeroTitulo,
  sacadoNome 
}: TitulosAtividadesManagerProps) {
  const { showToast } = useToast();
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pendente' | 'concluida'>('todos');
  const [tituloInfo, setTituloInfo] = useState<TituloInfo | null>(null);
  const [criticas, setCriticas] = useState<Critica[]>([]);
  const [criticaSelecionada, setCriticaSelecionada] = useState<string>('');
  const [historicoCriticas, setHistoricoCriticas] = useState<CriticaHistorico[]>([]);
  const [usuarioAtualEmail, setUsuarioAtualEmail] = useState<string>('');
  const [cedenteNome, setCedenteNome] = useState<string>('');
  const [sacadoNomeCompleto, setSacadoNomeCompleto] = useState<string>('');
  const [form, setForm] = useState({
    tipo: 'ligacao' as Atividade['tipo'],
    descricao: '',
    status: 'concluida' as 'pendente' | 'concluida' | 'cancelada',
    proxima_acao: '',
    data_lembrete: '',
    observacoes: '',
    direcionado_a: '' as 'cedente' | 'sacado' | ''
  });

  const tiposAtividade = [
    { value: 'ligacao', label: 'Ligação', cor: '#3b82f6' },
    { value: 'email', label: 'Email', cor: '#10b981' },
    { value: 'whatsapp', label: 'WhatsApp', cor: '#25D366' },
    { value: 'reuniao', label: 'Reunião', cor: '#8b5cf6' },
    { value: 'observacao', label: 'Observação', cor: '#6b7280' },
    { value: 'lembrete', label: 'Lembrete', cor: '#f59e0b' },
    { value: 'documento', label: 'Documento', cor: '#ef4444' },
    { value: 'negociacao', label: 'Negociação', cor: '#059669' }
  ];

  useEffect(() => {
    loadUsuarioAtual();
    loadAtividades();
    loadTituloInfo();
    loadCriticas();
    loadHistoricoCriticas();
  }, [tituloId]);

  async function loadUsuarioAtual() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      setUsuarioAtualEmail(user.email.split('@')[0]);
    }
  }

  async function loadAtividades() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('titulos_atividades')
        .select('*')
        .eq('titulo_id', tituloId)
        .order('data_hora', { ascending: false });
      
      if (error) {
        if (error.code !== 'PGRST116' && error.code !== '42P01') {
          console.error('Erro ao carregar atividades:', error);
        }
        setAtividades([]);
      } else {
        // Buscar email do usuário atual para identificar atividades dele
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const usuariosMap = new Map<string, string>();
        
        if (currentUser) {
          usuariosMap.set(currentUser.id, currentUser.email?.split('@')[0] || 'Usuário');
        }
        
        const atividadesProcessadas = data?.map(item => ({
          ...item,
          usuario_nome: usuariosMap.get(item.user_id) || 'Usuário'
        })) || [];
        setAtividades(atividadesProcessadas);
      }
    } catch (err) {
      setAtividades([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadTituloInfo() {
    try {
      const { data, error } = await supabase
        .from('titulos_negociados')
        .select('id, critica, cedente_id, sacado_cnpj')
        .eq('id', tituloId)
        .single();
      
      if (!error && data) {
        setTituloInfo(data);
        setCriticaSelecionada(data.critica || '');
        
        // Buscar nome do cedente
        if (data.cedente_id) {
          const { data: cedenteData } = await supabase
            .from('cedentes')
            .select('nome')
            .eq('id', data.cedente_id)
            .single();
          
          setCedenteNome(cedenteData?.nome || 'Cedente');
        }
        
        // Buscar nome do sacado
        if (data.sacado_cnpj) {
          const { data: sacadoData } = await supabase
            .from('sacados')
            .select('razao_social, nome_fantasia')
            .eq('cnpj', data.sacado_cnpj)
            .single();
          
          setSacadoNomeCompleto(sacadoData?.nome_fantasia || sacadoData?.razao_social || sacadoNome || 'Sacado');
        }
      }
    } catch (err) {
      console.error('Erro ao carregar informações do título:', err);
    }
  }

  async function loadCriticas() {
    try {
      const { data, error } = await supabase
        .from('criticas_titulos')
        .select('id, nome')
        .eq('ativo', true)
        .order('ordem', { ascending: true });
      
      if (!error && data) {
        setCriticas(data);
      }
    } catch (err) {
      console.error('Erro ao carregar críticas:', err);
    }
  }

  async function loadHistoricoCriticas() {
    try {
      const { data, error } = await supabase
        .from('titulos_criticas_historico')
        .select('*')
        .eq('titulo_id', tituloId)
        .order('created_at', { ascending: false });
      
      if (error) {
        // Se a tabela não existir ainda, não é erro crítico
        if (error.code !== 'PGRST116' && error.code !== '42P01') {
          console.error('Erro ao carregar histórico de críticas:', error);
        }
        setHistoricoCriticas([]);
        return;
      }

      // Buscar email do usuário atual para identificar
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const usuariosMap = new Map<string, string>();
      if (currentUser) {
        usuariosMap.set(currentUser.id, currentUser.email?.split('@')[0] || 'Usuário');
      }

      const historicoProcessado = (data || []).map(item => ({
        ...item,
        usuario_nome: usuariosMap.get(item.user_id) || 'Usuário'
      }));

      setHistoricoCriticas(historicoProcessado);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
      setHistoricoCriticas([]);
    }
  }

  async function salvarCritica() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast('Usuário não autenticado', 'error');
        return;
      }

      // Atualizar a crítica no título
      // O trigger vai registrar automaticamente no histórico
      const { error: updateError } = await supabase
        .from('titulos_negociados')
        .update({ critica: criticaSelecionada || null })
        .eq('id', tituloId);
      
      if (updateError) throw updateError;
      
      showToast('Crítica atualizada com sucesso', 'success');
      loadTituloInfo();
      loadHistoricoCriticas();
    } catch (error: any) {
      console.error('Erro ao salvar crítica:', error);
      showToast('Erro ao salvar crítica', 'error');
    }
  }

  async function excluirCriticaHistorico(historicoId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast('Usuário não autenticado', 'error');
        return;
      }

      console.log('Excluindo histórico ID:', historicoId);
      console.log('User ID:', user.id);
      
      const { data, error } = await supabase
        .from('titulos_criticas_historico')
        .delete()
        .eq('id', historicoId)
        .select();
      
      console.log('Resultado da exclusão:', { data, error });
      
      if (error) {
        console.error('Erro detalhado:', error);
        console.error('Código do erro:', error.code);
        console.error('Mensagem do erro:', error.message);
        console.error('Detalhes do erro:', error.details);
        showToast(`Erro: ${error.message || 'Erro ao excluir'}`, 'error');
        return;
      }
      
      if (!data || data.length === 0) {
        console.warn('Nenhum registro foi excluído');
        showToast('Nenhum registro foi excluído. Verifique se você tem permissão.', 'warning');
        return;
      }
      
      console.log('Registro excluído com sucesso:', data);
      showToast('Registro do histórico excluído com sucesso', 'success');
      loadHistoricoCriticas();
    } catch (error: any) {
      console.error('Erro ao excluir histórico:', error);
      showToast(`Erro ao excluir registro: ${error.message || 'Erro desconhecido'}`, 'error');
    }
  }

  async function adicionarAtividade() {
    if (!form.descricao.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Adicionar timestamp simples com identificação do usuário
      const usuarioEmail = user.email?.split('@')[0] || 'Usuário';
      const timestamp = new Date().toLocaleString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Adicionar informação de direcionamento da cobrança
      let descricaoCompleta = form.descricao.trim();
      if (form.direcionado_a) {
        const direcionado = form.direcionado_a === 'cedente' 
          ? `Cobrança direcionada ao CEDENTE (${cedenteNome})`
          : `Cobrança direcionada ao SACADO (${sacadoNomeCompleto})`;
        descricaoCompleta = `${descricaoCompleta} | ${direcionado}`;
      }
      
      const descricaoComTimestamp = `${descricaoCompleta} [${usuarioEmail} - ${timestamp}]`;

      const atividadeData: any = {
        titulo_id: tituloId,
        user_id: user.id,
        tipo: form.tipo,
        descricao: descricaoComTimestamp,
        status: form.status,
        data_hora: new Date().toISOString(),
        proxima_acao: form.proxima_acao.trim() || null,
        data_lembrete: form.data_lembrete ? new Date(form.data_lembrete).toISOString() : null,
        observacoes: form.observacoes.trim() || null
      };

      if (editingId) {
        const { error } = await supabase
          .from('titulos_atividades')
          .update(atividadeData)
          .eq('id', editingId)
          .eq('user_id', user.id);
        
        if (error) throw error;
        showToast('Atividade atualizada com sucesso', 'success');
      } else {
        const { error } = await supabase
          .from('titulos_atividades')
          .insert(atividadeData);
        
        if (error) throw error;
        showToast('Atividade registrada com sucesso', 'success');
      }

      setShowForm(false);
      resetForm();
      loadAtividades();
    } catch (error: any) {
      console.error('Erro ao salvar atividade:', error);
      showToast('Erro ao salvar atividade', 'error');
    }
  }

  async function excluirAtividade(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta atividade?')) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('titulos_atividades')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      showToast('Atividade excluída com sucesso', 'success');
      loadAtividades();
    } catch (error: any) {
      console.error('Erro ao excluir atividade:', error);
      showToast('Erro ao excluir atividade', 'error');
    }
  }

  function resetForm() {
    setForm({
      tipo: 'ligacao',
      descricao: '',
      status: 'concluida',
      proxima_acao: '',
      data_lembrete: '',
      observacoes: '',
      direcionado_a: ''
    });
    setEditingId(null);
  }

  function limparDescricao(descricao: string): string {
    // Remove padrões como [usuario - DD/MM/AAAA, HH:MM] ou [usuario - data]
    // Mas mantém a informação de direcionamento (antes do |)
    let descricaoLimpa = descricao.replace(/\s*\[[^\]]*\]\s*$/, '').trim();
    
    // Se tiver informação de direcionamento (| Cobrança direcionada...), separa
    const partes = descricaoLimpa.split(' | ');
    if (partes.length > 1) {
      // Retorna apenas a descrição principal (sem a parte de direcionamento)
      return partes[0].trim();
    }
    
    return descricaoLimpa;
  }

  function extrairDirecionamento(descricao: string): 'cedente' | 'sacado' | '' {
    // Extrai informação de direcionamento da descrição
    if (descricao.includes('Cobrança direcionada ao CEDENTE')) {
      return 'cedente';
    } else if (descricao.includes('Cobrança direcionada ao SACADO')) {
      return 'sacado';
    }
    return '';
  }

  function editarAtividade(atividade: Atividade) {
    const direcionado = extrairDirecionamento(atividade.descricao);
    setForm({
      tipo: atividade.tipo,
      descricao: limparDescricao(atividade.descricao), // Limpa timestamp e direcionamento ao editar
      status: atividade.status,
      proxima_acao: atividade.proxima_acao || '',
      data_lembrete: atividade.data_lembrete ? new Date(atividade.data_lembrete).toISOString().slice(0, 16) : '',
      observacoes: atividade.observacoes || '',
      direcionado_a: direcionado
    });
    setEditingId(atividade.id);
    setShowForm(true);
  }

  const atividadesFiltradas = atividades.filter(a => {
    if (filtroStatus === 'todos') return true;
    return a.status === filtroStatus;
  });

  const atividadesPendentes = atividades.filter(a => a.status === 'pendente').length;

  return (
    <div className="space-y-4">
      {/* Seção de Crítica */}
      <div className="space-y-2">
        {/* Cabeçalho Compacto */}
        <div className="compact-table-title">
          <div className="flex items-center gap-3">
            <h3 className="compact-table-title-main">Critica do Titulo</h3>
            <span className="compact-table-count">{historicoCriticas.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={criticaSelecionada}
              onChange={(e) => setCriticaSelecionada(e.target.value)}
              options={[
                { value: '', label: 'Sem crítica' },
                ...criticas.map(c => ({ value: c.nome, label: c.nome }))
              ]}
              className="text-xs"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={salvarCritica}
              disabled={criticaSelecionada === (tituloInfo?.critica || '')}
              className="text-xs px-2 py-1 !text-white"
            >
              Salvar
            </Button>
          </div>
        </div>

        {/* Tabela Compacta Estilo Excel - Histórico de Críticas */}
        {historicoCriticas.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm border border-gray-200 bg-white">
            Nenhuma alteração de crítica registrada ainda.
          </div>
        ) : (
          <div className="compact-table-shell">
            <div className="overflow-x-auto">
              <table className="compact-table">
                <thead>
                  <tr>
                    <th className="whitespace-nowrap">
                      Data/Hora
                    </th>
                    <th className="whitespace-nowrap">
                      Usuario
                    </th>
                    <th className="whitespace-nowrap">
                      Crítica Anterior
                    </th>
                    <th className="whitespace-nowrap">
                      Crítica Nova
                    </th>
                    <th className="text-center whitespace-nowrap">
                      Acoes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {historicoCriticas.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="text-xs">
                          <div className="font-medium text-gray-900">
                            {new Date(item.created_at).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-gray-500">
                            {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs text-gray-600 font-medium">
                          {item.usuario_nome || 'Usuário'}
                        </span>
                      </td>
                      <td>
                        <Badge variant="neutral" size="sm" className="text-xs">
                          {item.critica_anterior || 'Sem crítica'}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant="warning" size="sm" className="text-xs">
                          {item.critica_nova || 'Sem crítica'}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <button
                          onClick={() => excluirCriticaHistorico(item.id)}
                          className="px-1.5 py-0.5 text-xs border border-red-300 bg-white hover:bg-red-50 text-red-600 font-medium"
                          title="Excluir"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Cabeçalho Compacto */}
      <div className="compact-table-title">
        <div className="flex items-center gap-3">
          <h3 className="compact-table-title-main">Historico de Cobranca</h3>
          <span className="compact-table-count">#{numeroTitulo}</span>
          <span className="text-xs font-medium text-slate-600 truncate max-w-[320px]">{sacadoNome}</span>
          {atividadesPendentes > 0 && (
            <Badge variant="warning" size="sm" className="text-xs">
              {atividadesPendentes}P
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as any)}
            options={[
              { value: 'todos', label: 'Todas' },
              { value: 'pendente', label: 'Pendentes' },
              { value: 'concluida', label: 'Concluídas' }
            ]}
            className="text-xs"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="text-xs px-2 py-1 !text-white"
          >
            + Nova
          </Button>
        </div>
      </div>

      {/* Tabela Compacta Estilo Excel */}
      {loading ? (
        <div className="text-center py-8 text-gray-500 text-sm border border-gray-200 bg-white">
          Carregando atividades...
        </div>
      ) : atividadesFiltradas.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm border border-gray-200 bg-white">
          Nenhuma atividade registrada ainda.
        </div>
      ) : (
        <div className="compact-table-shell">
          <div className="overflow-x-auto">
            <table className="compact-table">
              <thead>
                <tr>
                  <th className="whitespace-nowrap">
                    Data/Hora
                  </th>
                  <th className="whitespace-nowrap">
                    Usuario
                  </th>
                  <th className="whitespace-nowrap">
                    Tipo
                  </th>
                  <th className="whitespace-nowrap">
                    Status
                  </th>
                  <th className="whitespace-nowrap">
                    Descricao
                  </th>
                  <th className="whitespace-nowrap">
                    Proxima Acao
                  </th>
                  <th className="whitespace-nowrap">
                    Lembrete
                  </th>
                  <th className="text-center whitespace-nowrap">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody>
                {atividadesFiltradas.map((atividade) => {
                  const tipoInfo = tiposAtividade.find(t => t.value === atividade.tipo);
                  return (
                    <tr key={atividade.id}>
                      <td>
                        <div className="text-xs">
                          <div className="font-medium text-gray-900">
                            {new Date(atividade.data_hora).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-gray-500">
                            {new Date(atividade.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs text-gray-600 font-medium">
                          {atividade.usuario_nome || 'Usuário'}
                        </span>
                      </td>
                      <td>
                        <Badge
                          variant={
                            atividade.tipo === 'ligacao' ? 'info' :
                            atividade.tipo === 'email' ? 'success' :
                            atividade.tipo === 'negociacao' ? 'warning' :
                            'neutral'
                          }
                          size="sm"
                          className="text-xs"
                        >
                          {tipoInfo?.label || atividade.tipo}
                        </Badge>
                      </td>
                      <td>
                        <Badge
                          variant={
                            atividade.status === 'pendente' ? 'warning' :
                            atividade.status === 'concluida' ? 'success' :
                            'error'
                          }
                          size="sm"
                          className="text-xs"
                        >
                          {atividade.status === 'pendente' ? 'Pendente' :
                           atividade.status === 'concluida' ? 'Concluída' :
                           'Cancelada'}
                        </Badge>
                      </td>
                      <td>
                        <div className="text-xs text-gray-700 max-w-xs">
                          <div className="truncate" title={limparDescricao(atividade.descricao)}>
                            {limparDescricao(atividade.descricao)}
                          </div>
                          {atividade.descricao.includes('Cobrança direcionada ao CEDENTE') && (
                            <div className="text-xs text-blue-600 font-medium mt-0.5">
                              → Cedente
                            </div>
                          )}
                          {atividade.descricao.includes('Cobrança direcionada ao SACADO') && (
                            <div className="text-xs text-green-600 font-medium mt-0.5">
                              → Sacado
                            </div>
                          )}
                        </div>
                        {atividade.observacoes && (
                          <div className="text-xs text-gray-500 italic mt-0.5 truncate" title={atividade.observacoes}>
                            {atividade.observacoes}
                          </div>
                        )}
                      </td>
                      <td>
                        {atividade.proxima_acao ? (
                          <span className="text-xs text-gray-700">{atividade.proxima_acao}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td>
                        {atividade.data_lembrete ? (
                          <div className="text-xs">
                            <div className="text-gray-700">
                              {new Date(atividade.data_lembrete).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="text-gray-500">
                              {new Date(atividade.data_lembrete).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => editarAtividade(atividade)}
                            className="px-2 py-0.5 text-xs border border-blue-300 bg-white hover:bg-blue-50 text-blue-600 font-medium"
                            title="Editar"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => excluirAtividade(atividade.id)}
                            className="px-2 py-0.5 text-xs border border-red-300 bg-white hover:bg-red-50 text-red-600 font-medium"
                            title="Excluir"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de formulário */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          resetForm();
        }}
        title={editingId ? 'Editar Atividade' : 'Nova Atividade de Cobrança'}
      >
        <div className="space-y-4">
          <Select
            label="Tipo de Atividade"
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value as Atividade['tipo'] })}
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
            label="Cobrança direcionada a"
            value={form.direcionado_a}
            onChange={(e) => setForm({ ...form, direcionado_a: e.target.value as 'cedente' | 'sacado' | '' })}
            options={[
              { value: '', label: 'Não especificado' },
              { value: 'cedente', label: `Cedente (${cedenteNome})` },
              { value: 'sacado', label: `Sacado (${sacadoNomeCompleto})` }
            ]}
          />

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
            label="Data do Lembrete"
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
              rows={3}
              placeholder="Observações adicionais..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={adicionarAtividade}
            >
              {editingId ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

