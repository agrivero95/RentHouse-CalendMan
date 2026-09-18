import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { EmailService } from './email/email.service';
import { fromISO } from '../../config/date.utils';
import { WebSocketService, WsEventTypes } from '../../gateway/websocket.service';

export interface NotificationData {
  appointmentId: string;
  recipientId: string;
  recipientType: 'CLIENT' | 'ADMIN';
  type: 'APPOINTMENT_REMINDER' | 'APPOINTMENT_CONFIRMED' | 'APPOINTMENT_CANCELLED' | 'SYSTEM';
  title: string;
  message: string;
}

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private websocketService: WebSocketService,
  ) {}

  async createNotification(data: NotificationData) {
    const notification = await this.prisma.notification.create({
      data: {
        ...data,
        status: 'PENDING',
      },
      include: { appointment: { include: { client: true } } },
    });

    if (data.recipientType === 'ADMIN') {
      this.websocketService.broadcast(WsEventTypes.ADMIN_NOTIFICATION, notification);
    }

    return notification;
  }

  async markAsSent(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'SENT', sentAt: new Date() },
    });
  }

  async markAsRead(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'READ', readAt: new Date() },
    });
  }

  async getUnreadNotifications(recipientId: string, recipientType: string) {
    return this.prisma.notification.findMany({
      where: {
        recipientId,
        recipientType,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
      include: { appointment: { include: { client: true, property: true } } },
    });
  }

  async getAllNotifications(recipientId: string, recipientType: string) {
    return this.prisma.notification.findMany({
      where: {
        recipientId,
        recipientType,
      },
      orderBy: { createdAt: 'desc' },
      include: { appointment: { include: { client: true, property: true } } },
    });
  }

  async getAdminNotifications() {
    return this.prisma.notification.findMany({
      where: { recipientType: 'ADMIN' },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { appointment: { include: { client: true, property: true } } },
    });
  }

  async getAppointmentNotifications(appointmentId: string) {
    return this.prisma.notification.findMany({
      where: { appointmentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async sendConfirmationReminder(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { client: true },
    });

    if (!appointment) throw new NotFoundException('Appointment not found');

    const pendingNotifications = await this.prisma.notification.findMany({
      where: {
        appointmentId,
        recipientId: appointment.clientId,
        recipientType: 'CLIENT',
        type: 'APPOINTMENT_REMINDER',
        status: 'SENT',
      },
    });

    for (const notification of pendingNotifications) {
      await this.emailService.sendAppointmentReminder(appointmentId);
      await this.markAsSent(notification.id);
    }
  }

  async getAppointmentsPendingConfirmation() {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        status: 'PENDING',
        dateSet: {
          gte: twoHoursAgo,
          lte: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        },
      },
      include: {
        client: true,
        property: true,
        notifications: {
          where: {
            type: 'APPOINTMENT_REMINDER',
            status: 'SENT',
          },
        },
      },
    });

    const thirtyMinFromNow = new Date(now.getTime() + 30 * 60 * 1000);
    return appointments.filter((apt) => {
      const [ah, am] = apt.timeSet.split(':').map(Number);
      const aptDateTime = new Date(apt.dateSet);
      aptDateTime.setHours(ah, am, 0, 0);
      return aptDateTime >= thirtyMinFromNow;
    });
  }
}
