import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TravelTimeService } from './travel-time.service';
import { CreateTravelTimeDto } from './dto/create-travel-time.dto';
import { AdminGuard } from '../auth/admin.guard';

@Controller('travel-times')
export class TravelTimeController {
  constructor(private travelTimeService: TravelTimeService) {}

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() createTravelTimeDto: CreateTravelTimeDto) {
    return this.travelTimeService.create(createTravelTimeDto);
  }

  @Get()
  @UseGuards(AdminGuard)
  findAll() {
    return this.travelTimeService.findAll();
  }

  @Get('property/:propertyId')
  @UseGuards(AdminGuard)
  findByProperty(@Param('propertyId') propertyId: string) {
    return this.travelTimeService.findByPropertyId(propertyId);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.travelTimeService.remove(id);
  }
}
