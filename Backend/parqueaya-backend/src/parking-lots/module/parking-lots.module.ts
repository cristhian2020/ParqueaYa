// src/parking-lots/module/parking-lots.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParkingLotsService } from '../service/parking-lots.service';
import { ParkingLotsController } from '../controller/parking-lots.controller';
import { ParkingLot } from '../parking-lot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ParkingLot])],
  controllers: [ParkingLotsController],
  providers: [ParkingLotsService],
  exports: [ParkingLotsService],
})
export class ParkingLotsModule {}