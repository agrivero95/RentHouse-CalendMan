import { Module } from '@nestjs/common';
import { AppGateway } from './app.gateway';
import { WebSocketService } from './websocket.service';

@Module({
  providers: [AppGateway, WebSocketService],
  exports: [WebSocketService],
})
export class WebSocketModule {}
