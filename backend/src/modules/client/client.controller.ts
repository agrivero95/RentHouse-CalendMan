import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { AdminGuard } from '../auth/admin.guard';

@Controller('clients')
export class ClientController {
  constructor(private clientService: ClientService) {}

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientService.create(createClientDto);
  }

  @Post('find-or-create')
  findOrCreate(@Body() createClientDto: CreateClientDto) {
    return this.clientService.findOrCreate(createClientDto);
  }

  @Get()
  @UseGuards(AdminGuard)
  findAll() {
    return this.clientService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientService.findOne(id);
  }

  @Get('email')
  findByEmail(@Query('email') email: string) {
    return this.clientService.findByEmail(email);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientService.update(id, updateClientDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.clientService.remove(id);
  }
}
