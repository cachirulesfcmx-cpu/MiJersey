/** Payment Method Selector (spec 022 §6). Solo "Pago manual" tiene una implementación real en el backend (`ManualPaymentProvider`) — Stripe/Mercado Pago/PayPal se muestran deshabilitados como "próximamente" en vez de simular una integración que no existe (no hay credenciales de esos proveedores en este entorno). */
export function PaymentMethodSelector({
  isSubmitting,
  onPay,
}: {
  isSubmitting: boolean;
  onPay: () => void;
}) {
  return (
    <div className="card-arena flex flex-col gap-4">
      <h2 className="section-heading text-xl">Método de pago</h2>

      <div className="flex flex-col gap-2">
        <label className="border-pop-500 bg-pop-500/5 flex items-center gap-3 rounded-2xl border-2 p-3 text-sm">
          <input type="radio" name="payment-method" checked readOnly className="accent-pop-500" />
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
            className="flex items-center gap-3 rounded-2xl border-2 border-neutral-200 p-3 text-sm text-neutral-400"
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
        className="btn-pop self-start disabled:opacity-40"
      >
        {isSubmitting ? 'Procesando…' : 'Pagar'}
      </button>
    </div>
  );
}
