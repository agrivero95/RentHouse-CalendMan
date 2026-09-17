'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { notificationsApi, Notification } from '@/lib/types';
import api from '@/lib/api';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  dismiss: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await notificationsApi.getAdmin();
      setNotifications(response.data);
      setUnreadCount(response.data.filter((n: any) => n.status === 'PENDING' || n.status === 'SENT').length);
    } catch (error) {
      // Silently ignore network errors
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

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
    <NotificationContext.Provider value={{ notifications: notifications.filter((n) => !dismissed.has(n.id)), unreadCount, markAsRead, dismiss }}>
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
  const { unreadCount, markAsRead } = useNotifications();
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
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Notificaciones</h3>
          </div>
          {unreadCount === 0 ? (
            <div className="p-4 text-center text-gray-500">No hay notificaciones</div>
          ) : (
            <div>
              {Array.from({ length: Math.min(10, unreadCount) }).map((_, i) => (
                <div key={i} className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100" onClick={() => markAsRead(`notif-${i}`)}>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Nueva notificación</p>
                      <p className="text-xs text-gray-500 mt-1">Vista previa de la notificación...</p>
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
