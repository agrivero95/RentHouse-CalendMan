import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { UpdateOwnerDto } from './dto/update-owner.dto';

@Injectable()
export class OwnerService {
  constructor(private prisma: PrismaService) {}

  async create(createOwnerDto: CreateOwnerDto) {
    return this.prisma.owner.create({ data: createOwnerDto });
  }

  async findAll() {
    return this.prisma.owner.findMany({
      include: { properties: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const owner = await this.prisma.owner.findUnique({
      where: { id },
      include: { properties: true },
    });
    if (!owner) throw new NotFoundException('Owner not found');
    return owner;
  }

  async update(id: string, updateOwnerDto: UpdateOwnerDto) {
    await this.findOne(id);
    return this.prisma.owner.update({ where: { id }, data: updateOwnerDto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.owner.delete({ where: { id } });
  }
}
