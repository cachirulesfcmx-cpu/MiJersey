import { InventoryConcurrencyError } from '../../domain/errors/inventory.errors';
import { applyMovementWithRetry } from './apply-movement-with-retry.util';

describe('applyMovementWithRetry', () => {
  it('returns the result on the first successful attempt', async () => {
    const attempt = jest.fn().mockResolvedValue('ok');

    await expect(applyMovementWithRetry(attempt, 3)).resolves.toBe('ok');
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it('retries after a conflict (null) until it succeeds', async () => {
    const attempt = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('ok');

    await expect(applyMovementWithRetry(attempt, 3)).resolves.toBe('ok');
    expect(attempt).toHaveBeenCalledTimes(3);
  });

  it('throws InventoryConcurrencyError after exhausting retries', async () => {
    const attempt = jest.fn().mockResolvedValue(null);

    await expect(applyMovementWithRetry(attempt, 3)).rejects.toBeInstanceOf(
      InventoryConcurrencyError,
    );
    expect(attempt).toHaveBeenCalledTimes(3);
  });

  it('propagates a thrown domain error immediately without retrying', async () => {
    class DomainError extends Error {}
    const attempt = jest.fn().mockRejectedValue(new DomainError('nope'));

    await expect(applyMovementWithRetry(attempt, 3)).rejects.toBeInstanceOf(DomainError);
    expect(attempt).toHaveBeenCalledTimes(1);
  });
});
