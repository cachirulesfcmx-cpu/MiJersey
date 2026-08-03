import { Injectable } from '@nestjs/common';
import type { Review as PrismaReview } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { ReviewEntity } from '../../domain/entities/review.entity';
import type {
  CreateReviewData,
  PaginatedReviews,
  ReviewRepositoryPort,
  ReviewSummary,
} from '../../domain/ports/review.repository.port';
import { ReviewStatus } from '../../domain/value-objects/review-enums';

function toEntity(row: PrismaReview): ReviewEntity {
  return new ReviewEntity({
    id: row.id,
    productId: row.productId,
    customerId: row.customerId,
    authorName: row.authorName,
    rating: row.rating,
    title: row.title,
    body: row.body,
    status: row.status as ReviewStatus,
    isVerifiedPurchase: row.isVerifiedPurchase,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

const EMPTY_BREAKDOWN: ReviewSummary['breakdown'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

@Injectable()
export class PrismaReviewRepository implements ReviewRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateReviewData): Promise<ReviewEntity> {
    const row = await this.prisma.review.create({
      data: {
        productId: data.productId,
        customerId: data.customerId,
        authorName: data.authorName,
        rating: data.rating,
        title: data.title,
        body: data.body,
        isVerifiedPurchase: data.isVerifiedPurchase,
        status: 'PENDING',
      },
    });
    return toEntity(row);
  }

  async findById(id: string): Promise<ReviewEntity | null> {
    const row = await this.prisma.review.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findApprovedByProduct(
    productId: string,
    page: number,
    pageSize: number,
  ): Promise<PaginatedReviews> {
    const where = { productId, status: 'APPROVED' as const };
    const [rows, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.review.count({ where }),
    ]);
    return { items: rows.map(toEntity), total };
  }

  async findPending(page: number, pageSize: number): Promise<PaginatedReviews> {
    const where = { status: 'PENDING' as const };
    const [rows, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.review.count({ where }),
    ]);
    return { items: rows.map(toEntity), total };
  }

  async summarizeApproved(productId: string): Promise<ReviewSummary> {
    const grouped = await this.prisma.review.groupBy({
      by: ['rating'],
      where: { productId, status: 'APPROVED' },
      _count: { _all: true },
    });

    const breakdown = { ...EMPTY_BREAKDOWN };
    let count = 0;
    let sum = 0;
    for (const group of grouped) {
      const rating = group.rating as 1 | 2 | 3 | 4 | 5;
      if (rating >= 1 && rating <= 5) {
        breakdown[rating] = group._count._all;
      }
      count += group._count._all;
      sum += group.rating * group._count._all;
    }

    return { average: count > 0 ? sum / count : 0, count, breakdown };
  }

  async updateStatus(id: string, status: ReviewStatus): Promise<ReviewEntity> {
    const row = await this.prisma.review.update({ where: { id }, data: { status } });
    return toEntity(row);
  }
}
