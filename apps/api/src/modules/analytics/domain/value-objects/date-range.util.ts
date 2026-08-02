const DEFAULT_RANGE_DAYS = 30;
const MAX_RANGE_DAYS = 366;

export interface DateRange {
  from: Date;
  to: Date;
}

export interface DateRangeInput {
  from?: string;
  to?: string;
}

/** Resuelve un rango de fechas para un reporte (spec §4 "permitir filtros por fecha") — sin `from`/`to`, usa los últimos 30 días; siempre acota a un máximo de un año para no permitir agregaciones sobre todo el histórico en una sola consulta (spec §8 "rendimiento adecuado para grandes volúmenes de datos"). */
export function resolveDateRange(input: DateRangeInput): DateRange {
  const to = input.to ? new Date(input.to) : new Date();
  const from = input.from
    ? new Date(input.from)
    : new Date(to.getTime() - DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new RangeError('from/to deben ser fechas válidas');
  }
  if (from > to) {
    throw new RangeError('from no puede ser posterior a to');
  }

  const spanDays = (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000);
  if (spanDays > MAX_RANGE_DAYS) {
    throw new RangeError(`el rango no puede superar ${MAX_RANGE_DAYS} días`);
  }

  return { from, to };
}

export function dateRangeCacheParams(range: DateRange): Record<string, string> {
  return { from: range.from.toISOString(), to: range.to.toISOString() };
}
