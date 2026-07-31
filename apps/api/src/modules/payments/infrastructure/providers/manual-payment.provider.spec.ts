import { createHmac } from 'node:crypto';

import type { AppConfig } from '../../../../config/env.schema';
import { ManualPaymentProvider } from './manual-payment.provider';

function buildProvider(secret = 'test-secret-1234567890'): ManualPaymentProvider {
  const config = { paymentsManualWebhookSecret: secret } as AppConfig;
  return new ManualPaymentProvider(config);
}

describe('ManualPaymentProvider', () => {
  it('authorizes with a namespaced transaction id', async () => {
    const provider = buildProvider();

    const result = await provider.authorize({ orderId: 'order-1', amount: 100, currency: 'MXN' });

    expect(result.status).toBe('AUTHORIZED');
    expect(result.transactionId).toMatch(/^MANUAL-/);
  });

  it('captures a given transaction', async () => {
    const provider = buildProvider();

    const result = await provider.capture('MANUAL-abc');

    expect(result.status).toBe('CAPTURED');
  });

  it('refunds fully when no amount is given', async () => {
    const provider = buildProvider();

    const result = await provider.refund('MANUAL-abc');

    expect(result.status).toBe('REFUNDED');
  });

  it('refunds partially when an amount is given', async () => {
    const provider = buildProvider();

    const result = await provider.refund('MANUAL-abc', 50);

    expect(result.status).toBe('PARTIALLY_REFUNDED');
  });

  describe('verifyWebhookSignature', () => {
    it('accepts a signature computed with the configured secret', () => {
      const provider = buildProvider('shared-secret-value');
      const payload = JSON.stringify({ transactionId: 'MANUAL-abc', eventType: 'captured' });
      const signature = createHmac('sha256', 'shared-secret-value').update(payload).digest('hex');

      expect(provider.verifyWebhookSignature(payload, signature)).toBe(true);
    });

    it('rejects a signature computed with the wrong secret', () => {
      const provider = buildProvider('shared-secret-value');
      const payload = JSON.stringify({ transactionId: 'MANUAL-abc', eventType: 'captured' });
      const signature = createHmac('sha256', 'wrong-secret').update(payload).digest('hex');

      expect(provider.verifyWebhookSignature(payload, signature)).toBe(false);
    });

    it('rejects a missing signature', () => {
      const provider = buildProvider();

      expect(provider.verifyWebhookSignature('{}', undefined)).toBe(false);
    });

    it('rejects a tampered payload', () => {
      const provider = buildProvider('shared-secret-value');
      const payload = JSON.stringify({ transactionId: 'MANUAL-abc', eventType: 'captured' });
      const signature = createHmac('sha256', 'shared-secret-value').update(payload).digest('hex');
      const tamperedPayload = JSON.stringify({
        transactionId: 'MANUAL-xyz',
        eventType: 'captured',
      });

      expect(provider.verifyWebhookSignature(tamperedPayload, signature)).toBe(false);
    });
  });
});
