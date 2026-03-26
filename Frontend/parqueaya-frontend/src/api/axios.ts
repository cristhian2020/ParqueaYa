// src/api/axios.ts
import axios from 'axios';
import { API_URL } from '../../constants/Api';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor para añadir el token JWT a cada petición
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido - limpiar almacenamiento
      SecureStore.deleteItemAsync('access_token');
      SecureStore.deleteItemAsync('user');
      // Redirigir a login (esto se maneja en el componente)
    }
    return Promise.reject(error);
  }
);

export default api;
