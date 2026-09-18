'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

type EventCallback = (data: any) => void;

function buildWsUrl(token: string): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  let origin: string;

  if (/^https?:\/\//.test(apiUrl)) {
    origin = new URL(apiUrl).origin;
  } else {
    origin = typeof window !== 'undefined' ? window.location.origin : '';
  }

  const scheme = origin.startsWith('https:') ? 'wss:' : 'ws:';
  return `${scheme}//${origin.replace(/^https?:/, '')}/ws?token=${encodeURIComponent(token)}`;
}

const MAX_RECONNECT_DELAY_MS = 30_000;

export function useWebSocket(token?: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const tokenRef = useRef<string | null>(token ?? null);
  const callbacksRef = useRef<Map<string, Set<EventCallback>>>(new Map());
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disposedRef = useRef(false);
  const attemptRef = useRef(0);
  const [isConnected, setIsConnected] = useState(false);

  tokenRef.current = token ?? null;

  const connect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    const wsToken = tokenRef.current;
    if (!wsToken) {
      setIsConnected(false);
      return;
    }

    const current = wsRef.current;
    if (current && (current.readyState === WebSocket.OPEN || current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    let ws: WebSocket;
    try {
      ws = new WebSocket(buildWsUrl(wsToken));
    } catch (error) {
      console.error('WebSocket creation failed:', error);
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => {
      attemptRef.current = 0;
      setIsConnected(true);
    };

    ws.onclose = () => {
      if (wsRef.current === ws) wsRef.current = null;
      setIsConnected(false);
      if (disposedRef.current) return;

      const delay = Math.min(1000 * 2 ** attemptRef.current, MAX_RECONNECT_DELAY_MS);
      attemptRef.current += 1;
      reconnectTimerRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string);
        const { event: eventType, data } = message;
        const callbacks = callbacksRef.current.get(eventType) || new Set();
        callbacks.forEach((cb) => cb(data));
      } catch {
        // Ignore malformed frames
      }
    };
  }, []);

  const on = useCallback((event: string, callback: EventCallback) => {
    if (!callbacksRef.current.has(event)) {
      callbacksRef.current.set(event, new Set());
    }
    const set = callbacksRef.current.get(event)!;
    set.add(callback);

    return () => {
      set.delete(callback);
    };
  }, []);

  const ping = useCallback(() => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event: 'ping' }));
    }
  }, []);

  useEffect(() => {
    disposedRef.current = false;
    connect();

    return () => {
      disposedRef.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      wsRef.current?.close();
      wsRef.current = null;
      setIsConnected(false);
    };
  }, [token, connect]);

  return { isConnected, on, ping };
}