'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export type Notification = {
  id: string;
  tipo: 'atividade_pendente' | 'lembrete_vencimento' | 'atividade_atrasada' | 'outro';
  titulo: string;
  mensagem: string;
  link?: string;
  lida: boolean;
  created_at: string;
  data_referencia?: string; // Para lembretes de vencimento
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      // Buscar atividades pendentes
      const [sacadosAtividades, cedentesAtividades, titulosAtividades, contasVencendo] = await Promise.all([
        Promise.resolve(
          supabase
            .from('sacados_atividades')
            .select('id, tipo, descricao, data_hora, data_lembrete, sacado_cnpj')
            .eq('status', 'pendente')
        ).then(result => ({ data: result.data, error: result.error }))
        .catch(() => ({ data: null, error: null })),
        Promise.resolve(
          supabase
            .from('cedentes_atividades')
            .select('id, tipo, descricao, data_hora, data_lembrete, cedente_id')
            .eq('status', 'pendente')
        ).then(result => ({ data: result.data, error: result.error }))
        .catch(() => ({ data: null, error: null })),
        Promise.resolve(
          supabase
            .from('titulos_atividades')
            .select('id, tipo, descricao, data_hora, data_lembrete, titulo_id')
            .eq('status', 'pendente')
        ).then(result => ({ data: result.data, error: result.error }))
        .catch(() => ({ data: null, error: null })),
        Promise.resolve(
          supabase
            .from('lancamentos')
            .select('id, descricao, valor, data_competencia')
            .eq('status', 'pendente')
            .eq('natureza', 'receita')
            .lte('data_competencia', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        ).then(result => ({ data: result.data, error: result.error }))
        .catch(() => ({ data: null, error: null }))
      ]);

      const notificationsList: Notification[] = [];

      // Processar atividades pendentes
      if (sacadosAtividades.data) {
        sacadosAtividades.data.forEach((atividade: any) => {
          notificationsList.push({
            id: `sacado_${atividade.id}`,
            tipo: 'atividade_pendente',
            titulo: 'Atividade Pendente',
            mensagem: `${atividade.descricao} (Sacado)`,
            link: `/sacados/${encodeURIComponent(atividade.sacado_cnpj)}`,
            lida: false,
            created_at: atividade.data_hora,
            data_referencia: atividade.data_lembrete || undefined
          });
        });
      }

      if (cedentesAtividades.data) {
        cedentesAtividades.data.forEach((atividade: any) => {
          notificationsList.push({
            id: `cedente_${atividade.id}`,
            tipo: 'atividade_pendente',
            titulo: 'Atividade Pendente',
            mensagem: `${atividade.descricao} (Cedente)`,
            link: `/cedentes/${atividade.cedente_id}`,
            lida: false,
            created_at: atividade.data_hora,
            data_referencia: atividade.data_lembrete || undefined
          });
        });
      }

      // Processar atividades pendentes de títulos
      if (titulosAtividades.data && titulosAtividades.data.length > 0) {
        // Buscar informações dos títulos para obter cedente_id e numero_titulo
        const titulosIds = titulosAtividades.data.map((a: any) => a.titulo_id);
        const { data: titulosInfo } = await supabase
          .from('titulos_negociados')
          .select('id, numero_titulo, cedente_id')
          .in('id', titulosIds);

        const titulosMap = new Map((titulosInfo || []).map((t: any) => [t.id, t]));

        titulosAtividades.data.forEach((atividade: any) => {
          const tituloInfo = titulosMap.get(atividade.titulo_id);
          if (tituloInfo) {
            notificationsList.push({
              id: `titulo_${atividade.id}`,
              tipo: 'atividade_pendente',
              titulo: 'Atividade Pendente',
              mensagem: `${atividade.descricao} (Título #${tituloInfo.numero_titulo})`,
              link: `/cedentes/${tituloInfo.cedente_id}?titulo=${atividade.titulo_id}&tab=titulos`,
              lida: false,
              created_at: atividade.data_hora,
              data_referencia: atividade.data_lembrete || undefined
            });
          }
        });
      }

      // Processar lembretes de vencimento
      if (cedentesAtividades.data) {
        cedentesAtividades.data.forEach((atividade: any) => {
          if (atividade.data_lembrete) {
            const dataLembrete = new Date(atividade.data_lembrete);
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const diasRestantes = Math.ceil((dataLembrete.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diasRestantes >= 0 && diasRestantes <= 7) {
              notificationsList.push({
                id: `lembrete_cedente_${atividade.id}`,
                tipo: diasRestantes === 0 ? 'lembrete_vencimento' : 'lembrete_vencimento',
                titulo: diasRestantes === 0 ? 'Lembrete Vencido Hoje' : `Lembrete em ${diasRestantes} dia(s)`,
                mensagem: atividade.descricao,
                link: `/cedentes/${atividade.cedente_id}`,
                lida: false,
                created_at: atividade.data_lembrete,
                data_referencia: atividade.data_lembrete
              });
            }
          }
        });
      }

      if (sacadosAtividades.data) {
        sacadosAtividades.data.forEach((atividade: any) => {
          if (atividade.data_lembrete) {
            const dataLembrete = new Date(atividade.data_lembrete);
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const diasRestantes = Math.ceil((dataLembrete.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diasRestantes >= 0 && diasRestantes <= 7) {
              notificationsList.push({
                id: `lembrete_sacado_${atividade.id}`,
                tipo: diasRestantes === 0 ? 'lembrete_vencimento' : 'lembrete_vencimento',
                titulo: diasRestantes === 0 ? 'Lembrete Vencido Hoje' : `Lembrete em ${diasRestantes} dia(s)`,
                mensagem: atividade.descricao,
                link: `/sacados/${encodeURIComponent(atividade.sacado_cnpj)}`,
                lida: false,
                created_at: atividade.data_lembrete,
                data_referencia: atividade.data_lembrete
              });
            }
          }
        });
      }

      // Processar lembretes de atividades de títulos
      if (titulosAtividades.data) {
        const titulosIds = titulosAtividades.data.map((a: any) => a.titulo_id);
        const { data: titulosInfo } = await supabase
          .from('titulos_negociados')
          .select('id, numero_titulo, cedente_id')
          .in('id', titulosIds);

        const titulosMap = new Map((titulosInfo || []).map((t: any) => [t.id, t]));

        titulosAtividades.data.forEach((atividade: any) => {
          if (atividade.data_lembrete) {
            const tituloInfo = titulosMap.get(atividade.titulo_id);
            if (tituloInfo) {
              const dataLembrete = new Date(atividade.data_lembrete);
              const hoje = new Date();
              hoje.setHours(0, 0, 0, 0);
              const diasRestantes = Math.ceil((dataLembrete.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
              
              if (diasRestantes >= 0 && diasRestantes <= 7) {
                notificationsList.push({
                  id: `lembrete_titulo_${atividade.id}`,
                  tipo: diasRestantes === 0 ? 'lembrete_vencimento' : 'lembrete_vencimento',
                  titulo: diasRestantes === 0 ? 'Lembrete Vencido Hoje' : `Lembrete em ${diasRestantes} dia(s)`,
                  mensagem: `${atividade.descricao} (Título #${tituloInfo.numero_titulo})`,
                  link: `/cedentes/${tituloInfo.cedente_id}?titulo=${atividade.titulo_id}&tab=titulos`,
                  lida: false,
                  created_at: atividade.data_lembrete,
                  data_referencia: atividade.data_lembrete
                });
              }
            }
          }
        });
      }

      // Processar contas vencendo
      if (contasVencendo.data) {
        contasVencendo.data.forEach((conta: any) => {
          const dataVencimento = new Date(conta.data_competencia);
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);
          const diasRestantes = Math.ceil((dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
          
          notificationsList.push({
            id: `conta_${conta.id}`,
            tipo: diasRestantes < 0 ? 'lembrete_vencimento' : 'lembrete_vencimento',
            titulo: diasRestantes < 0 ? 'Conta Vencida' : diasRestantes === 0 ? 'Conta Vence Hoje' : `Conta Vence em ${diasRestantes} dia(s)`,
            mensagem: `${conta.descricao || 'Conta'} - ${conta.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
            link: '/financeiro/a-receber',
            lida: false,
            created_at: conta.data_competencia,
            data_referencia: conta.data_competencia
          });
        });
      }

      // Ordenar por data (mais recentes primeiro)
      notificationsList.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(notificationsList);
      setUnreadCount(notificationsList.length);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    // Atualizar a cada 5 minutos
    const interval = setInterval(loadNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, lida: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    refresh: loadNotifications,
    markAsRead,
    markAllAsRead
  };
}

