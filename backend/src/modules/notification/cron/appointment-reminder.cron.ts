import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/config/prisma.service';
import { EmailService } from '../email/email.service';
import { fromISO } from '@/config/date.utils';

@Injectable()
export class AppointmentReminderCron implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AppointmentReminderCron.name);
  private checkedAppointments = new Set<string>();

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  onModuleInit() {
    this.logger.log('Appointment Reminder Cron initialized');
  }

  onModuleDestroy() {
    this.checkedAppointments.clear();
  }

  @Cron('*/5 * * * *')
  async handleReminders() {
    this.logger.log('Running appointment reminder check...');

    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
    const twoHoursFromNow = new Date(now.getTime() + 120 * 60 * 1000);

    const upcomingAppointments = await this.prisma.appointment.findMany({
      where: {
        status: 'PENDING',
        dateSet: {
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          lte: twoHoursFromNow,
        },
      },
      include: {
        client: true,
        property: true,
      },
    });

    for (const appointment of upcomingAppointments) {
      if (this.checkedAppointments.has(appointment.id)) {
        continue;
      }

      const [ah, am] = appointment.timeSet.split(':').map(Number);
      const appointmentDateTime = new Date(appointment.dateSet);
      appointmentDateTime.setHours(ah, am, 0, 0);

      if (appointmentDateTime >= thirtyMinutesFromNow && appointmentDateTime <= twoHoursFromNow) {
        this.logger.log(`Sending reminder for appointment ${appointment.id}`);
        
        const success = await this.emailService.sendAppointmentReminder(appointment.id);
        
        if (success) {
          this.checkedAppointments.add(appointment.id);
          
          await this.prisma.notification.create({
            data: {
              appointmentId: appointment.id,
              recipientId: appointment.clientId,
              recipientType: 'CLIENT',
              type: 'APPOINTMENT_REMINDER',
              title: 'Recordatorio de Cita',
              message: `Su cita es en 30 minutos: ${appointment.timeSet}`,
              status: 'SENT',
              sentAt: new Date(),
            },
          });

          this.logger.log(`Reminder sent successfully for appointment ${appointment.id}`);
        } else {
          this.logger.error(`Failed to send reminder for appointment ${appointment.id}`);
        }
      }
    }

    const oldChecked = Date.now() - 5 * 60 * 1000;
    for (const id of this.checkedAppointments) {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id },
      });
      if (appointment) {
        const [ah, am] = appointment.timeSet.split(':').map(Number);
        const aptDateTime = new Date(appointment.dateSet);
        aptDateTime.setHours(ah, am, 0, 0);
        if (aptDateTime.getTime() < oldChecked) {
          this.checkedAppointments.delete(id);
        }
      }
    }
  }

  @Cron('0 * * * *')
  async cleanupExpiredTokens() {
    this.logger.log('Cleaning up expired confirmation tokens...');
    
    await this.prisma.confirmationToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
        usedAt: null,
      },
    });

    this.logger.log('Expired tokens cleaned up');
  }
}
