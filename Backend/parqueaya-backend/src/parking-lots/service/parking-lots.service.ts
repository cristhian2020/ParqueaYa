// src/parking-lots/service/parking-lots.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParkingLot } from '../parking-lot.entity';
import { CreateParkingLotDto } from '../dto/create-parking-lot.dto';
import { UpdateParkingLotDto } from '../dto/update-parking-lot.dto';
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
    const query = `
      SELECT 
        p.id,
        p.owner_id,
        p.name,
        p.address,
        p.description,
        ST_AsGeoJSON(p.location)::json as location,
        p.price_per_hour,
        p.total_spots,
        p.available_spots,
        p.has_security,
        p.has_cctv,
        p.is_24h,
        p.opening_time,
        p.closing_time,
        p.photos,
        p.verified,
        p.created_at,
        p.updated_at,
        json_build_object(
          'id', o.id,
          'name', o.name,
          'email', o.email
        ) as owner
      FROM parking_lots p
      LEFT JOIN users o ON p.owner_id = o.id
    `;

    const results = await this.parkingLotRepository.query(query);
    
    // Convertir location string a objeto si es necesario
    return results.map((row: any) => ({
      ...row,
      location: typeof row.location === 'string' ? JSON.parse(row.location) : row.location,
      price_per_hour: parseFloat(row.price_per_hour),
    }));
  }

  async findByOwnerId(ownerId: string): Promise<ParkingLot[]> {
    const query = `
      SELECT 
        p.id,
        p.owner_id,
        p.name,
        p.address,
        p.description,
        ST_AsGeoJSON(p.location)::json as location,
        p.price_per_hour,
        p.total_spots,
        p.available_spots,
        p.has_security,
        p.has_cctv,
        p.is_24h,
        p.opening_time,
        p.closing_time,
        p.photos,
        p.verified,
        p.created_at,
        p.updated_at
      FROM parking_lots p
      WHERE p.owner_id = $1
    `;

    const results = await this.parkingLotRepository.query(query, [ownerId]);
    
    return results.map((row: any) => ({
      ...row,
      location: typeof row.location === 'string' ? JSON.parse(row.location) : row.location,
      price_per_hour: parseFloat(row.price_per_hour),
    }));
  }

  async findOne(id: string): Promise<ParkingLot | null> {
    const query = `
      SELECT 
        p.id,
        p.owner_id,
        p.name,
        p.address,
        p.description,
        ST_AsGeoJSON(p.location)::json as location,
        p.price_per_hour,
        p.total_spots,
        p.available_spots,
        p.has_security,
        p.has_cctv,
        p.is_24h,
        p.opening_time,
        p.closing_time,
        p.photos,
        p.verified,
        p.created_at,
        p.updated_at,
        json_build_object(
          'id', o.id,
          'name', o.name,
          'email', o.email
        ) as owner
      FROM parking_lots p
      LEFT JOIN users o ON p.owner_id = o.id
      WHERE p.id = $1
    `;

    const result = await this.parkingLotRepository.query(query, [id]);
    
    if (!result || result.length === 0) return null;
    
    const row = result[0];
    return {
      ...row,
      location: typeof row.location === 'string' ? JSON.parse(row.location) : row.location,
      price_per_hour: parseFloat(row.price_per_hour),
    };
  }

  async findNearby(findNearbyDto: FindNearbyDto): Promise<ParkingLot[]> {
    const { latitude, longitude, radius } = findNearbyDto;

    // Consulta usando PostGIS para encontrar parqueos cercanos
    // Usamos ST_DWithin con GEOGRAPHY para cálculos precisos en metros
    const query = `
      SELECT 
        p.id,
        p.owner_id,
        p.name,
        p.address,
        p.description,
        ST_AsGeoJSON(p.location)::json as location,
        p.price_per_hour,
        p.total_spots,
        p.available_spots,
        p.has_security,
        p.has_cctv,
        p.is_24h,
        p.opening_time,
        p.closing_time,
        p.photos,
        p.verified,
        p.created_at,
        p.updated_at,
        ST_Distance(
          p.location::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) as distance
      FROM parking_lots p
      WHERE ST_DWithin(
        p.location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
      ORDER BY distance
    `;

    const results = await this.parkingLotRepository.query(query, [
      longitude,
      latitude,
      radius,
    ]);

    return results.map((row: any) => ({
      ...row,
      location: typeof row.location === 'string' ? JSON.parse(row.location) : row.location,
      price_per_hour: parseFloat(row.price_per_hour),
    }));
  }

  async updateAvailability(
    id: string,
    available_spots: number,
  ): Promise<ParkingLot | null> {
    await this.parkingLotRepository.update(id, { available_spots });
    return this.findOne(id);
  }

  async update(
    id: string,
    ownerId: string,
    updateParkingLotDto: UpdateParkingLotDto,
  ): Promise<ParkingLot | null> {
    // Verificar que el parqueo existe y pertenece al owner
    const existing = await this.parkingLotRepository.findOne({
      where: { id, owner_id: ownerId },
    });

    if (!existing) return null;

    const { latitude, longitude, ...rest } = updateParkingLotDto;

    const updateData: any = { ...rest };

    // Si se proporcionan coordenadas, actualizar la ubicación
    if (latitude !== undefined && longitude !== undefined) {
      updateData.location = {
        type: 'Point',
        coordinates: [longitude, latitude],
      };
    }

    await this.parkingLotRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.parkingLotRepository.delete(id);
  }
}
