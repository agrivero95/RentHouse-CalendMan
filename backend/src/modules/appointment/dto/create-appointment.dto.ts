import { IsNotEmpty, IsUUID, IsOptional, IsInt, Min } from 'class-validator';

export class CreateAppointmentDto {
  @IsNotEmpty()
  @IsUUID()
  clientId!: string;

  @IsNotEmpty()
  @IsUUID()
  propertyId!: string;

  @IsNotEmpty()
  dateSet!: Date;

  @IsNotEmpty()
  timeSet!: Date;

  @IsOptional()
  @IsInt()
  @Min(5)
  duration?: number;

  @IsOptional()
  notes?: string;
}
