import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { Socket } from 'net';

export interface AuthenticatedWsClient {
  ws: WebSocket;
  adminId: string | null;
  username: string | null;
}

export const WsEventTypes = {
  ADMIN_NOTIFICATION: 'admin:notification',
  APPOINTMENT_CREATED: 'appointment:created',
  APPOINTMENT_UPDATED: 'appointment:updated',
  APPOINTMENT_CANCELLED: 'appointment:cancelled',
  APPOINTMENT_CONFIRMED: 'appointment:confirmed',
  APPOINTMENT_REMINDER: 'appointment:reminder',
  PROPERTY_UPDATED: 'property:updated',
  SLOT_UPDATED: 'slot:updated',
} as const;

const HEARTBEAT_INTERVAL_MS = 30_000;

interface WebSocketClient extends WebSocket {
  isAlive?: boolean;
}

@Injectable()
export class WebSocketService implements OnModuleDestroy {
  private readonly logger = new Logger(WebSocketService.name);
  private wss: WebSocketServer | null = null;
  private clients = new Map<string, AuthenticatedWsClient>();
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private initialized = false;

  constructor(private readonly jwtService: JwtService) {}

  init(httpServer: any) {
    if (this.initialized) return;
    this.initialized = true;

    this.wss = new WebSocketServer({ noServer: true });

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage, identity: { adminId: string | null; username: string | null }) => {
      const socket = ws as WebSocketClient;
      socket.isAlive = true;
      socket.on('pong', () => {
        socket.isAlive = true;
      });

      const clientId = identity.adminId || `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      this.clients.set(clientId, {
        ws: socket,
        adminId: identity.adminId,
        username: identity.username,
      });

      this.logger.log(`Client connected: ${clientId}${identity.username ? ` (${identity.username})` : ''}`);

      socket.on('message', (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.event === 'ping') {
            socket.send(JSON.stringify({ event: 'pong', data: { ts: Date.now() } }));
          }
        } catch {
          // Ignore malformed frames
        }
      });

      socket.on('close', () => {
        this.logger.log(`Client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });

      socket.on('error', (error) => {
        this.logger.error(`WebSocket error for client ${clientId}:`, error);
        this.clients.delete(clientId);
      });
    });

    httpServer.on('upgrade', (request: IncomingMessage, socket: Socket, head: Buffer) => {
      const url = new URL(request.url || '', 'http://localhost');
      if (url.pathname !== '/ws') {
        socket.destroy();
        return;
      }

      const identity = this.authenticate(request);
      if (!identity) {
        socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
        socket.destroy();
        return;
      }

      this.wss?.handleUpgrade(request, socket, head, (ws) => {
        this.wss?.emit('connection', ws, request, identity);
      });
    });

    this.heartbeatTimer = setInterval(() => {
      for (const [clientId, client] of this.clients) {
        const socket = client.ws as WebSocketClient;
        if (!socket.isAlive) {
          this.logger.warn(`Terminating stale client: ${clientId}`);
          socket.terminate();
          this.clients.delete(clientId);
          continue;
        }
        socket.isAlive = false;
        socket.ping();
      }
    }, HEARTBEAT_INTERVAL_MS);

    this.logger.log('WebSocket server initialized on /ws');
  }

  private authenticate(req: IncomingMessage): { adminId: string | null; username: string | null } | null {
    const url = new URL(req.url || '', 'http://localhost');
    const token = url.searchParams.get('token');
    if (!token) return null;

    try {
      const payload = this.jwtService.verify(token);
      if (payload.role !== 'admin') return null;
      return {
        adminId: payload.sub || payload.adminId || null,
        username: payload.username || null,
      };
    } catch (error) {
      this.logger.warn(`WebSocket authentication failed: ${(error as Error).message}`);
      return null;
    }
  }

  broadcast(event: string, data: any, targetAdminId?: string | null) {
    for (const [clientId, client] of this.clients) {
      if (targetAdminId && client.adminId !== targetAdminId) continue;
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({ event, data }));
      }
    }
  }

  sendToAdmin(event: string, data: any, adminId: string) {
    this.broadcast(event, data, adminId);
  }

  getConnectedClients() {
    return this.clients.size;
  }

  isInitialized() {
    return this.initialized;
  }

  onModuleDestroy() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    for (const [, client] of this.clients) {
      client.ws.close();
    }
    this.clients.clear();
    this.wss?.close();
    this.initialized = false;
  }
}