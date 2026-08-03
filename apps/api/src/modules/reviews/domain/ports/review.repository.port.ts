import type { ReviewEntity } from '../entities/review.entity';
import type { ReviewStatus } from '../value-objects/review-enums';

export interface CreateReviewData {
  productId: string;
  customerId: string | null;
  authorName: string;
  rating: number;
  title: string | null;
  body: string | null;
  isVerifiedPurchase: boolean;
}

export interface ReviewSummary {
  average: number;
  count: number;
  /** Conteo por calificación (1..5) — solo sobre reseñas APPROVED, para el desglose de barras del storefront. */
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface PaginatedReviews {
  items: ReviewEntity[];
  total: number;
}

export interface ReviewRepositoryPort {
  create(data: CreateReviewData): Promise<ReviewEntity>;
  findById(id: string): Promise<ReviewEntity | null>;
  findApprovedByProduct(
    productId: string,
    page: number,
    pageSize: number,
  ): Promise<PaginatedReviews>;
  findPending(page: number, pageSize: number): Promise<PaginatedReviews>;
  summarizeApproved(productId: string): Promise<ReviewSummary>;
  updateStatus(id: string, status: ReviewStatus): Promise<ReviewEntity>;
  /** Mejores reseñas `APPROVED` (rating desc, luego más recientes) — para destacar en el home. */
  findFeatured(limit: number): Promise<ReviewEntity[]>;
}
