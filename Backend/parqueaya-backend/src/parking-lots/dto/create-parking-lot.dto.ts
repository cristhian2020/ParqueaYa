// src/parking-lots/dto/create-parking-lot.dto.ts
import { IsString, IsEmail, IsNumber, IsBoolean, IsOptional, IsArray, IsLatitude, IsLongitude, Min, Max } from 'class-validator';

export class CreateParkingLotDto {
  @IsEmail()
  owner_email: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price_per_hour?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  total_spots?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  available_spots?: number;

  @IsBoolean()
  @IsOptional()
  has_security?: boolean;

  @IsBoolean()
  @IsOptional()
  has_cctv?: boolean;

  @IsBoolean()
  @IsOptional()
  is_24h?: boolean;

  @IsString()
  @IsOptional()
  opening_time?: string;

  @IsString()
  @IsOptional()
  closing_time?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photos?: string[];
}