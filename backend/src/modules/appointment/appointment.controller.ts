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
  HttpCode,
  HttpStatus,
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

  @Post(':id/cancel')
  @UseGuards(AdminGuard)
  cancelAppointment(@Param('id') id: string) {
    return this.appointmentService.cancelAppointment(id);
  }

  @Get('property/:propertyId')
  findByProperty(
    @Param('propertyId') propertyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ey, em, ed] = endDate.split('-').map(Number);
    const utcStart = new Date(Date.UTC(sy, sm - 1, sd));
    const utcEnd = new Date(Date.UTC(ey, em - 1, ed, 23, 59, 59, 999));
    return this.appointmentService.findByPropertyId(
      propertyId,
      utcStart,
      utcEnd,
    );
  }

  @Get('client/:clientId')
  findByClient(
    @Param('clientId') clientId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ey, em, ed] = endDate.split('-').map(Number);
    const utcStart = new Date(Date.UTC(sy, sm - 1, sd));
    const utcEnd = new Date(Date.UTC(ey, em - 1, ed, 23, 59, 59, 999));
    return this.appointmentService.findByClientId(
      clientId,
      utcStart,
      utcEnd,
    );
  }

  @Get('available-slots/:propertyId')
  findAvailableSlots(
    @Param('propertyId') propertyId: string,
    @Query('date') date: string,
  ) {
    const [y, m, d] = date.split('-').map(Number);
    const utcDate = new Date(Date.UTC(y, m - 1, d));
    return this.appointmentService.findAvailableSlots(propertyId, utcDate);
  }

  @Post('confirm/:token')
  @HttpCode(HttpStatus.OK)
  async confirmAppointment(@Param('token') token: string) {
    return this.appointmentService.confirmAppointment(token);
  }
}
