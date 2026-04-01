import api from './axios';
import { Review, CreateReviewDto, UpdateReviewDto } from '../types';

export const reviewsService = {
  async getByParkingLot(parkingLotId: string): Promise<Review[]> {
    const response = await api.get<Review[]>(`/reviews/parking-lot/${parkingLotId}`);
    return response.data;
  },

  async getAverageRating(parkingLotId: string): Promise<{ parking_lot_id: string; average_rating: number }> {
    const response = await api.get<{ parking_lot_id: string; average_rating: number }>(
      `/reviews/parking-lot/${parkingLotId}/average`
    );
    return response.data;
  },

  async getById(id: string): Promise<Review> {
    const response = await api.get<Review>(`/reviews/${id}`);
    return response.data;
  },

  async create(data: CreateReviewDto): Promise<Review> {
    const response = await api.post<Review>('/reviews', data);
    return response.data;
  },

  async update(id: string, data: UpdateReviewDto): Promise<Review> {
    const response = await api.put<Review>(`/reviews/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/reviews/${id}`);
  },
};
