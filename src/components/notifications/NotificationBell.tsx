'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import Badge from '@/components/ui/Badge';

export default function NotificationBell() {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  function handleNotificationClick(notification: Notification) {
    markAsRead(notification.id);
    if (notification.link) {
      router.push(notification.link);
      setIsOpen(false);
    }
  }

  function getNotificationIcon(tipo: Notification['tipo']) {
    switch (tipo) {
      case 'atividade_pendente':
        return '📋';
      case 'lembrete_vencimento':
        return '⏰';
      case 'atividade_atrasada':
        return '⚠️';
      default:
        return '🔔';
    }
  }

  function getNotificationColor(tipo: Notification['tipo']) {
    switch (tipo) {
      case 'atividade_pendente':
        return 'info';
      case 'lembrete_vencimento':
        return 'warning';
      case 'atividade_atrasada':
        return 'error';
      default:
        return 'neutral';
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors"
        title="Notificações"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notificações</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                Nenhuma notificação
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map(notification => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                      !notification.lida ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{getNotificationIcon(notification.tipo)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-semibold ${
                            !notification.lida ? 'text-gray-900' : 'text-gray-600'
                          }`}>
                            {notification.titulo}
                          </span>
                          {!notification.lida && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        <p className={`text-xs ${
                          !notification.lida ? 'text-gray-700' : 'text-gray-500'
                        }`}>
                          {notification.mensagem}
                        </p>
                        {notification.data_referencia && (
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.data_referencia).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

