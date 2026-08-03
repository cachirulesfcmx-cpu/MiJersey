import type { ReviewStatus } from '../value-objects/review-enums';

export interface ReviewProps {
  id: string;
  productId: string;
  customerId: string | null;
  authorName: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: ReviewStatus;
  isVerifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ReviewEntity {
  constructor(private readonly props: ReviewProps) {}

  get id(): string {
    return this.props.id;
  }

  get productId(): string {
    return this.props.productId;
  }

  get customerId(): string | null {
    return this.props.customerId;
  }

  get authorName(): string {
    return this.props.authorName;
  }

  get rating(): number {
    return this.props.rating;
  }

  get status(): ReviewStatus {
    return this.props.status;
  }

  get isVerifiedPurchase(): boolean {
    return this.props.isVerifiedPurchase;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toJSON(): ReviewProps {
    return { ...this.props };
  }
}
