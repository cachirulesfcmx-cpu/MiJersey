import { calculateSlaDueDates, isFirstResponseBreached, isResolutionBreached } from './sla.util';
import { TicketPriority, TicketStatus } from './support-enums';

describe('calculateSlaDueDates', () => {
  it.each([
    [TicketPriority.URGENT, 1, 4],
    [TicketPriority.HIGH, 4, 24],
    [TicketPriority.MEDIUM, 8, 48],
    [TicketPriority.LOW, 24, 72],
  ])('computes due dates for %s priority', (priority, firstResponseHours, resolutionHours) => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const { firstResponseDueAt, resolutionDueAt } = calculateSlaDueDates(priority, createdAt);

    expect(firstResponseDueAt.getTime() - createdAt.getTime()).toBe(
      firstResponseHours * 60 * 60 * 1000,
    );
    expect(resolutionDueAt.getTime() - createdAt.getTime()).toBe(resolutionHours * 60 * 60 * 1000);
  });
});

describe('isFirstResponseBreached', () => {
  it('is breached when the due date has passed and nobody has responded yet', () => {
    const ticket = {
      status: TicketStatus.OPEN,
      firstResponseDueAt: new Date('2026-01-01T00:00:00.000Z'),
      resolutionDueAt: new Date('2026-01-02T00:00:00.000Z'),
      firstRespondedAt: null,
    };

    expect(isFirstResponseBreached(ticket, new Date('2026-01-01T01:00:00.000Z'))).toBe(true);
  });

  it('is not breached once a first response was recorded, even past the due date', () => {
    const ticket = {
      status: TicketStatus.IN_PROGRESS,
      firstResponseDueAt: new Date('2026-01-01T00:00:00.000Z'),
      resolutionDueAt: new Date('2026-01-02T00:00:00.000Z'),
      firstRespondedAt: new Date('2026-01-01T00:30:00.000Z'),
    };

    expect(isFirstResponseBreached(ticket, new Date('2026-01-01T02:00:00.000Z'))).toBe(false);
  });

  it('is not breached before the due date', () => {
    const ticket = {
      status: TicketStatus.OPEN,
      firstResponseDueAt: new Date('2026-01-01T00:00:00.000Z'),
      resolutionDueAt: new Date('2026-01-02T00:00:00.000Z'),
      firstRespondedAt: null,
    };

    expect(isFirstResponseBreached(ticket, new Date('2025-12-31T23:00:00.000Z'))).toBe(false);
  });
});

describe('isResolutionBreached', () => {
  it('is breached when the due date has passed and the ticket is still open', () => {
    const ticket = {
      status: TicketStatus.IN_PROGRESS,
      firstResponseDueAt: new Date('2026-01-01T00:00:00.000Z'),
      resolutionDueAt: new Date('2026-01-02T00:00:00.000Z'),
      firstRespondedAt: new Date('2026-01-01T00:30:00.000Z'),
    };

    expect(isResolutionBreached(ticket, new Date('2026-01-03T00:00:00.000Z'))).toBe(true);
  });

  it.each([TicketStatus.RESOLVED, TicketStatus.CLOSED])(
    'is never breached once the ticket is %s',
    (status) => {
      const ticket = {
        status,
        firstResponseDueAt: new Date('2026-01-01T00:00:00.000Z'),
        resolutionDueAt: new Date('2026-01-02T00:00:00.000Z'),
        firstRespondedAt: new Date('2026-01-01T00:30:00.000Z'),
      };

      expect(isResolutionBreached(ticket, new Date('2026-01-03T00:00:00.000Z'))).toBe(false);
    },
  );
});
