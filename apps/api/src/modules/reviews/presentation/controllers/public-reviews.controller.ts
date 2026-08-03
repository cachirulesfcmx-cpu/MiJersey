import { Body, Controller, Get, Param, Post, Query, UseFilters, UseGuards } from '@nestjs/common';

import { Public } from '../../../../common/decorators/public.decorator';
import { CurrentUserOptional } from '../../../cart/presentation/decorators/current-user-optional.decorator';
import { OptionalAuthGuard } from '../../../cart/presentation/guards/optional-auth.guard';
import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';
import { CreateReviewUseCase } from '../../application/use-cases/create-review.use-case';
import { ListProductReviewsUseCase } from '../../application/use-cases/list-product-reviews.use-case';
import { CreateReviewDto } from '../dto/create-review.dto';
import { ListReviewsQueryDto } from '../dto/list-reviews-query.dto';
import { ReviewsExceptionFilter } from '../filters/reviews-exception.filter';

/** Reseñas públicas por producto — funciona para invitados y clientes por igual, mismo mecanismo `OptionalAuthGuard` que Promotions/Cart (solo para saber si marcar `isVerifiedPurchase`). */
@Controller('products')
@Public()
@UseGuards(OptionalAuthGuard)
@UseFilters(ReviewsExceptionFilter)
export class PublicReviewsController {
  constructor(
    private readonly createReview: CreateReviewUseCase,
    private readonly listProductReviews: ListProductReviewsUseCase,
  ) {}

  @Get(':slug/reviews')
  async list(@Param('slug') slug: string, @Query() query: ListReviewsQueryDto) {
    const result = await this.listProductReviews.execute({
      slug,
      page: query.page,
      pageSize: query.pageSize,
    });
    return {
      items: result.items.map((review) => review.toJSON()),
      total: result.total,
      page: query.page,
      pageSize: query.pageSize,
      summary: result.summary,
    };
  }

  @Post(':slug/reviews')
  async create(
    @Param('slug') slug: string,
    @CurrentUserOptional() user: AccessTokenPayload | undefined,
    @Body() dto: CreateReviewDto,
  ) {
    const review = await this.createReview.execute({
      slug,
      ...(user?.sub ? { customerId: user.sub } : {}),
      authorName: dto.authorName,
      rating: dto.rating,
      ...(dto.title ? { title: dto.title } : {}),
      ...(dto.body ? { body: dto.body } : {}),
    });
    return { review: review.toJSON() };
  }
}
