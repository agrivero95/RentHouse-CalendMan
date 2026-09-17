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

  async findSlotsByProperty(propertyId: string, startDate: string, endDate: string) {
    const toISO = (ddmmYYYY: string): string => {
      const [d, m, y] = ddmmYYYY.split('-').map(Number);
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    };
    return this.prisma.timeSlot.findMany({
      where: {
        propertyId,
        date: {
          gte: toISO(startDate),
          lte: toISO(endDate),
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
          gte: new Date(date + 'T00:00:00'),
          lte: new Date(date + 'T23:59:59'),
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
    const toISO = (ddmmYYYY: string): string => {
      const [d, m, y] = ddmmYYYY.split('-').map(Number);
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    };
    const startISO = toISO(startDate);
    const endISO = toISO(endDate);

    const slots = await this.prisma.timeSlot.findMany({
      where: {
        date: {
          gte: startISO,
          lte: endISO,
        },
      },
      orderBy: { date: 'asc' },
    });

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
    const toISO = (ddmmYYYY: string): string => {
      const [d, m, y] = ddmmYYYY.split('-').map(Number);
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    };

    const slots = await this.prisma.timeSlot.findMany({
      where: {
        propertyId,
        date: {
          gte: (() => { const [d, m, y] = startDate.split('-').map(Number); return `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}`; })(),
          lte: (() => { const [d, m, y] = endDate.split('-').map(Number); return `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}`; })(),
        },
        type: 'AVAILABLE',
      },
      orderBy: { date: 'asc' },
    });

    const appointmentSlots = await this.prisma.appointment.findMany({
      where: {
        propertyId,
        dateSet: {
          gte: new Date(toISO(startDate) + 'T00:00:00'),
          lte: new Date(toISO(endDate) + 'T23:59:59'),
        },
        status: {
          not: 'CANCELLED',
        },
      },
      select: { timeSet: true, duration: true, dateSet: true },
    });

    const dateMap = new Map<string, any>();
    for (const slot of slots) {
      if (!dateMap.has(slot.date)) {
        dateMap.set(slot.date, {
          date: slot.date,
          day: parseInt(slot.date.split('-')[0]),
          month: parseInt(slot.date.split('-')[1]),
          year: parseInt(slot.date.split('-')[2]),
          totalSlots: 0,
          bookedSlots: 0,
        });
      }
      dateMap.get(slot.date).totalSlots++;
    }

    const occupiedByDate = new Map<string, number>();
    for (const apt of appointmentSlots) {
      const aptDate = apt.dateSet.toISOString().split('T')[0];
      occupiedByDate.set(aptDate, (occupiedByDate.get(aptDate) || 0) + 1);
    }

    for (const [dateKey, count] of occupiedByDate) {
      if (dateMap.has(dateKey)) {
        dateMap.get(dateKey).bookedSlots = count;
      }
    }

    const availableDays = Array.from(dateMap.values()).map((day: any) => ({
      ...day,
      dateStr: day.date,
      hasAvailableSlots: day.totalSlots > day.bookedSlots,
    }));

    availableDays.sort((a, b) => a.date.localeCompare(b.date));

    return availableDays;
  }

  async createCustomSlots(propertyId: string, date: string, startTime: string, endTime: string, duration: number, type: 'AVAILABLE' | 'RESERVED' | 'BLOCKED') {
    const [day, month, year] = date.split('-').map(Number);
    const dateStr = `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;

    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);

    const createdSlots: any[] = [];
    let currentHour = sh;
    let currentMinute = sm;

    while (currentHour < eh || (currentHour === eh && currentMinute < em)) {
      const start = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

      let endHour = currentHour;
      let endMinute = currentMinute + duration;
      if (endMinute >= 60) {
        endMinute -= 60;
        endHour += 1;
      }
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
        await this.prisma.timeSlot.update({
          where: { id: existing.id },
          data: { type, endTime: end },
        });
        createdSlots.push(await this.prisma.timeSlot.update({
          where: { id: existing.id },
          data: { type, endTime: end },
        }));
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

      currentMinute += duration;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour += 1;
      }
    }

    return createdSlots;
  }

  private async findOneSlot(id: string) {
    const slot = await this.prisma.timeSlot.findUnique({ where: { id } });
    if (!slot) throw new NotFoundException('Time slot not found');
    return slot;
  }
}
