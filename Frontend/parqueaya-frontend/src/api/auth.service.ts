// src/api/auth.service.ts
import api from './axios';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'owner';
}

export interface AuthResponse {
  user: User;
  access_token: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role?: 'user' | 'owner';
}

export const authService = {
  async login(data: LoginDto): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  async register(data: RegisterDto): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await api.get<User>('/auth/profile');
    return response.data;
  },

  async logout(): Promise<void> {
    // El logout es principalmente limpiar el almacenamiento local
    // Si necesitas invalidar el token en el backend, puedes añadir un endpoint
  },
};
