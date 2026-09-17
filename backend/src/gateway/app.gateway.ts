import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'ws';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  path: '/ws',
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
    credentials: true,
  },
})
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(AppGateway.name);

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: any, ...args: any[]) {
    this.logger.log('Client connected');
  }

  handleDisconnect(client: any) {
    this.logger.log('Client disconnected');
  }

  @SubscribeMessage('ping')
  handlePing(client: any, payload: any) {
    return { event: 'pong', data: { timestamp: Date.now() } };
  }
}
