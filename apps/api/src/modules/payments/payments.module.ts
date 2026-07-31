import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';
import { OrdersModule } from '../orders/orders.module';
import { PaymentProviderRegistry } from './application/services/payment-provider-registry.service';
import { AuthorizePaymentUseCase } from './application/use-cases/authorize-payment.use-case';
import { CapturePaymentUseCase } from './application/use-cases/capture-payment.use-case';
import { GetPaymentUseCase } from './application/use-cases/get-payment.use-case';
import { HandlePaymentWebhookUseCase } from './application/use-cases/handle-payment-webhook.use-case';
import { ListRefundsUseCase } from './application/use-cases/list-refunds.use-case';
import { RefundPaymentUseCase } from './application/use-cases/refund-payment.use-case';
import { PrismaPaymentRepository } from './infrastructure/persistence/prisma-payment.repository';
import { PrismaPaymentEventRepository } from './infrastructure/persistence/prisma-payment-event.repository';
import { ManualPaymentProvider } from './infrastructure/providers/manual-payment.provider';
import { PAYMENT_EVENT_REPOSITORY, PAYMENT_REPOSITORY } from './payments.constants';
import { AdminPaymentsController } from './presentation/controllers/admin-payments.controller';
import { PaymentsController } from './presentation/controllers/payments.controller';
import { PaymentsWebhookController } from './presentation/controllers/payments-webhook.controller';

@Module({
  imports: [IdentityModule, OrdersModule],
  controllers: [PaymentsController, AdminPaymentsController, PaymentsWebhookController],
  providers: [
    AuthorizePaymentUseCase,
    CapturePaymentUseCase,
    RefundPaymentUseCase,
    GetPaymentUseCase,
    HandlePaymentWebhookUseCase,
    ListRefundsUseCase,
    ManualPaymentProvider,
    {
      provide: PaymentProviderRegistry,
      useFactory: (manual: ManualPaymentProvider) => {
        const registry = new PaymentProviderRegistry();
        registry.register(manual);
        return registry;
      },
      inject: [ManualPaymentProvider],
    },
    { provide: PAYMENT_REPOSITORY, useClass: PrismaPaymentRepository },
    { provide: PAYMENT_EVENT_REPOSITORY, useClass: PrismaPaymentEventRepository },
  ],
})
export class PaymentsModule {}
