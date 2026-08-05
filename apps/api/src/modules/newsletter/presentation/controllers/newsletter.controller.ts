import { Body, Controller, HttpCode, HttpStatus, Ip, Post } from '@nestjs/common';

import { Public } from '../../../../common/decorators/public.decorator';
import { SubscribeToNewsletterUseCase } from '../../application/use-cases/subscribe-to-newsletter.use-case';
import { SubscribeNewsletterDto } from '../dto/subscribe-newsletter.dto';

/** Suscripción al newsletter del footer (estilo bartjerseys.com) -- pública, sin autenticación,
 * mismo criterio que `/tracking` (033) y `/products/:slug/reviews` (015). */
@Controller('newsletter')
@Public()
export class NewsletterController {
  constructor(private readonly subscribeToNewsletter: SubscribeToNewsletterUseCase) {}

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  async subscribe(@Body() dto: SubscribeNewsletterDto, @Ip() ip: string) {
    const result = await this.subscribeToNewsletter.execute({
      email: dto.email,
      source: dto.source ?? 'footer',
      ipAddress: ip,
    });
    return { subscribed: true, alreadySubscribed: result.alreadySubscribed };
  }
}
