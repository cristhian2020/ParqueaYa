// src/parking-lots/controller/parking-lots.controller.ts
import { Controller, Get, Post, Body, Param, Delete, Put, Query, UseGuards, Request } from '@nestjs/common';
import { ParkingLotsService } from '../service/parking-lots.service';
import { CreateParkingLotDto } from '../dto/create-parking-lot.dto';
import { UpdateParkingLotDto } from '../dto/update-parking-lot.dto';
import { FindNearbyDto } from '../dto/find-nearby.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../auth/guards/roles.guard';
import { UserRole } from '../../users/user.entity';

@Controller('parking-lots')
export class ParkingLotsController {
  constructor(private readonly parkingLotsService: ParkingLotsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  create(@Request() req, @Body() createParkingLotDto: CreateParkingLotDto) {
    // Asignar el owner_id del usuario autenticado
    const dtoWithOwner = {
      ...createParkingLotDto,
      owner_id: req.user.userId,
    };
    return this.parkingLotsService.create(dtoWithOwner);
  }

  @Get()
  findAll() {
    return this.parkingLotsService.findAll();
  }

  @Get('my-parking-lots')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  findMyParkingLots(@Request() req) {
    return this.parkingLotsService.findByOwnerId(req.user.userId);
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

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateParkingLotDto: UpdateParkingLotDto,
  ) {
    return this.parkingLotsService.update(id, req.user.userId, updateParkingLotDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  remove(@Param('id') id: string) {
    return this.parkingLotsService.remove(id);
  }
}