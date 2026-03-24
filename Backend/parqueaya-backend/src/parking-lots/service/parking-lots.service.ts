// src/parking-lots/service/parking-lots.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParkingLot } from '../parking-lot.entity';
import { CreateParkingLotDto } from '../dto/create-parking-lot.dto';
import { FindNearbyDto } from '../dto/find-nearby.dto';

@Injectable()
export class ParkingLotsService {
  constructor(
    @InjectRepository(ParkingLot)
    private parkingLotRepository: Repository<ParkingLot>,
  ) {}

  async create(createParkingLotDto: CreateParkingLotDto): Promise<ParkingLot> {
    const { latitude, longitude, ...rest } = createParkingLotDto;

    // Crear el punto geográfico usando ST_MakePoint y ST_SetSRID
    const location = {
      type: 'Point',
      coordinates: [longitude, latitude], // GeoJSON usa [longitude, latitude]
    };

    const parkingLot = this.parkingLotRepository.create({
      ...rest,
      location,
    });

    return await this.parkingLotRepository.save(parkingLot);
  }

  async findAll(): Promise<ParkingLot[]> {
    return await this.parkingLotRepository.find();
  }

  async findOne(id: string): Promise<ParkingLot | null> {
    return await this.parkingLotRepository.findOne({ where: { id } });
  }

  async findNearby(findNearbyDto: FindNearbyDto): Promise<ParkingLot[]> {
    const { latitude, longitude, radius } = findNearbyDto;

    // Consulta usando PostGIS para encontrar parqueos cercanos
    // Usamos ST_DWithin con GEOGRAPHY para cálculos precisos en metros
    const query = `
      SELECT *
      FROM parking_lots
      WHERE ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
      ORDER BY ST_Distance(
        location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
      )
    `;

    return await this.parkingLotRepository.query(query, [
      longitude,
      latitude,
      radius,
    ]);
  }

  async updateAvailability(
    id: string,
    available_spots: number,
  ): Promise<ParkingLot | null> {
    await this.parkingLotRepository.update(id, { available_spots });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.parkingLotRepository.delete(id);
  }
}
