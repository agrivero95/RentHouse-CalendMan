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
import { PropertyService } from './property.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { AdminGuard } from '../auth/admin.guard';

@Controller('properties')
export class PropertyController {
  constructor(private propertyService: PropertyService) {}

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() createPropertyDto: CreatePropertyDto) {
    return this.propertyService.create(createPropertyDto);
  }

  @Get()
  @UseGuards(AdminGuard)
  findAll() {
    return this.propertyService.findAll();
  }

  @Get('public')
  findAllPublic() {
    return this.propertyService.findAllForBooking();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertyService.findOne(id);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() updatePropertyDto: UpdatePropertyDto) {
    return this.propertyService.update(id, updatePropertyDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.propertyService.remove(id);
  }

  @Get('owner/:ownerId')
  @UseGuards(AdminGuard)
  findByOwner(@Param('ownerId') ownerId: string) {
    return this.propertyService.findByOwnerId(ownerId);
  }
}
