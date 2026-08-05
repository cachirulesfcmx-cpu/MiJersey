import { Module } from '@nestjs/common';

import { SubscribeToNewsletterUseCase } from './application/use-cases/subscribe-to-newsletter.use-case';
import { PrismaNewsletterSubscriberRepository } from './infrastructure/persistence/prisma-newsletter-subscriber.repository';
import { NEWSLETTER_SUBSCRIBER_REPOSITORY } from './newsletter.constants';
import { NewsletterController } from './presentation/controllers/newsletter.controller';

@Module({
  controllers: [NewsletterController],
  providers: [
    SubscribeToNewsletterUseCase,
    { provide: NEWSLETTER_SUBSCRIBER_REPOSITORY, useClass: PrismaNewsletterSubscriberRepository },
  ],
})
export class NewsletterModule {}
