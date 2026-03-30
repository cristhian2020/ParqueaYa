import { IsNotEmpty, IsString, IsDateString, IsOptional, IsNumber, Min, IsEnum } from 'class-validator';
import { ReservationStatus } from '../reservation.entity';

export class CreateReservationDto {
  @IsNotEmpty()
  @IsString()
  parking_lot_id: string;

  @IsNotEmpty()
  @IsDateString()
  start_time: string;

  @IsNotEmpty()
  @IsDateString()
  end_time: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  spot_number?: number;

  @IsOptional()
  @IsString()
  vehicle_plate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
