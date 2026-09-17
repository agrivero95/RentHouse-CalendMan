import { useEffect, useRef, useCallback, useState } from 'react';

type EventCallback = (data: any) => void;

export function useWebSocket(token?: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const callbacksRef = useRef<Map<string, Set<EventCallback>>>(new Map());
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const url = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws${token ? `?token=${token}` : ''}`;
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onclose = () => {
        setIsConnected(false);
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { event: eventType, data } = message;

          const callbacks = callbacksRef.current.get(eventType) || new Set();
          callbacks.forEach((cb) => cb(data));

          if (eventType.startsWith('appointment:') || eventType === 'admin:notification') {
            setNotifications((prev) => [{ id: `${eventType}_${Date.now()}`, event: eventType, data, timestamp: new Date().toISOString() }, ...prev].slice(0, 50));
          }
        } catch {
          // ignore parse errors
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('WebSocket connection failed:', err);
      reconnectTimeoutRef.current = setTimeout(connect, 5000);
    }
  }, [token]);

  const on = useCallback((event: string, callback: EventCallback) => {
    if (!callbacksRef.current.has(event)) {
      callbacksRef.current.set(event, new Set());
    }
    callbacksRef.current.get(event)!.add(callback);

    return () => {
      callbacksRef.current.get(event)?.delete(callback);
    };
  }, []);

  const ping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event: 'ping' }));
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { isConnected, notifications, on, ping };
}
