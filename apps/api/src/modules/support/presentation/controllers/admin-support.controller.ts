import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Patch,
  Post,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { RequirePermission } from '../../../identity/presentation/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../../identity/presentation/guards/permissions.guard';
import { GetTicketUseCase } from '../../application/use-cases/get-ticket.use-case';
import { ListRmaUseCase } from '../../application/use-cases/list-rma.use-case';
import { ListTicketMessagesUseCase } from '../../application/use-cases/list-ticket-messages.use-case';
import { ListTicketsUseCase } from '../../application/use-cases/list-tickets.use-case';
import { ReplyToTicketUseCase } from '../../application/use-cases/reply-to-ticket.use-case';
import { UpdateRmaStatusUseCase } from '../../application/use-cases/update-rma-status.use-case';
import { UpdateTicketUseCase } from '../../application/use-cases/update-ticket.use-case';
import { TicketMessageAuthorType } from '../../domain/value-objects/support-enums';
import { ListMessagesQueryDto } from '../dto/list-messages-query.dto';
import { ListRmaQueryDto } from '../dto/list-rma-query.dto';
import { ListTicketsQueryDto } from '../dto/list-tickets-query.dto';
import { ReplyTicketDto } from '../dto/reply-ticket.dto';
import { UpdateRmaStatusDto } from '../dto/update-rma-status.dto';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { SupportExceptionFilter } from '../filters/support-exception.filter';

/** Support Dashboard (spec §6) — reutiliza `admin:access` sin permiso dedicado, mismo criterio que el resto de dashboards de solo-operación de esta sesión (Orders, Shipping). Un agente ve y responde cualquier ticket (`customerId: null` en los casos de uso reutilizados de `SupportController`); las notas internas (`isInternal`) solo se crean y se leen desde aquí. */
@Controller('admin/support')
@UseGuards(PermissionsGuard)
@UseFilters(SupportExceptionFilter)
export class AdminSupportController {
  constructor(
    private readonly listTickets: ListTicketsUseCase,
    private readonly getTicket: GetTicketUseCase,
    private readonly listMessages: ListTicketMessagesUseCase,
    private readonly replyToTicket: ReplyToTicketUseCase,
    private readonly updateTicket: UpdateTicketUseCase,
    private readonly listRma: ListRmaUseCase,
    private readonly updateRmaStatus: UpdateRmaStatusUseCase,
  ) {}

  @Get('tickets')
  @RequirePermission('admin:access')
  async list(@Query() query: ListTicketsQueryDto) {
    const result = await this.listTickets.execute({
      page: query.page,
      pageSize: query.pageSize,
      ...(query.status !== undefined ? { status: query.status } : {}),
      ...(query.priority !== undefined ? { priority: query.priority } : {}),
      ...(query.assignedAgentId !== undefined ? { assignedAgentId: query.assignedAgentId } : {}),
    });
    return { ...result, items: result.items.map((ticket) => ticket.toJSON()) };
  }

  @Get('tickets/:id')
  @RequirePermission('admin:access')
  async get(@Param('id') id: string) {
    const ticket = await this.getTicket.execute({ id, customerId: null });
    return ticket.toJSON();
  }

  @Get('tickets/:id/messages')
  @RequirePermission('admin:access')
  async messages(@Param('id') id: string, @Query() query: ListMessagesQueryDto) {
    const result = await this.listMessages.execute({
      ticketId: id,
      customerId: null,
      page: query.page,
      pageSize: query.pageSize,
    });
    return { ...result, items: result.items.map((message) => message.toJSON()) };
  }

  @Post('tickets/:id/reply')
  @RequirePermission('admin:access')
  @HttpCode(HttpStatus.CREATED)
  async reply(
    @Param('id') id: string,
    @Body() dto: ReplyTicketDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const message = await this.replyToTicket.execute({
      ticketId: id,
      customerId: null,
      authorType: TicketMessageAuthorType.AGENT,
      authorId: user.sub,
      message: dto.message,
      attachments: dto.attachments ?? [],
      isInternal: dto.isInternal ?? false,
      ipAddress: ip,
    });
    return message.toJSON();
  }

  @Patch('tickets/:id')
  @RequirePermission('admin:access')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const ticket = await this.updateTicket.execute({
      id,
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
      ...(dto.assignedAgentId !== undefined ? { assignedAgentId: dto.assignedAgentId } : {}),
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return ticket.toJSON();
  }

  @Get('rma')
  @RequirePermission('admin:access')
  async listReturns(@Query() query: ListRmaQueryDto) {
    const result = await this.listRma.execute({
      page: query.page,
      pageSize: query.pageSize,
      ...(query.status !== undefined ? { status: query.status } : {}),
    });
    return { ...result, items: result.items.map((rma) => rma.toJSON()) };
  }

  @Patch('rma/:id')
  @RequirePermission('admin:access')
  async updateReturnStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRmaStatusDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const rma = await this.updateRmaStatus.execute({
      id,
      status: dto.status,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return rma.toJSON();
  }
}
