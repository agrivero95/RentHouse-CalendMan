import { Module } from '@nestjs/common';
import { TravelTimeController } from './travel-time.controller';
import { TravelTimeService } from './travel-time.service';

@Module({
  controllers: [TravelTimeController],
  providers: [TravelTimeService],
  exports: [TravelTimeService],
})
export class TravelTimeModule {}
