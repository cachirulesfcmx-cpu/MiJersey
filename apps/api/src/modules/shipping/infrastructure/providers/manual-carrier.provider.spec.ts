import { ManualCarrierProvider } from './manual-carrier.provider';

describe('ManualCarrierProvider', () => {
  it('generates a namespaced tracking number and no label URL', async () => {
    const provider = new ManualCarrierProvider();

    const result = await provider.createShipment({ orderId: 'order-1', carrierId: 'carrier-1' });

    expect(result.trackingNumber).toMatch(/^MJ-/);
    expect(result.labelUrl).toBeNull();
  });

  it('generates distinct tracking numbers on each call', async () => {
    const provider = new ManualCarrierProvider();

    const first = await provider.createShipment({ orderId: 'order-1', carrierId: 'carrier-1' });
    const second = await provider.createShipment({ orderId: 'order-1', carrierId: 'carrier-1' });

    expect(first.trackingNumber).not.toBe(second.trackingNumber);
  });
});
