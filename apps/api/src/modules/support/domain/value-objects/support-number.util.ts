import { randomUUID } from 'node:crypto';

function datedSuffix(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${date}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export function generateTicketNumber(): string {
  return `TCK-${datedSuffix()}`;
}

export function generateRmaNumber(): string {
  return `RMA-${datedSuffix()}`;
}
