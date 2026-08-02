export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number;
}

function escapeCsvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Genera CSV en memoria (spec §6 "Report Export", §7 "GET /analytics/export") — sin librería externa: una lista de columnas con su propio extractor por fila es suficiente para los reportes de este módulo (ventas/clientes/productos/eventos), todos con un tamaño acotado por el rango de fechas (`resolveDateRange`). */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((column) => escapeCsvCell(column.header)).join(',');
  const lines = rows.map((row) =>
    columns.map((column) => escapeCsvCell(column.value(row))).join(','),
  );
  return [header, ...lines].join('\n');
}
