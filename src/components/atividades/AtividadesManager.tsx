'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

type Atividade = {
  id: string;
  tipo: 'ligacao' | 'email' | 'reuniao' | 'observacao' | 'lembrete' | 'documento' | 'negociacao';
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

type AtividadesManagerProps = {
  tipo: 'sacado' | 'cedente';
  id: string; // cnpj para sacado ou id para cedente
  nome: string;
};

export default function AtividadesManager({ tipo, id, nome }: AtividadesManagerProps) {
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    tipo: 'ligacao' as Atividade['tipo'],
    descricao: '',
    proxima_acao: '',
    data_lembrete: '',
    observacoes: ''
  });

  const tiposAtividade = [
    { value: 'ligacao', label: 'Ligação', icon: '📞', cor: '#3b82f6' },
    { value: 'email', label: 'Email', icon: '📧', cor: '#10b981' },
    { value: 'reuniao', label: 'Reunião', icon: '🤝', cor: '#8b5cf6' },
    { value: 'observacao', label: 'Observação', icon: '📝', cor: '#6b7280' },
    { value: 'lembrete', label: 'Lembrete', icon: '⏰', cor: '#f59e0b' },
    { value: 'documento', label: 'Documento', icon: '📄', cor: '#ef4444' },
    { value: 'negociacao', label: 'Negociação', icon: '💰', cor: '#059669' }
  ];

  useEffect(() => {
    loadAtividades();
  }, [tipo, id]);

  async function loadAtividades() {
    setLoading(true);
    const tabela = tipo === 'sacado' ? 'sacados_atividades' : 'cedentes_atividades';
    const campoId = tipo === 'sacado' ? 'sacado_cnpj' : 'cedente_id';
    
    try {
      const { data, error } = await supabase
        .from(tabela)
        .select(`
          *,
          usuario:user_id (
            email
          )
        `)
        .eq(campoId, id)
        .order('data_hora', { ascending: false });
      
      if (error) {
        console.error('Erro ao carregar atividades:', error);
        // Se a tabela não existir, mostra array vazio
        if (error.code === 'PGRST116') {
          console.log('Tabela de atividades ainda não foi criada. Execute o SQL: database_schema_atividades.sql');
          setAtividades([]);
        } else {
          setAtividades([]);
        }
      } else {
        const atividadesComUsuario = data?.map(item => ({
          ...item,
          usuario_nome: item.usuario?.email || 'Usuário'
        })) || [];
        setAtividades(atividadesComUsuario);
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
      setAtividades([]);
    }
    setLoading(false);
  }

  async function adicionarAtividade() {
    if (!form.descricao.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const tabela = tipo === 'sacado' ? 'sacados_atividades' : 'cedentes_atividades';
    const campoId = tipo === 'sacado' ? 'sacado_cnpj' : 'cedente_id';
    
    try {
      const { error } = await supabase.from(tabela).insert({
        [campoId]: id,
        user_id: user.id,
        tipo: form.tipo,
        descricao: form.descricao.trim(),
        data_hora: new Date().toISOString(),
        status: 'concluida',
        proxima_acao: form.proxima_acao || null,
        data_lembrete: form.data_lembrete || null,
        observacoes: form.observacoes || null
      });

      if (error) {
        console.error('Erro ao adicionar atividade:', error);
        if (error.code === 'PGRST116') {
          alert('Tabela de atividades ainda não foi criada. Execute o SQL: database_schema_atividades.sql');
        } else {
          alert('Erro ao salvar atividade: ' + error.message);
        }
      } else {
        setForm({
          tipo: 'ligacao',
          descricao: '',
          proxima_acao: '',
          data_lembrete: '',
          observacoes: ''
        });
        setShowForm(false);
        loadAtividades();
      }
    } catch (err) {
      console.error('Erro inesperado ao adicionar atividade:', err);
      alert('Erro inesperado ao salvar atividade');
    }
  }

  function formatarData(data: string) {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function isLembreteVencido(dataLembrete?: string) {
    if (!dataLembrete) return false;
    return new Date(dataLembrete) <= new Date();
  }

  if (loading) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#0369a1]"></div>
          <p className="mt-2 text-[#64748b]">Carregando atividades...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#0369a1]">Atividades</h2>
          <p className="text-[#64748b]">Histórico de tratativas com {nome}</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setShowForm(!showForm)}
          size="sm"
        >
          {showForm ? 'Cancelar' : '+ Nova Atividade'}
        </Button>
      </div>

      {/* Formulário de Nova Atividade */}
      {showForm && (
        <Card>
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-[#0369a1]">Nova Atividade</h3>
            
            {/* Tipo de Atividade */}
            <div>
              <label className="block text-sm font-medium text-[#64748b] mb-2">Tipo</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {tiposAtividade.map(tipo => (
                  <button
                    key={tipo.value}
                    onClick={() => setForm({ ...form, tipo: tipo.value as Atividade['tipo'] })}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      form.tipo === tipo.value
                        ? 'border-[#0369a1] bg-[#f0f7ff] text-[#0369a1]'
                        : 'border-[#cbd5e1] hover:border-[#0369a1] hover:bg-[#f8fafc]'
                    }`}
                  >
                    <div className="text-lg mb-1">{tipo.icon}</div>
                    <div>{tipo.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Descrição */}
            <Input
              label="Descrição *"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              placeholder="Descreva a atividade realizada..."
            />

            {/* Próxima Ação */}
            <Input
              label="Próxima Ação"
              value={form.proxima_acao}
              onChange={(e) => setForm({ ...form, proxima_acao: e.target.value })}
              placeholder="O que fazer em seguida?"
            />

            {/* Data do Lembrete */}
            <div>
              <label className="block text-sm font-medium text-[#64748b] mb-1">Lembrete</label>
              <input
                type="datetime-local"
                value={form.data_lembrete}
                onChange={(e) => setForm({ ...form, data_lembrete: e.target.value })}
                className="w-full p-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1]"
              />
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-[#64748b] mb-1">Observações</label>
              <textarea
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Observações adicionais..."
                className="w-full p-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1] h-20 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={adicionarAtividade}>
                Salvar Atividade
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Lista de Atividades */}
      <Card>
        <div className="p-4">
          {atividades.length === 0 ? (
            <div className="text-center py-8 text-[#64748b]">
              <div className="text-4xl mb-2">📋</div>
              <p>Nenhuma atividade registrada ainda.</p>
              <p className="text-sm">Clique em "Nova Atividade" para começar.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {atividades.map(atividade => {
                const tipoInfo = tiposAtividade.find(t => t.value === atividade.tipo);
                return (
                  <div 
                    key={atividade.id} 
                    className="border-l-4 border-[#cbd5e1] pl-4 py-3 hover:bg-[#f8fafc] transition-colors"
                    style={{ borderLeftColor: tipoInfo?.cor }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{tipoInfo?.icon}</span>
                          <span className="font-medium text-[#1e293b]">{tipoInfo?.label}</span>
                          {atividade.data_lembrete && isLembreteVencido(atividade.data_lembrete) && (
                            <Badge variant="warning" size="sm">Lembrete Vencido</Badge>
                          )}
                        </div>
                        <p className="text-[#1e293b] mb-2">{atividade.descricao}</p>
                        {atividade.proxima_acao && (
                          <p className="text-sm text-[#64748b] mb-1">
                            <strong>Próxima ação:</strong> {atividade.proxima_acao}
                          </p>
                        )}
                        {atividade.data_lembrete && (
                          <p className="text-sm text-[#64748b] mb-1">
                            <strong>Lembrete:</strong> {formatarData(atividade.data_lembrete)}
                          </p>
                        )}
                        {atividade.observacoes && (
                          <p className="text-sm text-[#64748b] mb-1">
                            <strong>Observações:</strong> {atividade.observacoes}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-[#64748b]">
                          <span>Por: {atividade.usuario_nome}</span>
                          <span>{formatarData(atividade.data_hora)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
