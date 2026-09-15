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
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

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
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

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
    const slots = await this.prisma.timeSlot.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    const appointments = await this.prisma.appointment.findMany({
      where: {
        dateSet: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: { id: true, dateSet: true, timeSet: true, duration: true, clientId: true, propertyId: true },
    });

    return {
      slots,
      appointments,
    };
  }

  async createCustomSlots(propertyId: string, date: string, startTime: string, endTime: string, duration: number, type: 'AVAILABLE' | 'RESERVED' | 'BLOCKED') {
    const slotDate = new Date(date);
    slotDate.setHours(0, 0, 0, 0);

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
