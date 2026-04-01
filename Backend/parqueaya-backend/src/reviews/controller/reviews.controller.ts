import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ReviewsService } from '../service/reviews.service';
import { CreateReviewDto } from '../dto/create-review.dto';
import { UpdateReviewDto } from '../dto/update-review.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(createReviewDto, req.user.userId);
  }

  @Get('parking-lot/:parkingLotId')
  findAllByParkingLot(@Param('parkingLotId') parkingLotId: string) {
    return this.reviewsService.findAllByParkingLot(parkingLotId);
  }

  @Get('parking-lot/:parkingLotId/average')
  async getAverageRating(@Param('parkingLotId') parkingLotId: string) {
    const average = await this.reviewsService.calculateAverageRating(
      parkingLotId,
    );
    return { parking_lot_id: parkingLotId, average_rating: average };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @Request() req,
  ) {
    return this.reviewsService.update(id, updateReviewDto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req) {
    return this.reviewsService.remove(id, req.user.userId);
  }
}
