import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../prisma/prisma.service';
import type {
  CreateNewsletterSubscriberData,
  NewsletterSubscriberRecord,
  NewsletterSubscriberRepositoryPort,
} from '../../domain/ports/newsletter-subscriber.repository.port';

@Injectable()
export class PrismaNewsletterSubscriberRepository implements NewsletterSubscriberRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<NewsletterSubscriberRecord | null> {
    return this.prisma.newsletterSubscriber.findUnique({ where: { email } });
  }

  async create(data: CreateNewsletterSubscriberData): Promise<NewsletterSubscriberRecord> {
    return this.prisma.newsletterSubscriber.create({ data });
  }
}
