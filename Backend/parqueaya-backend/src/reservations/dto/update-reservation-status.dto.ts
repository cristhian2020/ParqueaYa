import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ReservationStatus } from '../reservation.entity';

export class UpdateReservationStatusDto {
  @IsEnum(ReservationStatus)
  status: ReservationStatus;

  @IsOptional()
  @IsString()
  cancellation_reason?: string;
}
