// src/store/useReservationStore.ts
import { create } from 'zustand';
import { Reservation, CreateReservationDto } from '../types';
import { reservationsService } from '../api/reservations.service';

interface ReservationState {
  reservations: Reservation[];
  currentReservation: Reservation | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadMyReservations: () => Promise<void>;
  createReservation: (data: CreateReservationDto) => Promise<Reservation>;
  cancelReservation: (id: string) => Promise<void>;
  clearCurrentReservation: () => void;
  clearError: () => void;
}

export const useReservationStore = create<ReservationState>((set, get) => ({
  reservations: [],
  currentReservation: null,
  isLoading: false,
  error: null,

  loadMyReservations: async () => {
    try {
      set({ isLoading: true, error: null });
      const reservations = await reservationsService.getMyReservations();
      set({ reservations, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al cargar reservas',
        isLoading: false,
      });
    }
  },

  createReservation: async (data: CreateReservationDto) => {
    try {
      set({ isLoading: true, error: null });
      const reservation = await reservationsService.create(data);
      set({ currentReservation: reservation, isLoading: false });
      
      // Recargar la lista de reservas
      const reservations = await reservationsService.getMyReservations();
      set({ reservations });
      
      return reservation;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al crear reserva',
        isLoading: false,
      });
      throw error;
    }
  },

  cancelReservation: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      await reservationsService.cancel(id);
      
      // Recargar la lista de reservas
      const reservations = await reservationsService.getMyReservations();
      set({ reservations, isLoading: false });
      
      // Si la reserva actual es la que se canceló, limpiarla
      const { currentReservation } = get();
      if (currentReservation?.id === id) {
        set({ currentReservation: null });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al cancelar reserva',
        isLoading: false,
      });
      throw error;
    }
  },

  clearCurrentReservation: () => {
    set({ currentReservation: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));
