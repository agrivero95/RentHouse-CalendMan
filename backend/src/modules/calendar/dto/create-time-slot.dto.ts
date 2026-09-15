import { IsNotEmpty, IsUUID, IsDateString } from 'class-validator';

export class CreateTimeSlotDto {
  @IsNotEmpty()
  @IsUUID()
  propertyId: string;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsDateString()
  startTime: string;

  @IsNotEmpty()
  @IsDateString()
  endTime: string;

  @IsNotEmpty()
  type: 'AVAILABLE' | 'RESERVED' | 'BLOCKED';
}
