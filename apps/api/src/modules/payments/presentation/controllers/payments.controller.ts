import { Body, Controller, Get, Param, Post, UseFilters } from '@nestjs/common';

import { Public } from '../../../../common/decorators/public.decorator';
import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { AuthorizePaymentUseCase } from '../../application/use-cases/authorize-payment.use-case';
import { CapturePaymentUseCase } from '../../application/use-cases/capture-payment.use-case';
import { GetPaymentUseCase } from '../../application/use-cases/get-payment.use-case';
import { AuthorizePaymentDto } from '../dto/authorize-payment.dto';
import { CapturePaymentDto } from '../dto/capture-payment.dto';
import { PaymentsExceptionFilter } from '../filters/payments-exception.filter';

/** `authorize`/`capture` son públicos a propósito (Checkout admite invitados, 018) — el `orderId` recién devuelto por `POST /checkout/confirm` es la capacidad para pagar, no hace falta sesión. `GET /payments/:id` sí exige sesión y verifica propiedad (guard global `JwtAuthGuard`, sin `@Public()`). */
@Controller('payments')
@UseFilters(PaymentsExceptionFilter)
export class PaymentsController {
  constructor(
    private readonly authorizePayment: AuthorizePaymentUseCase,
    private readonly capturePayment: CapturePaymentUseCase,
    private readonly getPayment: GetPaymentUseCase,
  ) {}

  @Post('authorize')
  @Public()
  async authorize(@Body() dto: AuthorizePaymentDto) {
    const payment = await this.authorizePayment.execute(dto);
    return payment.toJSON();
  }

  @Post('capture')
  @Public()
  async capture(@Body() dto: CapturePaymentDto) {
    const payment = await this.capturePayment.execute(dto);
    return payment.toJSON();
  }

  @Get(':id')
  async get(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload) {
    const payment = await this.getPayment.execute({ id, customerId: user.sub });
    return payment.toJSON();
  }
}
