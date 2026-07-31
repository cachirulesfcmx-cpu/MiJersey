import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseFilters,
} from '@nestjs/common';

import { Public } from '../../../../common/decorators/public.decorator';
import { HandlePaymentWebhookUseCase } from '../../application/use-cases/handle-payment-webhook.use-case';
import { PaymentsExceptionFilter } from '../filters/payments-exception.filter';

/** Endpoint público, verificado por firma (spec §8) en vez de por sesión — así llegan los webhooks de cualquier proveedor real. Ver el comentario de `ManualPaymentProvider.verifyWebhookSignature` sobre la simplificación de firmar el JSON re-serializado en vez del cuerpo crudo. */
@Controller('payments/webhook')
@Public()
@UseFilters(PaymentsExceptionFilter)
export class PaymentsWebhookController {
  constructor(private readonly handleWebhook: HandlePaymentWebhookUseCase) {}

  @Post(':provider')
  @HttpCode(HttpStatus.OK)
  async receive(
    @Param('provider') provider: string,
    @Body() body: Record<string, unknown>,
    @Headers('x-payment-signature') signature: string | undefined,
  ) {
    await this.handleWebhook.execute({
      provider,
      rawBody: JSON.stringify(body),
      signature,
    });
    return { received: true };
  }
}
