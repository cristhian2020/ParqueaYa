import { create } from 'zustand';
import { parkingLotsService, ParkingLot } from '../api/parking-lots.service';

interface ParkingState {
  parkingLots: ParkingLot[];
  selectedParking: ParkingLot | null;
  isLoading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  fetchNearby: (lat: number, lng: number, radius?: number) => Promise<void>;
  fetchById: (id: string) => Promise<void>;
  setSelectedParking: (parking: ParkingLot | null) => void;
  clearError: () => void;
}

export const useParkingStore = create<ParkingState>((set) => ({
  parkingLots: [],
  selectedParking: null,
  isLoading: false,
  error: null,

  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const parkingLots = await parkingLotsService.getAll();
      set({ parkingLots, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Error al cargar parqueos', isLoading: false });
    }
  },

  fetchNearby: async (lat: number, lng: number, radius: number = 5000) => {
    set({ isLoading: true, error: null });
    try {
      // Intenta traer parqueos cercanos, si falla trae todos
      try {
        const parkingLots = await parkingLotsService.findNearby({
          latitude: lat,
          longitude: lng,
          radius,
        });
        set({ parkingLots, isLoading: false });
      } catch {
        // Si falla el endpoint nearby, trae todos los parqueos
        const parkingLots = await parkingLotsService.getAll();
        set({ parkingLots, isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Error al cargar parqueos', isLoading: false });
    }
  },

  fetchById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const parking = await parkingLotsService.getById(id);
      set({ selectedParking: parking, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Error al cargar detalles del parqueo', isLoading: false });
    }
  },

  setSelectedParking: (parking) => set({ selectedParking: parking }),

  clearError: () => set({ error: null }),
}));
