/** Payment Method Selector (spec 022 §6). Solo "Pago manual" tiene una implementación real en el backend (`ManualPaymentProvider`) — Stripe/Mercado Pago/PayPal se muestran deshabilitados como "próximamente" en vez de simular una integración que no existe (no hay credenciales de esos proveedores en este entorno). */
export function PaymentMethodSelector({
  isSubmitting,
  onPay,
}: {
  isSubmitting: boolean;
  onPay: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-md border border-neutral-200 p-6">
      <h2 className="text-lg font-semibold text-neutral-900">Método de pago</h2>

      <div className="flex flex-col gap-2">
        <label className="border-brand-500 bg-brand-50 flex items-center gap-3 rounded-md border p-3 text-sm">
          <input type="radio" name="payment-method" checked readOnly className="accent-brand-600" />
          <div>
            <span className="font-medium text-neutral-900">
              Pago manual (efectivo / transferencia)
            </span>
            <p className="text-xs text-neutral-500">
              Confirma tu pedido y realiza el pago; un agente lo validará.
            </p>
          </div>
        </label>

        {['Tarjeta (Stripe)', 'Mercado Pago', 'PayPal'].map((label) => (
          <label
            key={label}
            className="flex items-center gap-3 rounded-md border border-neutral-200 p-3 text-sm text-neutral-400"
          >
            <input type="radio" name="payment-method" disabled />
            <div>
              <span>{label}</span>
              <p className="text-xs">Próximamente</p>
            </div>
          </label>
        ))}
      </div>

      <button
        type="button"
        disabled={isSubmitting}
        onClick={onPay}
        className="bg-brand-600 hover:bg-brand-700 self-start rounded-md px-4 py-2 text-sm font-medium text-white disabled:bg-neutral-300"
      >
        {isSubmitting ? 'Procesando…' : 'Pagar'}
      </button>
    </div>
  );
}
