import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { EmailService } from './email/email.service';
import { AppointmentReminderCron } from './cron/appointment-reminder.cron';
import { ScheduleModule } from '@nestjs/schedule';
import { WebSocketModule } from '@/gateway/websocket.module';

@Module({
  imports: [ScheduleModule.forRoot(), WebSocketModule],
  controllers: [NotificationController],
  providers: [NotificationService, EmailService, AppointmentReminderCron],
  exports: [NotificationService, EmailService],
})
export class NotificationModule {}
