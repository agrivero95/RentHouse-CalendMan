import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePropertyDto {
  @IsNotEmpty()
  @IsUUID()
  ownerId: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  pictures?: string;
}
