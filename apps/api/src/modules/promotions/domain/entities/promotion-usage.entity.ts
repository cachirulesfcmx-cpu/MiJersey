export interface PromotionUsageProps {
  id: string;
  promotionId: string;
  orderId: string;
  customerId: string | null;
  discountAmount: number;
  createdAt: Date;
}

export class PromotionUsageEntity {
  constructor(private readonly props: PromotionUsageProps) {}

  get id(): string {
    return this.props.id;
  }

  get promotionId(): string {
    return this.props.promotionId;
  }

  get orderId(): string {
    return this.props.orderId;
  }

  toJSON(): PromotionUsageProps {
    return { ...this.props };
  }
}
