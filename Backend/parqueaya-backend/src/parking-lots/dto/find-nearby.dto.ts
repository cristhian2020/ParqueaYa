// src/parking-lots/dto/find-nearby.dto.ts
import { IsLatitude, IsLongitude, IsNumber, Min, Max } from 'class-validator';

export class FindNearbyDto {
  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsNumber()
  @Min(100) // mínimo 100 metros
  @Max(10000) // máximo 10 km
  radius: number = 2000; // por defecto 2km
}