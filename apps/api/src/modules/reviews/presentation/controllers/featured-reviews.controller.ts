import { Controller, Get, Query } from '@nestjs/common';

import { Public } from '../../../../common/decorators/public.decorator';
import { ListFeaturedReviewsUseCase } from '../../application/use-cases/list-featured-reviews.use-case';

/** Endpoint de solo lectura para la sección de reseñas del home — separado de `PublicReviewsController` (que vive bajo `/products/:slug/reviews`) para no chocar con esa ruta. */
@Controller('reviews')
@Public()
export class FeaturedReviewsController {
  constructor(private readonly listFeaturedReviews: ListFeaturedReviewsUseCase) {}

  @Get('featured')
  async list(@Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : undefined;
    const items = await this.listFeaturedReviews.execute(
      parsed && Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 20) : undefined,
    );
    return {
      items: items.map(({ review, product }) => ({ ...review.toJSON(), product })),
    };
  }
}
