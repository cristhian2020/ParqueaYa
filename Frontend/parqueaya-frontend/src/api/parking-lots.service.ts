// src/api/parking-lots.service.ts
import api from './axios';

export interface ParkingLot {
  id: string;
  owner_id: string;
  name: string;
  address?: string;
  description?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  price_per_hour?: number;
  total_spots?: number;
  available_spots?: number;
  has_security?: boolean;
  has_cctv?: boolean;
  is_24h?: boolean;
  opening_time?: string;
  closing_time?: string;
  photos?: string[];
  verified?: boolean;
  created_at?: string;
  updated_at?: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateParkingLotDto {
  name: string;
  address?: string;
  description?: string;
  latitude: number;
  longitude: number;
  price_per_hour?: number;
  total_spots?: number;
  available_spots?: number;
  has_security?: boolean;
  has_cctv?: boolean;
  is_24h?: boolean;
  opening_time?: string;
  closing_time?: string;
  photos?: string[];
}

export interface UpdateParkingLotDto {
  name?: string;
  address?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  price_per_hour?: number;
  total_spots?: number;
  available_spots?: number;
  has_security?: boolean;
  has_cctv?: boolean;
  is_24h?: boolean;
  opening_time?: string;
  closing_time?: string;
  photos?: string[];
}

export interface FindNearbyDto {
  latitude: number;
  longitude: number;
  radius: number;
}

export const parkingLotsService = {
  async getAll(): Promise<ParkingLot[]> {
    const response = await api.get<ParkingLot[]>('/parking-lots');
    return response.data;
  },

  async getById(id: string): Promise<ParkingLot> {
    const response = await api.get<ParkingLot>(`/parking-lots/${id}`);
    return response.data;
  },

  async getMyParkingLots(): Promise<ParkingLot[]> {
    const response = await api.get<ParkingLot[]>('/parking-lots/my-parking-lots');
    return response.data;
  },

  async create(data: CreateParkingLotDto): Promise<ParkingLot> {
    const response = await api.post<ParkingLot>('/parking-lots', data);
    return response.data;
  },

  async update(id: string, data: UpdateParkingLotDto): Promise<ParkingLot> {
    const response = await api.put<ParkingLot>(`/parking-lots/${id}`, data);
    return response.data;
  },

  async findNearby(data: FindNearbyDto): Promise<ParkingLot[]> {
    const response = await api.get<ParkingLot[]>('/parking-lots/nearby', {
      params: data,
    });
    return response.data;
  },

  async updateAvailability(id: string, available_spots: number): Promise<ParkingLot> {
    const response = await api.put<ParkingLot>(`/parking-lots/${id}/availability`, {
      available_spots,
    });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/parking-lots/${id}`);
  },
};

