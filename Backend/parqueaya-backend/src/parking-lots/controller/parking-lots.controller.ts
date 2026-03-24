// src/parking-lots/controller/parking-lots.controller.ts
import { Controller, Get, Post, Body, Param, Delete, Put, Query } from '@nestjs/common';
import { ParkingLotsService } from '../service/parking-lots.service';
import { CreateParkingLotDto } from '../dto/create-parking-lot.dto';
import { FindNearbyDto } from '../dto/find-nearby.dto';

@Controller('parking-lots')
export class ParkingLotsController {
  constructor(private readonly parkingLotsService: ParkingLotsService) {}

  @Post()
  create(@Body() createParkingLotDto: CreateParkingLotDto) {
    return this.parkingLotsService.create(createParkingLotDto);
  }

  @Get()
  findAll() {
    return this.parkingLotsService.findAll();
  }

  @Get('nearby')
  findNearby(@Query() findNearbyDto: FindNearbyDto) {
    return this.parkingLotsService.findNearby(findNearbyDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.parkingLotsService.findOne(id);
  }

  @Put(':id/availability')
  updateAvailability(
    @Param('id') id: string,
    @Body('available_spots') available_spots: number,
  ) {
    return this.parkingLotsService.updateAvailability(id, available_spots);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.parkingLotsService.remove(id);
  }
}