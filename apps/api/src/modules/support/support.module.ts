import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';
import { OrdersModule } from '../orders/orders.module';
import { CreateRmaUseCase } from './application/use-cases/create-rma.use-case';
import { CreateTicketUseCase } from './application/use-cases/create-ticket.use-case';
import { GetTicketUseCase } from './application/use-cases/get-ticket.use-case';
import { ListRmaUseCase } from './application/use-cases/list-rma.use-case';
import { ListTicketMessagesUseCase } from './application/use-cases/list-ticket-messages.use-case';
import { ListTicketsUseCase } from './application/use-cases/list-tickets.use-case';
import { ReplyToTicketUseCase } from './application/use-cases/reply-to-ticket.use-case';
import { UpdateRmaStatusUseCase } from './application/use-cases/update-rma-status.use-case';
import { UpdateTicketUseCase } from './application/use-cases/update-ticket.use-case';
import { PrismaRmaRequestRepository } from './infrastructure/persistence/prisma-rma-request.repository';
import { PrismaTicketRepository } from './infrastructure/persistence/prisma-ticket.repository';
import { PrismaTicketMessageRepository } from './infrastructure/persistence/prisma-ticket-message.repository';
import { AdminSupportController } from './presentation/controllers/admin-support.controller';
import { SupportController } from './presentation/controllers/support.controller';
import { RMA_REPOSITORY, TICKET_MESSAGE_REPOSITORY, TICKET_REPOSITORY } from './support.constants';

@Module({
  imports: [IdentityModule, OrdersModule],
  controllers: [SupportController, AdminSupportController],
  providers: [
    CreateTicketUseCase,
    GetTicketUseCase,
    ListTicketsUseCase,
    ListTicketMessagesUseCase,
    ReplyToTicketUseCase,
    UpdateTicketUseCase,
    CreateRmaUseCase,
    ListRmaUseCase,
    UpdateRmaStatusUseCase,
    { provide: TICKET_REPOSITORY, useClass: PrismaTicketRepository },
    { provide: TICKET_MESSAGE_REPOSITORY, useClass: PrismaTicketMessageRepository },
    { provide: RMA_REPOSITORY, useClass: PrismaRmaRequestRepository },
  ],
})
export class SupportModule {}
