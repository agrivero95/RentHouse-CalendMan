import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { EmailService } from '../notification/email/email.service';
import { NotificationService } from '../notification/notification.service';
import { toISO, fromISO } from '../../config/date.utils';

@Injectable()
export class AppointmentService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private notificationService: NotificationService,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto) {
    let dateStr = createAppointmentDto.dateSet;
    const timeSet = createAppointmentDto.timeSet;

    if (dateStr.length === 10 && dateStr[4] === '-' && dateStr[7] === '-') {
      dateStr = fromISO(dateStr);
    }

    const dateISO = toISO(dateStr);

    const timeSlot = await this.prisma.timeSlot.findFirst({
      where: {
        propertyId: createAppointmentDto.propertyId,
        date: dateStr,
        startTime: timeSet,
      },
    });

    if (!timeSlot) {
      throw new BadRequestException('No existe un slot disponible para este horario en la propiedad seleccionada');
    }

    if (timeSlot.type !== 'AVAILABLE') {
      throw new BadRequestException('El slot seleccionado ya no está disponible');
    }

    const overlappingAppointment = await this.prisma.appointment.findFirst({
      where: {
        propertyId: createAppointmentDto.propertyId,
        dateSet: new Date(dateISO + 'T00:00:00'),
        status: { not: 'CANCELLED' },
        timeSet: timeSet,
      },
    });

    if (overlappingAppointment) {
      throw new BadRequestException('Este slot ya fue reservado por otro cliente');
    }

    const existingAppointmentToday = await this.prisma.appointment.findFirst({
      where: {
        clientId: createAppointmentDto.clientId,
        propertyId: createAppointmentDto.propertyId,
        dateSet: new Date(dateISO + 'T00:00:00'),
        status: { not: 'CANCELLED' },
      },
    });

    if (existingAppointmentToday) {
      throw new BadRequestException('Ya tiene una cita agendada para esta propiedad en la fecha seleccionada');
    }

    const duration = createAppointmentDto.duration || 15;

    const appointment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.appointment.create({
        data: {
          clientId: createAppointmentDto.clientId,
          propertyId: createAppointmentDto.propertyId,
          dateSet: new Date(dateISO + 'T00:00:00'),
          timeSet: timeSet,
          duration,
          notes: createAppointmentDto.notes,
        },
        include: { client: true, property: true },
      });

      await tx.timeSlot.update({
        where: { id: timeSlot.id },
        data: { type: 'RESERVED' },
      });

      return created;
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
        confirmationTokens: true,
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

  async cancelAppointment(id: string) {
    const appointment = await this.findOne(id);

    if (appointment.status === 'CANCELLED') {
      throw new BadRequestException('La cita ya está cancelada');
    }

    const aptDate = (appointment.dateSet instanceof Date ? appointment.dateSet : new Date(appointment.dateSet)).toISOString().split('T')[0];
    const dateDB = fromISO(aptDate);

    const timeSlot = await this.prisma.timeSlot.findFirst({
      where: {
        propertyId: appointment.propertyId,
        date: dateDB,
        startTime: appointment.timeSet,
      },
    });

    await this.prisma.$transaction([
      this.prisma.appointment.update({
        where: { id },
        data: { status: 'CANCELLED' },
      }),
    ]);

    await this.notificationService.createNotification({
      appointmentId: id,
      recipientId: appointment.clientId,
      recipientType: 'CLIENT',
      type: 'APPOINTMENT_CANCELLED',
      title: 'Cita Cancelada',
      message: `Su cita del ${new Date(appointment.dateSet).toLocaleDateString()} ha sido cancelada`,
    });

    if (timeSlot) {
      await this.prisma.timeSlot.update({
        where: { id: timeSlot.id },
        data: { type: 'AVAILABLE' },
      });
    }

    return { cancelled: true, id };
  }

  async remove(id: string) {
    const appointment = await this.findOne(id);

    const aptDate = (appointment.dateSet instanceof Date ? appointment.dateSet : new Date(appointment.dateSet)).toISOString().split('T')[0];
    const dateDB = fromISO(aptDate);

    const timeSlot = await this.prisma.timeSlot.findFirst({
      where: {
        propertyId: appointment.propertyId,
        date: dateDB,
        startTime: appointment.timeSet,
      },
    });

    if (appointment.status !== 'CANCELLED') {
      await this.notificationService.createNotification({
        appointmentId: id,
        recipientId: appointment.clientId,
        recipientType: 'CLIENT',
        type: 'SYSTEM',
        title: 'Cita Eliminada',
        message: `Su cita del ${new Date(appointment.dateSet).toLocaleDateString()} ha sido eliminada`,
      });
    }

    await this.prisma.appointment.delete({ where: { id } });

    if (timeSlot && timeSlot.type !== 'AVAILABLE') {
      await this.prisma.timeSlot.update({
        where: { id: timeSlot.id },
        data: { type: 'AVAILABLE' },
      });
    }

    return { deleted: true, id };
  }

  async findByPropertyId(propertyId: string, startDate: string, endDate: string) {
    return this.prisma.appointment.findMany({
      where: {
        propertyId,
        dateSet: {
          gte: new Date(startDate + 'T00:00:00'),
          lte: new Date(endDate + 'T23:59:59'),
        },
      },
      include: { client: true },
      orderBy: { timeSet: 'asc' },
    });
  }

  async findByClientId(clientId: string, startDate: string, endDate: string) {
    return this.prisma.appointment.findMany({
      where: {
        clientId,
        dateSet: {
          gte: new Date(startDate + 'T00:00:00'),
          lte: new Date(endDate + 'T23:59:59'),
        },
      },
      include: { property: true },
      orderBy: { dateSet: 'asc' },
    });
  }

  async findAvailableSlots(propertyId: string, date: string) {
    const slots = await this.prisma.timeSlot.findMany({
      where: {
        propertyId,
        date,
      },
      orderBy: { startTime: 'asc' },
    });

    const dateISO = toISO(date);
    const appointments = await this.prisma.appointment.findMany({
      where: {
        propertyId,
        dateSet: {
          gte: new Date(dateISO + 'T00:00:00'),
          lte: new Date(dateISO + 'T23:59:59'),
        },
      },
      select: { timeSet: true, duration: true, status: true },
      orderBy: { timeSet: 'asc' },
    });

    const occupiedSlots = appointments
      .filter((apt) => apt.status !== 'CANCELLED')
      .map((apt) => ({
        start: apt.timeSet,
        end: this.addMinutes(apt.timeSet, apt.duration),
      }));

    const resultSlots = slots
      .filter((slot) => slot.type === 'AVAILABLE')
      .map((slot) => {
        const isOccupied = occupiedSlots.some(
          (occupied) =>
            (slot.startTime >= occupied.start && slot.startTime < occupied.end) ||
            (slot.endTime > occupied.start && slot.endTime <= occupied.end) ||
            (slot.startTime <= occupied.start && slot.endTime >= occupied.end),
        );

        return {
          start: slot.startTime,
          end: slot.endTime,
          available: !isOccupied,
          id: slot.id,
        };
      })
      .filter((slot) => slot.available);

    return { slots: resultSlots, appointments };
  }

  private addMinutes(time: string, minutes: number): string {
    const [h, m] = time.split(':').map(Number);
    let newH = h + Math.floor((m + minutes) / 60);
    let newM = (m + minutes) % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
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
