import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { EmailService } from '../notification/email/email.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class AppointmentService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private notificationService: NotificationService,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto) {
    const appointment = await this.prisma.appointment.create({
      data: createAppointmentDto,
      include: { client: true, property: true },
    });

    await this.prisma.confirmationToken.create({
      data: {
        appointmentId: appointment.id,
        token: this.generateConfirmationToken(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await this.emailService.sendBookingConfirmation(appointment.id);

    await this.notificationService.createNotification({
      appointmentId: appointment.id,
      recipientId: appointment.clientId,
      recipientType: 'CLIENT',
      type: 'SYSTEM',
      title: 'Cita Agendada',
      message: `Su cita ha sido agendada para ${new Date(appointment.dateSet).toLocaleDateString()}`,
    });

    return appointment;
  }

  private generateConfirmationToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async findAll() {
    return this.prisma.appointment.findMany({
      include: {
        client: true,
        property: true,
        notifications: {
          where: { status: 'SENT' },
          take: 1,
        },
      },
      orderBy: { dateSet: 'desc' },
    });
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        client: true,
        property: true,
        notifications: { orderBy: { createdAt: 'desc' } },
        confirmationToken: true,
      },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto) {
    await this.findOne(id);
    return this.prisma.appointment.update({
      where: { id },
      data: updateAppointmentDto,
      include: { client: true, property: true },
    });
  }

  async remove(id: string) {
    const appointment = await this.findOne(id);
    await this.prisma.appointment.delete({ where: { id } });

    await this.notificationService.createNotification({
      appointmentId: id,
      recipientId: appointment.clientId,
      recipientType: 'CLIENT',
      type: 'APPOINTMENT_CANCELLED',
      title: 'Cita Cancelada',
      message: `Su cita del ${new Date(appointment.dateSet).toLocaleDateString()} ha sido cancelada`,
    });

    return { deleted: true, id };
  }

  async findByPropertyId(propertyId: string, startDate: Date, endDate: Date) {
    return this.prisma.appointment.findMany({
      where: {
        propertyId,
        dateSet: { gte: startDate, lte: endDate },
      },
      include: { client: true },
      orderBy: { timeSet: 'asc' },
    });
  }

  async findByClientId(clientId: string, startDate: Date, endDate: Date) {
    return this.prisma.appointment.findMany({
      where: {
        clientId,
        dateSet: { gte: startDate, lte: endDate },
      },
      include: { property: true },
      orderBy: { dateSet: 'asc' },
    });
  }

  async findAvailableSlots(propertyId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        propertyId,
        dateSet: { gte: startOfDay, lte: endOfDay },
      },
      select: { timeSet: true, duration: true, status: true },
      orderBy: { timeSet: 'asc' },
    });

    const occupiedSlots = appointments
      .filter((apt) => apt.status !== 'CANCELLED')
      .map((apt) => ({
        start: apt.timeSet,
        end: new Date(new Date(apt.timeSet).getTime() + apt.duration * 60000),
      }));

    const businessHours = [
      { start: 9, end: 12 },
      { start: 14, end: 18 },
    ];

    const slots: any[] = [];

    for (const hours of businessHours) {
      let currentHour = hours.start;
      while (currentHour < hours.end) {
        const slotStart = new Date(date);
        slotStart.setHours(currentHour, 0, 0, 0);
        const slotEnd = new Date(date);
        slotEnd.setHours(currentHour + 1, 0, 0, 0);

        const isOccupied = occupiedSlots.some(
          (occupied) =>
            (slotStart >= occupied.start && slotStart < occupied.end) ||
            (slotEnd > occupied.start && slotEnd <= occupied.end) ||
            (slotStart <= occupied.start && slotEnd >= occupied.end),
        );

        if (!isOccupied) {
          slots.push({
            start: slotStart,
            end: slotEnd,
            available: true,
          });
        }

        currentHour++;
      }
    }

    return { slots, appointments };
  }

  async confirmAppointment(token: string) {
    const confirmationToken = await this.prisma.confirmationToken.findUnique({
      where: { token },
      include: { appointment: { include: { client: true, property: true } } },
    });

    if (!confirmationToken) {
      throw new NotFoundException('Token de confirmación inválido');
    }

    if (confirmationToken.expiresAt < new Date()) {
      throw new BadRequestException('Token de confirmación expirado');
    }

    if (confirmationToken.usedAt) {
      throw new BadRequestException('Token ya utilizado');
    }

    await this.prisma.$transaction([
      this.prisma.appointment.update({
        where: { id: confirmationToken.appointmentId },
        data: { status: 'CONFIRMED' },
      }),
      this.prisma.confirmationToken.update({
        where: { id: confirmationToken.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.notification.create({
        data: {
          appointmentId: confirmationToken.appointmentId,
          recipientId: confirmationToken.appointment.clientId,
          recipientType: 'CLIENT',
          type: 'APPOINTMENT_CONFIRMED',
          title: 'Cita Confirmada',
          message: 'Su asistencia ha sido confirmada exitosamente',
          status: 'SENT',
          sentAt: new Date(),
        },
      }),
      this.prisma.notification.create({
        data: {
          appointmentId: confirmationToken.appointmentId,
          recipientId: 'admin',
          recipientType: 'ADMIN',
          type: 'APPOINTMENT_CONFIRMED',
          title: 'Cita Confirmada por Cliente',
          message: `El cliente ${confirmationToken.appointment.client.name} ha confirmado su cita`,
          status: 'SENT',
          sentAt: new Date(),
        },
      }),
    ]);

    await this.emailService.sendConfirmationEmail(confirmationToken.appointmentId);

    return {
      success: true,
      message: 'Cita confirmada exitosamente',
      appointment: confirmationToken.appointment,
    };
  }
}
