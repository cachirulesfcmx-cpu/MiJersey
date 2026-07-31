'use client';

import type { PaymentSummary } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, DataTable, FormField, Input, Pagination } from '@mijersey/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

const PAGE_SIZE = 20;

function formatPrice(amount: number, currency: string): string {
  return amount.toLocaleString('es-MX', { style: 'currency', currency });
}

/**
 * Refund History (spec 022 §6). También incluye un formulario mínimo para iniciar un reembolso —
 * sin él, esta pantalla nunca tendría datos que mostrar. Requiere el id del pago (no hay todavía un
 * buscador de pagos por pedido en el Orders Dashboard, 021); un agente lo obtiene del registro de
 * auditoría (`payment.captured`) hasta que exista esa pieza adicional.
 */
export default function PaymentsPage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [refunds, setRefunds] = useState<PaymentSummary[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [paymentId, setPaymentId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundMessage, setRefundMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await client.listRefunds(accessToken, { page, pageSize: PAGE_SIZE });
      setRefunds(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar el historial.');
    }
  }, [client, accessToken, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRefund(event: React.FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setIsRefunding(true);
    setRefundMessage(null);
    setError(null);
    try {
      await client.refundPayment(accessToken, {
        paymentId,
        ...(amount ? { amount: Number(amount) } : {}),
        ...(reason ? { reason } : {}),
      });
      setRefundMessage('Reembolso procesado correctamente.');
      setPaymentId('');
      setAmount('');
      setReason('');
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo procesar el reembolso.');
    } finally {
      setIsRefunding(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Reembolsos</h1>

      <form
        onSubmit={handleRefund}
        className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4"
      >
        <h2 className="text-sm font-semibold text-neutral-900">Iniciar reembolso</h2>
        {error && <p className="text-danger-600 text-sm">{error}</p>}
        {refundMessage && <p className="text-success-600 text-sm">{refundMessage}</p>}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FormField label="Id del pago" htmlFor="payment-id">
            <Input
              id="payment-id"
              value={paymentId}
              onChange={(event) => setPaymentId(event.target.value)}
              required
            />
          </FormField>
          <FormField label="Monto (opcional, total si se omite)" htmlFor="amount">
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </FormField>
          <FormField label="Motivo (opcional)" htmlFor="reason">
            <Input id="reason" value={reason} onChange={(event) => setReason(event.target.value)} />
          </FormField>
        </div>

        <Button type="submit" isLoading={isRefunding} className="self-start">
          Reembolsar
        </Button>
      </form>

      <DataTable<PaymentSummary>
        isLoading={!refunds}
        rows={refunds ?? []}
        getRowKey={(payment) => payment.id}
        emptyTitle="Sin reembolsos"
        columns={[
          { key: 'orderId', header: 'Pedido', render: (payment) => payment.orderId },
          { key: 'provider', header: 'Proveedor', render: (payment) => payment.provider },
          { key: 'status', header: 'Estado', render: (payment) => payment.status },
          {
            key: 'amount',
            header: 'Monto',
            render: (payment) => formatPrice(payment.amount, payment.currency),
          },
          {
            key: 'refundedAt',
            header: 'Fecha',
            render: (payment) =>
              payment.refundedAt ? new Date(payment.refundedAt).toLocaleString('es-MX') : '—',
          },
        ]}
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}
