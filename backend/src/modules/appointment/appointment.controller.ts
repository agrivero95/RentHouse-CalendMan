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
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AdminGuard } from '../auth/admin.guard';

@Controller('appointments')
export class AppointmentController {
  constructor(private appointmentService: AppointmentService) {}

  @Post()
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentService.create(createAppointmentDto);
  }

  @Get()
  @UseGuards(AdminGuard)
  findAll() {
    return this.appointmentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentService.findOne(id);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentDto) {
    return this.appointmentService.update(id, updateAppointmentDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.appointmentService.remove(id);
  }

  @Get('property/:propertyId')
  findByProperty(
    @Param('propertyId') propertyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.appointmentService.findByPropertyId(
      propertyId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('client/:clientId')
  findByClient(
    @Param('clientId') clientId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.appointmentService.findByClientId(
      clientId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('available-slots/:propertyId')
  findAvailableSlots(
    @Param('propertyId') propertyId: string,
    @Query('date') date: string,
  ) {
    return this.appointmentService.findAvailableSlots(propertyId, new Date(date));
  }
}
