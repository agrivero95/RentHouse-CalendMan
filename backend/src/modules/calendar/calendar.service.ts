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
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

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
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

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
    const startLocal = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
    const endLocal = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate(), 23, 59, 59, 999));

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
      orderBy: { date: 'asc' },
    });

    const appointmentSlots = await this.prisma.appointment.findMany({
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
      select: { timeSet: true, duration: true },
    });

    const occupiedSlots = new Map<string, number>();
    for (const apt of appointmentSlots) {
      const t = new Date(apt.timeSet);
      const key = `${t.getUTCFullYear()}-${t.getUTCMonth()}-${t.getUTCDate()}`;
      const end = new Date(t.getTime() + apt.duration * 60000);
      occupiedSlots.set(key, (occupiedSlots.get(key) || 0) + 1);
    }

    const dateMap = new Map<string, any>();
    for (const slot of slots) {
      const d = new Date(Date.UTC(slot.date.getUTCFullYear(), slot.date.getUTCMonth(), slot.date.getUTCDate()));
      const dateKey = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          date: d,
          day: d.getUTCDate(),
          month: d.getUTCMonth(),
          year: d.getUTCFullYear(),
          totalSlots: 0,
          bookedSlots: 0,
        });
      }

      dateMap.get(dateKey).totalSlots++;
    }

    for (const [dateKey, count] of occupiedSlots) {
      if (dateMap.has(dateKey)) {
        dateMap.get(dateKey).bookedSlots = count;
      }
    }

    const availableDays = Array.from(dateMap.values()).map((day: any) => ({
      ...day,
      hasAvailableSlots: day.totalSlots > day.bookedSlots,
    }));

    availableDays.sort((a, b) => {
      const dateA = new Date(Date.UTC(a.year, a.month, a.day));
      const dateB = new Date(Date.UTC(b.year, b.month, b.day));
      return dateA.getTime() - dateB.getTime();
    });

    return availableDays;
  }

  async createCustomSlots(propertyId: string, date: string, startTime: string, endTime: string, duration: number, type: 'AVAILABLE' | 'RESERVED' | 'BLOCKED') {
    const [year, month, day] = date.split('-').map(Number);
    const slotDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const start = new Date(Date.UTC(year, month - 1, day, sh, sm, 0, 0));
    const end = new Date(Date.UTC(year, month - 1, day, eh, em, 0, 0));

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
