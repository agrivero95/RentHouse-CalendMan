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
import { CalendarService } from './calendar.service';
import { CreateTimeSlotDto } from './dto/create-time-slot.dto';
import { UpdateTimeSlotDto } from './dto/update-time-slot.dto';
import { AdminGuard } from '../auth/admin.guard';

@Controller('calendar')
export class CalendarController {
  constructor(private calendarService: CalendarService) {}

  @Get('slots')
  @UseGuards(AdminGuard)
  findAllSlots() {
    return this.calendarService.findAllSlots();
  }

  @Get('slots/property/:propertyId')
  findSlotsByProperty(
    @Param('propertyId') propertyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ey, em, ed] = endDate.split('-').map(Number);
    const utcStart = new Date(Date.UTC(sy, sm - 1, sd));
    const utcEnd = new Date(Date.UTC(ey, em - 1, ed, 23, 59, 59, 999));
    return this.calendarService.findSlotsByProperty(propertyId, utcStart, utcEnd);
  }

  @Get('available/:propertyId')
  getAvailableSlots(
    @Param('propertyId') propertyId: string,
    @Query('date') date: string,
  ) {
    const [y, m, d] = date.split('-').map(Number);
    const utcDate = new Date(Date.UTC(y, m - 1, d));
    return this.calendarService.getAvailableSlots(propertyId, utcDate);
  }

  @Post('slots')
  @UseGuards(AdminGuard)
  createSlot(@Body() createTimeSlotDto: CreateTimeSlotDto) {
    return this.calendarService.createSlot(createTimeSlotDto);
  }

  @Put('slots/:id')
  @UseGuards(AdminGuard)
  updateSlot(
    @Param('id') id: string,
    @Body() updateTimeSlotDto: UpdateTimeSlotDto,
  ) {
    return this.calendarService.updateSlot(id, updateTimeSlotDto);
  }

  @Delete('slots/:id')
  @UseGuards(AdminGuard)
  removeSlot(@Param('id') id: string) {
    return this.calendarService.removeSlot(id);
  }

  @Post('block/:propertyId')
  @UseGuards(AdminGuard)
  blockPropertySlots(
    @Param('propertyId') propertyId: string,
    @Query('date') date: string,
    @Query('type') type: 'RESERVED' | 'BLOCKED',
  ) {
    const [y, m, d] = date.split('-').map(Number);
    const utcDate = new Date(Date.UTC(y, m - 1, d));
    return this.calendarService.blockPropertySlots(propertyId, utcDate, type);
  }

  @Get('month')
  @UseGuards(AdminGuard)
  getMonthSlots(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ey, em, ed] = endDate.split('-').map(Number);
    const utcStart = new Date(Date.UTC(sy, sm - 1, sd));
    const utcEnd = new Date(Date.UTC(ey, em - 1, ed, 23, 59, 59, 999));
    return this.calendarService.getMonthSlots(utcStart, utcEnd);
  }

  @Get('available-days/:propertyId')
  getAvailableDays(
    @Param('propertyId') propertyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ey, em, ed] = endDate.split('-').map(Number);
    const utcStart = new Date(Date.UTC(sy, sm - 1, sd));
    const utcEnd = new Date(Date.UTC(ey, em - 1, ed, 23, 59, 59, 999));
    return this.calendarService.getAvailableDays(propertyId, utcStart, utcEnd);
  }

  @Post('custom-slots')
  @UseGuards(AdminGuard)
  createCustomSlots(
    @Body() body: { propertyId: string; date: string; startTime: string; endTime: string; duration: number; type: 'AVAILABLE' | 'RESERVED' | 'BLOCKED' },
  ) {
    return this.calendarService.createCustomSlots(body.propertyId, body.date, body.startTime, body.endTime, body.duration, body.type);
  }
}
