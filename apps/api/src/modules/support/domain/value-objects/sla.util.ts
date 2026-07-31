import type { TicketPriority } from './support-enums';

/** Horas de SLA por prioridad (spec §8 "los SLA puedan medirse"). No hay un job en segundo plano: el incumplimiento se deriva comparando estas fechas contra `now()` al leer el ticket (`isFirstResponseBreached`/`isResolutionBreached`). */
const SLA_HOURS_BY_PRIORITY: Record<TicketPriority, { firstResponse: number; resolution: number }> =
  {
    URGENT: { firstResponse: 1, resolution: 4 },
    HIGH: { firstResponse: 4, resolution: 24 },
    MEDIUM: { firstResponse: 8, resolution: 48 },
    LOW: { firstResponse: 24, resolution: 72 },
  };

export interface SlaDueDates {
  firstResponseDueAt: Date;
  resolutionDueAt: Date;
}

export function calculateSlaDueDates(priority: TicketPriority, createdAt: Date): SlaDueDates {
  const hours = SLA_HOURS_BY_PRIORITY[priority];
  return {
    firstResponseDueAt: new Date(createdAt.getTime() + hours.firstResponse * 60 * 60 * 1000),
    resolutionDueAt: new Date(createdAt.getTime() + hours.resolution * 60 * 60 * 1000),
  };
}

export interface SlaBreachInput {
  status: string;
  firstResponseDueAt: Date;
  resolutionDueAt: Date;
  firstRespondedAt: Date | null;
}

export function isFirstResponseBreached(ticket: SlaBreachInput, now: Date): boolean {
  return ticket.firstRespondedAt === null && now > ticket.firstResponseDueAt;
}

const RESOLVED_TICKET_STATUSES = new Set(['RESOLVED', 'CLOSED']);

export function isResolutionBreached(ticket: SlaBreachInput, now: Date): boolean {
  return !RESOLVED_TICKET_STATUSES.has(ticket.status) && now > ticket.resolutionDueAt;
}
