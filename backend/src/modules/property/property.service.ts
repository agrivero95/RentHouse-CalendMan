import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class PropertyService {
  constructor(private prisma: PrismaService) {}

  async create(createPropertyDto: CreatePropertyDto) {
    return this.prisma.property.create({ data: createPropertyDto });
  }

  async findAll() {
    return this.prisma.property.findMany({
      include: { owner: true, appointments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllForBooking() {
    return this.prisma.property.findMany({
      include: { owner: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: { owner: true, appointments: true },
    });
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async update(id: string, updatePropertyDto: UpdatePropertyDto) {
    await this.findOne(id);
    return this.prisma.property.update({ where: { id }, data: updatePropertyDto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.property.delete({ where: { id } });
  }

  async findByOwnerId(ownerId: string) {
    return this.prisma.property.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
