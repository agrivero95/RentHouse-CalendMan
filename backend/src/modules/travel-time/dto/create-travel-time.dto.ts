import { IsNotEmpty, IsUUID, IsOptional, IsInt, Min } from 'class-validator';

export class CreateTravelTimeDto {
  @IsNotEmpty()
  @IsUUID()
  propertyId1: string;

  @IsNotEmpty()
  @IsUUID()
  propertyId2: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;
}
