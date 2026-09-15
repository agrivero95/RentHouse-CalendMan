import { IsEmail, IsNotEmpty, IsOptional, IsString, IsPhoneNumber } from 'class-validator';

export class CreateClientDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  lastName1!: string;

  @IsOptional()
  @IsString()
  lastName2?: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsNotEmpty()
  @IsPhoneNumber()
  phone!: string;

  @IsOptional()
  @IsString()
  picture?: string;
}
