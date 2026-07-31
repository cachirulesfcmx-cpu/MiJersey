export interface ProviderAuthorizeInput {
  orderId: string;
  amount: number;
  currency: string;
}

export interface ProviderAuthorizeResult {
  transactionId: string;
  status: 'AUTHORIZED' | 'FAILED';
  raw: Record<string, unknown>;
}

export interface ProviderCaptureResult {
  status: 'CAPTURED' | 'FAILED';
  raw: Record<string, unknown>;
}

export interface ProviderRefundResult {
  status: 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'FAILED';
  raw: Record<string, unknown>;
}

/**
 * Adaptador por proveedor (spec §5 "adaptadores de proveedores") — Stripe, Mercado Pago o PayPal
 * implementarían esta misma interfaz. Solo `ManualPaymentProvider` (efectivo/transferencia,
 * confirmado por staff) tiene una implementación real en este módulo: es el único proveedor
 * verificable de punta a punta sin credenciales de un servicio externo. Los demás quedan
 * "preparados para integración" (la propia spec los condiciona así) — agregarlos es implementar
 * esta interfaz y registrarlos en `PaymentProviderRegistry`, sin tocar casos de uso ni endpoints.
 */
export interface PaymentProviderPort {
  readonly name: string;
  authorize(input: ProviderAuthorizeInput): Promise<ProviderAuthorizeResult>;
  capture(transactionId: string): Promise<ProviderCaptureResult>;
  refund(transactionId: string, amount?: number): Promise<ProviderRefundResult>;
  /** Verifica la firma HMAC de un webhook contra el cuerpo recibido (spec §8 "verificación de firmas de webhooks"). */
  verifyWebhookSignature(payload: string, signature: string | undefined): boolean;
}
