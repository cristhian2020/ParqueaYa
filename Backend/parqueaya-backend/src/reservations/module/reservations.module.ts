import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from '../reservation.entity';
import { ReservationsService } from '../service/reservations.service';
import { ReservationsController } from '../controller/reservations.controller';
import { ParkingLot } from '../../parking-lots/parking-lot.entity';
import { User } from '../../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation, ParkingLot, User])],
  providers: [ReservationsService],
  controllers: [ReservationsController],
  exports: [ReservationsService],
})
export class ReservationsModule {}
