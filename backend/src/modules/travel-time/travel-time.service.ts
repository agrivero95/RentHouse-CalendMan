import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateTravelTimeDto } from './dto/create-travel-time.dto';

@Injectable()
export class TravelTimeService {
  constructor(private prisma: PrismaService) {}

  async create(createTravelTimeDto: CreateTravelTimeDto) {
    return this.prisma.travelTime.create({ data: createTravelTimeDto });
  }

  async findAll() {
    return this.prisma.travelTime.findMany({
      include: { propertyFrom: true, propertyTo: true },
    });
  }

  async findByPropertyId(propertyId: string) {
    return this.prisma.travelTime.findMany({
      where: {
        OR: [{ propertyId1: propertyId }, { propertyId2: propertyId }],
      },
      include: { propertyFrom: true, propertyTo: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.travelTime.delete({ where: { id } });
  }

  private async findOne(id: string) {
    const travelTime = await this.prisma.travelTime.findUnique({ where: { id } });
    if (!travelTime) throw new NotFoundException('Travel time not found');
    return travelTime;
  }
}
