export interface Parking {
  id: string;
  name: string;
  address?: string;
  location: {
    coordinates: [number, number]; // [longitude, latitude]
  };
  price_per_hour?: number;
  total_spots: number;
  available_spots?: number;
  is_24h?: boolean;
  has_security?: boolean;
  has_cctv?: boolean;
  description?: string;
  image_url?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'owner';
}

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'no_show';

export interface Reservation {
  id: string;
  user_id: string;
  parking_lot_id: string;
  spot_number?: number;
  vehicle_plate?: string;
  start_time: string;
  end_time: string;
  actual_end_time?: string;
  status: ReservationStatus;
  total_price: number;
  overtime_price?: number;
  notes?: string;
  cancelled_by_owner?: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
  parking_lot?: Parking;
}

export interface CreateReservationDto {
  parking_lot_id: string;
  start_time: string;
  end_time: string;
  spot_number?: number;
  vehicle_plate?: string;
  notes?: string;
}

export interface UpdateReservationStatusDto {
  status: ReservationStatus;
  cancellation_reason?: string;
}

export interface Review {
  id: string;
  user_id: string;
  parking_lot_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    role: 'user' | 'owner';
  };
}

export interface CreateReviewDto {
  rating: number;
  comment?: string;
  parking_lot_id: string;
}

export interface UpdateReviewDto {
  rating?: number;
  comment?: string;
}
