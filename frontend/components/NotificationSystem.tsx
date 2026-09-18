'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { notificationsApi, Notification } from '@/lib/types';
import { useWebSocket } from '@/src/hooks/useWebSocket';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  dismiss: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const isUnread = (n: Notification) => n.status === 'PENDING' || n.status === 'SENT';

function timeAgo(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (!seconds || seconds < 60) return 'hace un momento';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.round(hours / 24)} d`;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [token, setToken] = useState<string | null>(null);
  const pathname = usePathname();
  const { on } = useWebSocket(token);

  const syncToken = useCallback(() => {
    setToken((prev) => {
      const current = localStorage.getItem('token');
      return prev === current ? prev : current;
    });
  }, []);

  useEffect(() => {
    syncToken();
  }, [pathname, syncToken]);

  useEffect(() => {
    syncToken();
    window.addEventListener('focus', syncToken);
    window.addEventListener('storage', syncToken);
    return () => {
      window.removeEventListener('focus', syncToken);
      window.removeEventListener('storage', syncToken);
    };
  }, [syncToken]);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;

    try {
      const response = await notificationsApi.getAdmin();
      setNotifications(response.data);
      setUnreadCount(response.data.filter((n: Notification) => isUnread(n)).length);
    } catch (error) {
      // Silently ignore network errors
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const offs: Array<() => void> = [];

    const notifyDataChanged = () => window.dispatchEvent(new Event('rent-data-changed'));

    offs.push(
      on('admin:notification', (notification: Notification) => {
        if (!notification?.id) return;
        setNotifications((prev) =>
          [notification, ...prev.filter((n) => n.id !== notification.id)].slice(0, 50),
        );
        setUnreadCount((prev) => prev + 1);
        notifyDataChanged();
        window.dispatchEvent(new CustomEvent('rent-notification', { detail: notification }));
      }),
    );

    offs.push(on('appointment:created', () => { fetchNotifications(); notifyDataChanged(); }));
    offs.push(on('appointment:updated', () => { fetchNotifications(); notifyDataChanged(); }));
    offs.push(on('appointment:confirmed', () => { fetchNotifications(); notifyDataChanged(); }));
    offs.push(on('appointment:cancelled', () => { fetchNotifications(); notifyDataChanged(); }));
    offs.push(on('appointment:reminder', () => { fetchNotifications(); notifyDataChanged(); }));
    offs.push(on('property:updated', () => notifyDataChanged()));
    offs.push(on('slot:updated', () => notifyDataChanged()));

    return () => offs.forEach((off) => off());
  }, [on, fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'READ' as const, readAt: new Date().toISOString() } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const dismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications: notifications.filter((n) => !dismissed.has(n.id)),
        unreadCount,
        markAsRead,
        dismiss,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [showPanel, setShowPanel] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showPanel && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notificaciones</h3>
            <span className="text-xs text-gray-500">{unreadCount} sin leer</span>
          </div>
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No hay notificaciones</div>
          ) : (
            <div>
              {notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`p-3 border-b border-gray-100 cursor-pointer transition-colors ${
                    isUnread(n) ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start">
                    {isUnread(n) && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{n.title}</p>
                      <p className="text-xs text-gray-600 mt-0.5 break-words">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}