import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentService {
  constructor(private prisma: PrismaService) {}

  async create(createAppointmentDto: CreateAppointmentDto) {
    return this.prisma.appointment.create({ data: createAppointmentDto });
  }

  async findAll() {
    return this.prisma.appointment.findMany({
      include: { client: true, property: true },
      orderBy: { dateSet: 'desc' },
    });
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { client: true, property: true },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto) {
    await this.findOne(id);
    return this.prisma.appointment.update({ where: { id }, data: updateAppointmentDto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.appointment.delete({ where: { id } });
  }

  async findByPropertyId(propertyId: string, startDate: Date, endDate: Date) {
    return this.prisma.appointment.findMany({
      where: {
        propertyId,
        dateSet: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: { client: true },
      orderBy: { timeSet: 'asc' },
    });
  }

  async findByClientId(clientId: string, startDate: Date, endDate: Date) {
    return this.prisma.appointment.findMany({
      where: {
        clientId,
        dateSet: {
          gte: startDate,
          lte: endDate,
        },
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
        dateSet: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: { timeSet: true, duration: true },
      orderBy: { timeSet: 'asc' },
    });

    const occupiedSlots = appointments.map((apt) => ({
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
            (slotStart <= occupied.start && slotEnd >= occupied.end)
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

    return slots;
  }
}
