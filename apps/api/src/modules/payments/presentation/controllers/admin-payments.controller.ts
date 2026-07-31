import { Body, Controller, Get, Post, Query, UseFilters, UseGuards } from '@nestjs/common';

import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { RequirePermission } from '../../../identity/presentation/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../../identity/presentation/guards/permissions.guard';
import { ListRefundsUseCase } from '../../application/use-cases/list-refunds.use-case';
import { RefundPaymentUseCase } from '../../application/use-cases/refund-payment.use-case';
import { ListRefundsQueryDto } from '../dto/list-refunds-query.dto';
import { RefundPaymentDto } from '../dto/refund-payment.dto';
import { PaymentsExceptionFilter } from '../filters/payments-exception.filter';

/** Reembolsos son una capacidad exclusivamente administrativa (spec §6 "Refund History (administración)") — sin permiso dedicado, reutiliza `admin:access` (mismo criterio que Orders Dashboard, 021). */
@Controller('admin/payments')
@UseGuards(PermissionsGuard)
@UseFilters(PaymentsExceptionFilter)
export class AdminPaymentsController {
  constructor(
    private readonly refundPayment: RefundPaymentUseCase,
    private readonly listRefunds: ListRefundsUseCase,
  ) {}

  @Post('refund')
  @RequirePermission('admin:access')
  async refund(@Body() dto: RefundPaymentDto, @CurrentUser() user: AccessTokenPayload) {
    const payment = await this.refundPayment.execute({
      paymentId: dto.paymentId,
      actorUserId: user.sub,
      ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
      ...(dto.reason !== undefined ? { reason: dto.reason } : {}),
    });
    return payment.toJSON();
  }

  @Get('refunds')
  @RequirePermission('admin:access')
  async refunds(@Query() query: ListRefundsQueryDto) {
    return this.listRefunds.execute({ page: query.page, pageSize: query.pageSize });
  }
}
