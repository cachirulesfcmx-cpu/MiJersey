import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';

import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { CreateRmaUseCase } from '../../application/use-cases/create-rma.use-case';
import { CreateTicketUseCase } from '../../application/use-cases/create-ticket.use-case';
import { GetTicketUseCase } from '../../application/use-cases/get-ticket.use-case';
import { ListTicketMessagesUseCase } from '../../application/use-cases/list-ticket-messages.use-case';
import { ListTicketsUseCase } from '../../application/use-cases/list-tickets.use-case';
import { ReplyToTicketUseCase } from '../../application/use-cases/reply-to-ticket.use-case';
import { TicketMessageAuthorType } from '../../domain/value-objects/support-enums';
import { CreateRmaDto } from '../dto/create-rma.dto';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { ListMessagesQueryDto } from '../dto/list-messages-query.dto';
import { ListTicketsQueryDto } from '../dto/list-tickets-query.dto';
import { ReplyTicketDto } from '../dto/reply-ticket.dto';
import { SupportExceptionFilter } from '../filters/support-exception.filter';

/** Spec §9 "autenticación obligatoria" — guard global `JwtAuthGuard` (sin `@Public()`), igual que `/orders` (021)/`/wishlist` (020). Solo expone los tickets y RMA propios del cliente; la vista de agente vive en `AdminSupportController`. */
@Controller('support')
@UseFilters(SupportExceptionFilter)
export class SupportController {
  constructor(
    private readonly createTicket: CreateTicketUseCase,
    private readonly listTickets: ListTicketsUseCase,
    private readonly getTicket: GetTicketUseCase,
    private readonly listMessages: ListTicketMessagesUseCase,
    private readonly replyToTicket: ReplyToTicketUseCase,
    private readonly createRma: CreateRmaUseCase,
  ) {}

  @Get('tickets')
  async list(@Query() query: ListTicketsQueryDto, @CurrentUser() user: AccessTokenPayload) {
    const result = await this.listTickets.execute({
      customerId: user.sub,
      page: query.page,
      pageSize: query.pageSize,
      ...(query.status !== undefined ? { status: query.status } : {}),
      ...(query.priority !== undefined ? { priority: query.priority } : {}),
    });
    return { ...result, items: result.items.map((ticket) => ticket.toJSON()) };
  }

  @Post('tickets')
  async create(
    @Body() dto: CreateTicketDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const ticket = await this.createTicket.execute({
      customerId: user.sub,
      orderId: dto.orderId ?? null,
      subject: dto.subject,
      category: dto.category,
      ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
      ipAddress: ip,
    });
    return ticket.toJSON();
  }

  @Get('tickets/:id')
  async get(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload) {
    const ticket = await this.getTicket.execute({ id, customerId: user.sub });
    return ticket.toJSON();
  }

  @Get('tickets/:id/messages')
  async messages(
    @Param('id') id: string,
    @Query() query: ListMessagesQueryDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    const result = await this.listMessages.execute({
      ticketId: id,
      customerId: user.sub,
      page: query.page,
      pageSize: query.pageSize,
    });
    return { ...result, items: result.items.map((message) => message.toJSON()) };
  }

  @Post('tickets/:id/reply')
  @HttpCode(HttpStatus.CREATED)
  async reply(
    @Param('id') id: string,
    @Body() dto: ReplyTicketDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const message = await this.replyToTicket.execute({
      ticketId: id,
      customerId: user.sub,
      authorType: TicketMessageAuthorType.CUSTOMER,
      authorId: user.sub,
      message: dto.message,
      attachments: dto.attachments ?? [],
      isInternal: false,
      ipAddress: ip,
    });
    return message.toJSON();
  }

  @Post('rma')
  async requestRma(
    @Body() dto: CreateRmaDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const rma = await this.createRma.execute({
      customerId: user.sub,
      orderId: dto.orderId,
      reason: dto.reason,
      itemsDescription: dto.itemsDescription,
      ticketId: dto.ticketId ?? null,
      ipAddress: ip,
    });
    return rma.toJSON();
  }
}
