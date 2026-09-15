import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientService {
  constructor(private prisma: PrismaService) {}

  async create(createClientDto: CreateClientDto) {
    return this.prisma.client.create({ data: createClientDto });
  }

  async findAll() {
    return this.prisma.client.findMany({
      include: { appointments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: { appointments: true },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async findByEmail(email: string) {
    return this.prisma.client.findFirst({ where: { email } });
  }

  async update(id: string, updateClientDto: UpdateClientDto) {
    await this.findOne(id);
    return this.prisma.client.update({ where: { id }, data: updateClientDto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.delete({ where: { id } });
  }

  async findOrCreate(createClientDto: CreateClientDto) {
    const existing = await this.findByEmail(createClientDto.email);
    if (existing) {
      return { client: existing, created: false };
    }
    const client = await this.create(createClientDto);
    return { client, created: true };
  }
}
