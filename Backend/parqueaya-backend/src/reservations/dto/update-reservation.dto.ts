import { IsOptional, IsString, IsEnum, IsNumber, Min, IsDateString } from 'class-validator';
import { ReservationStatus } from '../reservation.entity';

export class UpdateReservationDto {
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

  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @IsOptional()
  @IsDateString()
  actual_end_time?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  overtime_price?: number;
}
