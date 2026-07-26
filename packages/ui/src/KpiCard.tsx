export interface KpiCardProps {
  label: string;
  value: number | string;
  /** false cuando el dato todavía no lo provee ningún módulo de negocio. */
  available?: boolean;
  hint?: string;
}

export function KpiCard({ label, value, available = true, hint }: KpiCardProps) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-neutral-200 p-4">
      <span className="text-sm text-neutral-500">{label}</span>
      {available ? (
        <span className="text-2xl font-semibold text-neutral-900">{value}</span>
      ) : (
        <span className="text-sm text-neutral-400">No disponible aún</span>
      )}
      {hint && <span className="text-xs text-neutral-400">{hint}</span>}
    </div>
  );
}
