export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Review {
  id: string;
  productId: string;
  customerId: string | null;
  authorName: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: ReviewStatus;
  isVerifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSummary {
  average: number;
  count: number;
  breakdown: Record<'1' | '2' | '3' | '4' | '5', number>;
}

export interface ProductReviewsResult {
  items: Review[];
  total: number;
  page: number;
  pageSize: number;
  summary: ReviewSummary;
}

export interface CreateReviewInput {
  authorName: string;
  rating: number;
  title?: string;
  body?: string;
}

export interface FeaturedReview extends Review {
  product: { slug: string; name: string; imageUrl: string | null } | null;
}

export interface FeaturedReviewsResult {
  items: FeaturedReview[];
}
