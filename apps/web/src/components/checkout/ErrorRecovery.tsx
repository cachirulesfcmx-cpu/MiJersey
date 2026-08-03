/** Recuperación de errores del checkout (spec §7): un banner con el motivo (p. ej. stock insuficiente detectado en la revisión) y una acción para reintentar, en vez de dejar al usuario atorado en un formulario que ya falló. */
export function ErrorRecovery({
  message,
  onRetry,
  retryLabel = 'Reintentar',
}: {
  message: string;
  onRetry: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="border-danger-200 bg-danger-50 flex flex-col gap-3 rounded-2xl border p-4">
      <p className="text-danger-700 text-sm">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="border-danger-300 text-danger-700 self-start rounded-full border px-4 py-1.5 text-sm font-medium transition-colors hover:bg-white"
      >
        {retryLabel}
      </button>
    </div>
  );
}
