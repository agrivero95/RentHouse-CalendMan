import { Module } from '@nestjs/common';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { EmailService } from '../notification/email/email.service';
import { NotificationService } from '../notification/notification.service';
import { WebSocketModule } from '../../gateway/websocket.module';

@Module({
  imports: [WebSocketModule],
  controllers: [AppointmentController],
  providers: [AppointmentService, EmailService, NotificationService],
  exports: [AppointmentService],
})
export class AppointmentModule {}
