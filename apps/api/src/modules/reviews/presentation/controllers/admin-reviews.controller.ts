import { Body, Controller, Get, Param, Patch, Query, UseFilters, UseGuards } from '@nestjs/common';

import { RequirePermission } from '../../../identity/presentation/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../../identity/presentation/guards/permissions.guard';
import { ListPendingReviewsUseCase } from '../../application/use-cases/list-pending-reviews.use-case';
import { ModerateReviewUseCase } from '../../application/use-cases/moderate-review.use-case';
import { ListReviewsQueryDto } from '../dto/list-reviews-query.dto';
import { ModerateReviewDto } from '../dto/moderate-review.dto';
import { ReviewsExceptionFilter } from '../filters/reviews-exception.filter';

/** Cola de moderación de reseñas — lectura bajo `admin:access`, aprobar/rechazar bajo `catalog:manage` (mismo criterio que Blog). */
@Controller('admin/reviews')
@UseGuards(PermissionsGuard)
@UseFilters(ReviewsExceptionFilter)
export class AdminReviewsController {
  constructor(
    private readonly listPendingReviews: ListPendingReviewsUseCase,
    private readonly moderateReview: ModerateReviewUseCase,
  ) {}

  @Get('pending')
  @RequirePermission('admin:access')
  async listPending(@Query() query: ListReviewsQueryDto) {
    const result = await this.listPendingReviews.execute({
      page: query.page,
      pageSize: query.pageSize,
    });
    return {
      items: result.items.map((review) => review.toJSON()),
      total: result.total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  @Patch(':id/moderate')
  @RequirePermission('catalog:manage')
  async moderate(@Param('id') id: string, @Body() dto: ModerateReviewDto) {
    const review = await this.moderateReview.execute({ id, status: dto.status });
    return { review: review.toJSON() };
  }
}
