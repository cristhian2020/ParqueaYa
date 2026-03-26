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
