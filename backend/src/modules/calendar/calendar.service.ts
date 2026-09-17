import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateTimeSlotDto } from './dto/create-time-slot.dto';
import { UpdateTimeSlotDto } from './dto/update-time-slot.dto';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async findAllSlots() {
    return this.prisma.timeSlot.findMany({
      include: { property: true },
      orderBy: { date: 'desc' },
    });
  }

  async findSlotsByProperty(propertyId: string, startDate: Date, endDate: Date) {
    return this.prisma.timeSlot.findMany({
      where: {
        propertyId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async createSlot(createTimeSlotDto: CreateTimeSlotDto) {
    return this.prisma.timeSlot.create({ data: createTimeSlotDto });
  }

  async updateSlot(id: string, updateTimeSlotDto: UpdateTimeSlotDto) {
    await this.findOneSlot(id);
    return this.prisma.timeSlot.update({ where: { id }, data: updateTimeSlotDto });
  }

  async removeSlot(id: string) {
    await this.findOneSlot(id);
    return this.prisma.timeSlot.delete({ where: { id } });
  }

  async blockPropertySlots(propertyId: string, date: Date, type: 'RESERVED' | 'BLOCKED') {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const startOfDay = new Date(year, month, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month, day, 23, 59, 59, 999);

    return this.prisma.timeSlot.upsert({
      where: {
        propertyId_date_startTime: {
          propertyId,
          date: startOfDay,
          startTime: startOfDay,
        },
      },
      create: {
        propertyId,
        date: startOfDay,
        startTime: startOfDay,
        endTime: endOfDay,
        type,
      },
      update: { type },
    });
  }

  async getAvailableSlots(propertyId: string, date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const startOfDay = new Date(year, month, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month, day, 23, 59, 59, 999);

    const slots = await this.prisma.timeSlot.findMany({
      where: {
        propertyId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { startTime: 'asc' },
    });

    const appointments = await this.prisma.appointment.findMany({
      where: {
        propertyId,
        dateSet: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: { timeSet: true, duration: true },
    });

    return {
      slots,
      appointments,
    };
  }

  async getMonthSlots(startDate: Date, endDate: Date) {
    const startLocal = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endLocal = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);

    const slots = await this.prisma.timeSlot.findMany({
      where: {
        date: {
          gte: startLocal,
          lte: endLocal,
        },
      },
      orderBy: { date: 'asc' },
    });

    const appointments = await this.prisma.appointment.findMany({
      where: {
        dateSet: {
          gte: startLocal,
          lte: endLocal,
        },
      },
      select: { id: true, dateSet: true, timeSet: true, duration: true, clientId: true, propertyId: true },
    });

    return {
      slots,
      appointments,
    };
  }

  async getAvailableDays(propertyId: string, startDate: Date, endDate: Date) {
    const slots = await this.prisma.timeSlot.findMany({
      where: {
        propertyId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        type: 'AVAILABLE',
      },
      select: { date: true },
      distinct: ['date'],
    });

    const appointmentDates = await this.prisma.appointment.findMany({
      where: {
        propertyId,
        dateSet: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          not: 'CANCELLED',
        },
      },
      select: { dateSet: true },
      distinct: ['dateSet'],
    });

    const bookedDates = new Set(appointmentDates.map((apt) => {
      const d = new Date(apt.dateSet.getFullYear(), apt.dateSet.getMonth(), apt.dateSet.getDate());
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }));

    const availableDays = slots
      .map((slot) => {
        const d = new Date(slot.date.getFullYear(), slot.date.getMonth(), slot.date.getDate());
        return {
          date: slot.date,
          day: d.getDate(),
          month: d.getMonth(),
          year: d.getFullYear(),
          hasAvailableSlots: !bookedDates.has(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`),
        };
      });

    return availableDays;
  }

  async createCustomSlots(propertyId: string, date: string, startTime: string, endTime: string, duration: number, type: 'AVAILABLE' | 'RESERVED' | 'BLOCKED') {
    const [year, month, day] = date.split('-').map(Number);
    const slotDate = new Date(year, month - 1, day, 0, 0, 0, 0);

    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    const createdSlots: any[] = [];
    const durationMs = duration * 60 * 1000;

    let current = new Date(start);
    while (current.getTime() + durationMs <= end.getTime()) {
      const slotEnd = new Date(current.getTime() + durationMs);

      const existing = await this.prisma.timeSlot.findUnique({
        where: {
          propertyId_date_startTime: {
            propertyId,
            date: slotDate,
            startTime: current,
          },
        },
      });

      if (existing) {
        await this.prisma.timeSlot.update({
          where: { id: existing.id },
          data: { type, endTime: slotEnd },
        });
        createdSlots.push(await this.prisma.timeSlot.update({
          where: { id: existing.id },
          data: { type, endTime: slotEnd },
        }));
      } else {
        const created = await this.prisma.timeSlot.create({
          data: {
            propertyId,
            date: slotDate,
            startTime: current,
            endTime: slotEnd,
            type,
          },
        });
        createdSlots.push(created);
      }

      current = new Date(slotEnd);
    }

    return createdSlots;
  }

  private async findOneSlot(id: string) {
    const slot = await this.prisma.timeSlot.findUnique({ where: { id } });
    if (!slot) throw new NotFoundException('Time slot not found');
    return slot;
  }
}
