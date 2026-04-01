import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../review.entity';
import { CreateReviewDto } from '../dto/create-review.dto';
import { UpdateReviewDto } from '../dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  async create(
    createReviewDto: CreateReviewDto,
    userId: string,
  ): Promise<Review> {
    // Check if user already reviewed this parking lot
    const existingReview = await this.reviewRepository.findOne({
      where: {
        user_id: userId,
        parking_lot_id: createReviewDto.parking_lot_id,
      },
    });

    if (existingReview) {
      throw new ConflictException(
        'You have already reviewed this parking lot. Please update your existing review.',
      );
    }

    const review = this.reviewRepository.create({
      ...createReviewDto,
      user_id: userId,
    });

    return this.reviewRepository.save(review);
  }

  async findAllByParkingLot(parkingLotId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { parking_lot_id: parkingLotId },
      relations: ['user'],
      select: {
        id: true,
        user_id: true,
        parking_lot_id: true,
        rating: true,
        comment: true,
        created_at: true,
        updated_at: true,
        user: {
          id: true,
          name: true,
          email: false,
          password: false,
          phone: false,
          role: true,
          is_active: true,
          created_at: true,
          updated_at: true,
        },
      },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'parking_lot'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return review;
  }

  async update(
    id: string,
    updateReviewDto: UpdateReviewDto,
    userId: string,
  ): Promise<Review> {
    const review = await this.findOne(id);

    if (review.user_id !== userId) {
      throw new ForbiddenException(
        'You can only update your own reviews',
      );
    }

    Object.assign(review, updateReviewDto);
    return this.reviewRepository.save(review);
  }

  async remove(id: string, userId: string): Promise<void> {
    const review = await this.findOne(id);

    if (review.user_id !== userId) {
      throw new ForbiddenException(
        'You can only delete your own reviews',
      );
    }

    await this.reviewRepository.remove(review);
  }

  async calculateAverageRating(parkingLotId: string): Promise<number> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'average')
      .where('review.parking_lot_id = :parkingLotId', { parkingLotId })
      .getRawOne();

    return result.average ? parseFloat(result.average) : 0;
  }
}
