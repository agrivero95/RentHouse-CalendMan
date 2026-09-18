import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateTimeSlotDto } from './dto/create-time-slot.dto';
import { UpdateTimeSlotDto } from './dto/update-time-slot.dto';
import { toISO, fromISO } from '../../config/date.utils';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async findAllSlots() {
    return this.prisma.timeSlot.findMany({
      include: { property: true },
      orderBy: { date: 'desc' },
    });
  }

  async findSlotsByProperty(propertyId: string, startDate: string, endDate: string) {
    // startDate/endDate vienen del frontend como YYYY-MM-DD
    const startDB = fromISO(startDate);
    const endDB = fromISO(endDate);
    return this.prisma.timeSlot.findMany({
      where: {
        propertyId,
        date: {
          gte: startDB,
          lte: endDB,
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

  async blockPropertySlots(propertyId: string, date: string, type: 'RESERVED' | 'BLOCKED') {
    const slots = await this.prisma.timeSlot.findMany({
      where: { propertyId, date },
    });

    const created: any[] = [];
    for (const slot of slots) {
      if (slot.date === date) {
        await this.prisma.timeSlot.update({
          where: { id: slot.id },
          data: { type },
        });
        created.push(slot);
      }
    }

    return created;
  }

  async getAvailableSlots(propertyId: string, date: string) {
    const dateISO = toISO(date);

    const slots = await this.prisma.timeSlot.findMany({
      where: {
        propertyId,
        date,
      },
      orderBy: { startTime: 'asc' },
    });

    const appointments = await this.prisma.appointment.findMany({
      where: {
        propertyId,
        dateSet: {
          gte: new Date(dateISO + 'T00:00:00'),
          lte: new Date(dateISO + 'T23:59:59'),
        },
      },
      select: { timeSet: true, duration: true },
    });

    return {
      slots,
      appointments,
    };
  }

  async getMonthSlots(startDate: string, endDate: string) {
    // startDate/endDate vienen del frontend como YYYY-MM-DD
    const startDB = fromISO(startDate);
    const endDB = fromISO(endDate);
    const startISO = startDate;
    const endISO = endDate;

    const allSlots = await this.prisma.timeSlot.findMany({ orderBy: { date: 'asc' } });
    const slots = allSlots.filter((s: any) => s.date >= startDB && s.date <= endDB);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        dateSet: {
          gte: new Date(startISO + 'T00:00:00'),
          lte: new Date(endISO + 'T23:59:59'),
        },
      },
      select: { id: true, dateSet: true, timeSet: true, duration: true, clientId: true, propertyId: true },
    });

    return {
      slots,
      appointments,
    };
  }

  async getAvailableDays(propertyId: string, startDate: string, endDate: string) {
    // startDate/endDate come del frontend como YYYY-MM-DD (ISO)
    const startISODate = new Date(startDate + 'T00:00:00');
    const endISODate = new Date(endDate + 'T23:59:59');

    if (isNaN(startISODate.getTime()) || isNaN(endISODate.getTime())) {
      return [];
    }

    const allSlots = await this.prisma.timeSlot.findMany({
      where: {
        propertyId,
        type: 'AVAILABLE',
      },
      orderBy: { date: 'asc' },
    });

    const appointmentSlots = await this.prisma.appointment.findMany({
      where: {
        propertyId,
        dateSet: {
          gte: startISODate,
          lte: endISODate,
        },
        status: {
          not: 'CANCELLED',
        },
      },
      select: { timeSet: true, duration: true, dateSet: true },
    });

    const dbToISO = toISO;

    const dateMap = new Map<string, any>();
    for (const slot of allSlots) {
      const isoDate = dbToISO(slot.date);
      const slotDate = new Date(isoDate + 'T00:00:00');
      if (slotDate < startISODate || slotDate > endISODate) {
        continue;
      }
      if (!dateMap.has(isoDate)) {
        const slotParts = slot.date.split('-').map(Number);
        const [d, m, y] = slotParts;
        dateMap.set(isoDate, {
          isoDate,
          day: d,
          month: m,
          year: y,
          totalSlots: 0,
          bookedSlots: 0,
        });
      }
      dateMap.get(isoDate).totalSlots++;
    }

    const occupiedByISO = new Map<string, number>();
    for (const apt of appointmentSlots) {
      const aptISO = (apt.dateSet instanceof Date ? apt.dateSet : new Date(apt.dateSet)).toISOString().split('T')[0];
      occupiedByISO.set(aptISO, (occupiedByISO.get(aptISO) || 0) + 1);
    }

    for (const [isoDate, count] of occupiedByISO) {
      if (dateMap.has(isoDate)) {
        dateMap.get(isoDate).bookedSlots = count;
      }
    }

    const availableDays = Array.from(dateMap.values()).map((day: any) => ({
      ...day,
      dateStr: day.isoDate,
      hasAvailableSlots: day.totalSlots > day.bookedSlots,
    }));

    availableDays.sort((a, b) => a.isoDate.localeCompare(b.isoDate));

    return availableDays;
  }

  async createCustomSlots(propertyId: string, date: string, startTime: string, endTime: string, duration: number, type: 'AVAILABLE' | 'RESERVED' | 'BLOCKED') {
    const parts = date.split('-').map(Number);
    const [d, m, y] = parts;
    const dateStr = `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}`;

    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);

    const createdSlots: any[] = [];
    const startTotal = sh * 60 + sm;
    const endTotal = eh * 60 + em;
    let currentTotal = startTotal;

    while (currentTotal < endTotal) {
      const startTotalFormatted = currentTotal;
      const endTotalFormatted = Math.min(currentTotal + duration, endTotal);
      const startHour = Math.floor(startTotalFormatted / 60);
      const startMinute = startTotalFormatted % 60;
      const endHour = Math.floor(endTotalFormatted / 60);
      const endMinute = endTotalFormatted % 60;
      const start = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;
      const end = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;

      const existing = await this.prisma.timeSlot.findUnique({
        where: {
          propertyId_date_startTime: {
            propertyId,
            date: dateStr,
            startTime: start,
          },
        },
      });

      if (existing) {
        const updated = await this.prisma.timeSlot.update({
          where: { id: existing.id },
          data: { type, endTime: end },
        });
        createdSlots.push(updated);
      } else {
        const created = await this.prisma.timeSlot.create({
          data: {
            propertyId,
            date: dateStr,
            startTime: start,
            endTime: end,
            type,
          },
        });
        createdSlots.push(created);
      }

      currentTotal += duration;
    }

    return createdSlots;
  }

  private async findOneSlot(id: string) {
    const slot = await this.prisma.timeSlot.findUnique({ where: { id } });
    if (!slot) throw new NotFoundException('Time slot not found');
    return slot;
  }
}
