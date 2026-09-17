import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WebSocketService } from './gateway/websocket.service';

async function bootstrap() {
  const httpServer = require('http').createServer();
  const app = await NestFactory.create(AppModule, httpServer);

  const corsOrigin = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'];
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  app.setGlobalPrefix(process.env.API_PREFIX || 'api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('RentHouse CalendMan API')
    .setDescription('Property Rent Management Calendar System API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const websocketService = app.get(WebSocketService);
  websocketService.init(httpServer);

  const port = process.env.PORT || 3000;
  await httpServer.listen(port);
  console.log(`Backend running on http://localhost:${port}`);
  console.log(`WebSocket on ws://localhost:${port}/ws`);
  console.log(`Swagger docs on http://localhost:${port}/api/docs`);
}

bootstrap();
