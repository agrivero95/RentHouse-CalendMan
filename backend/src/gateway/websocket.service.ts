import { Injectable, Logger } from '@nestjs/common';
import { WebSocket } from 'ws';
import { IncomingMessage } from 'http';

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

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);
  private wss: import('ws').Server | null = null;
  private clients = new Map<string, AuthenticatedWsClient>();

  init(httpServer: any) {
    this.wss = new (require('ws').Server)({
      noServer: true,
    });

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const url = new URL(req.url || '', 'http://localhost');
      const token = url.searchParams.get('token');

      let adminId: string | null = null;
      let username: string | null = null;

      if (token) {
        try {
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          adminId = payload.adminId || payload.sub || null;
          username = payload.username || null;
        } catch {
          this.logger.warn('Invalid WebSocket token');
        }
      }

      const clientId = adminId || `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      this.clients.set(clientId, { ws, adminId, username });

      this.logger.log(`Client connected: ${clientId}${username ? ` (${username})` : ''}`);

      ws.on('close', () => {
        this.logger.log(`Client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });

      ws.on('error', (error) => {
        this.logger.error(`WebSocket error for client ${clientId}:`, error);
        this.clients.delete(clientId);
      });
    });

    httpServer.on('upgrade', (request: IncomingMessage, socket: import('net').Socket, head: Buffer) => {
      const url = new URL(request.url || '', 'http://localhost');
      if (url.pathname === '/ws') {
        this.wss?.handleUpgrade(request, socket, head, (ws) => {
          this.wss?.emit('connection', ws, request);
        });
      }
    });

    this.logger.log('WebSocket server initialized on /ws');
  }

  broadcast(event: string, data: any, targetAdminId?: string | null) {
    for (const [clientId, client] of this.clients) {
      if (targetAdminId && client.adminId !== targetAdminId) continue;
      if (client.ws.readyState === 1) {
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
}
