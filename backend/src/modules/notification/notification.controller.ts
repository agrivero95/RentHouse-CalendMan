import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AdminGuard } from '../auth/admin.guard';

@Controller('notifications')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get('unread/:recipientId/:recipientType')
  getUnread(
    @Param('recipientId') recipientId: string,
    @Param('recipientType') recipientType: string,
  ) {
    return this.notificationService.getUnreadNotifications(recipientId, recipientType);
  }

  @Get('all/:recipientId/:recipientType')
  getAll(
    @Param('recipientId') recipientId: string,
    @Param('recipientType') recipientType: string,
  ) {
    return this.notificationService.getAllNotifications(recipientId, recipientType);
  }

  @Put('read/:id')
  @UseGuards(AdminGuard)
  markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }

  @Get('admin')
  @UseGuards(AdminGuard)
  getAdminNotifications() {
    return this.notificationService.getAdminNotifications();
  }

  @Get('appointment/:appointmentId')
  getAppointmentNotifications(@Param('appointmentId') appointmentId: string) {
    return this.notificationService.getAppointmentNotifications(appointmentId);
  }

  @Get('pending-confirmation')
  @UseGuards(AdminGuard)
  getAppointmentsPendingConfirmation() {
    return this.notificationService.getAppointmentsPendingConfirmation();
  }

  @Post('send-reminder/:appointmentId')
  @UseGuards(AdminGuard)
  sendConfirmationReminder(@Param('appointmentId') appointmentId: string) {
    return this.notificationService.sendConfirmationReminder(appointmentId);
  }
}
