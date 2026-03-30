// src/api/reservations.service.ts
import api from './axios';
import {
  Reservation,
  CreateReservationDto,
  UpdateReservationStatusDto,
} from '../types';

export interface CheckAvailabilityResponse {
  available: boolean;
  conflict?: Reservation;
}

export const reservationsService = {
  /**
   * Crea una nueva reserva
   */
  async create(data: CreateReservationDto): Promise<Reservation> {
    const response = await api.post<Reservation>('/reservations', data);
    return response.data;
  },

  /**
   * Obtiene todas las reservas del usuario autenticado
   */
  async getMyReservations(): Promise<Reservation[]> {
    const response = await api.get<Reservation[]>('/reservations/my-reservations');
    return response.data;
  },

  /**
   * Obtiene todas las reservas de un parqueo (solo dueños)
   */
  async getParkingLotReservations(parkingLotId: string): Promise<Reservation[]> {
    const response = await api.get<Reservation[]>(
      `/reservations/parking-lot/${parkingLotId}`
    );
    return response.data;
  },

  /**
   * Obtiene todas las reservas de todos los parqueos del dueño (solo dueños)
   */
  async getAllOwnerReservations(): Promise<Reservation[]> {
    const response = await api.get<Reservation[]>('/reservations/owner/all');
    return response.data;
  },

  /**
   * Obtiene una reserva específica por ID
   */
  async getById(id: string): Promise<Reservation> {
    const response = await api.get<Reservation>(`/reservations/${id}`);
    return response.data;
  },

  /**
   * Actualiza una reserva
   */
  async update(id: string, data: { spot_number?: number; notes?: string }): Promise<Reservation> {
    const response = await api.patch<Reservation>(`/reservations/${id}`, data);
    return response.data;
  },

  /**
   * Actualiza el estado de una reserva
   */
  async updateStatus(id: string, data: UpdateReservationStatusDto): Promise<Reservation> {
    const response = await api.patch<Reservation>(`/reservations/${id}/status`, data);
    return response.data;
  },

  /**
   * Cancela una reserva
   */
  async cancel(id: string): Promise<Reservation> {
    const response = await api.post<Reservation>(`/reservations/${id}/cancel`);
    return response.data;
  },

  /**
   * Verifica disponibilidad de un parqueo en un rango de tiempo
   */
  async checkAvailability(
    parkingLotId: string,
    startTime: string,
    endTime: string
  ): Promise<CheckAvailabilityResponse> {
    const response = await api.get<CheckAvailabilityResponse>(
      `/reservations/parking-lot/${parkingLotId}/availability`,
      {
        params: {
          start_time: startTime,
          end_time: endTime,
        },
      }
    );
    return response.data;
  },
};
