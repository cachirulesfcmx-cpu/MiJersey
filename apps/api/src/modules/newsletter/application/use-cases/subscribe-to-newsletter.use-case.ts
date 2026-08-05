import { Inject, Injectable } from '@nestjs/common';

import type { NewsletterSubscriberRepositoryPort } from '../../domain/ports/newsletter-subscriber.repository.port';
import { NEWSLETTER_SUBSCRIBER_REPOSITORY } from '../../newsletter.constants';

export interface SubscribeToNewsletterInput {
  email: string;
  source?: string | null;
  ipAddress: string | null;
}

export interface SubscribeToNewsletterResult {
  alreadySubscribed: boolean;
}

/** Idempotente a propósito: si el correo ya está suscrito, responde éxito sin duplicar ni lanzar
 * error -- el formulario del footer no necesita distinguir "nuevo" de "ya suscrito" para el
 * visitante, solo confirmar que quedó registrado. */
@Injectable()
export class SubscribeToNewsletterUseCase {
  constructor(
    @Inject(NEWSLETTER_SUBSCRIBER_REPOSITORY)
    private readonly subscribers: NewsletterSubscriberRepositoryPort,
  ) {}

  async execute(input: SubscribeToNewsletterInput): Promise<SubscribeToNewsletterResult> {
    const email = input.email.trim().toLowerCase();
    const existing = await this.subscribers.findByEmail(email);
    if (existing) {
      return { alreadySubscribed: true };
    }

    await this.subscribers.create({
      email,
      source: input.source ?? null,
      ipAddress: input.ipAddress,
    });
    return { alreadySubscribed: false };
  }
}
