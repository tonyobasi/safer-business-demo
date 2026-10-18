import type { LinkInput } from '@safer/contracts';
import { beforeEach, describe, expect, it } from 'vitest';
import { repo } from './repository';
const input: LinkInput = {
  title: 'Test linen set',
  amount: '120.09',
  currency: 'USD',
  customer: 'Test Customer',
  email: '',
  expires: '30',
};
beforeEach(() => repo.reset());
describe('demo payment lifecycle', () => {
  it('deduplicates link creation and credits only once', () => {
    const before = BigInt(repo.read().balances.USD.available);
    const first = repo.createLink(input, 'request-1');
    expect(repo.createLink(input, 'request-1').id).toBe(first.id);
    repo.settle(first.id, 'paid', 'US virtual account');
    repo.settle(first.id, 'paid', 'US virtual account');
    expect(BigInt(repo.read().balances.USD.available)).toBe(before + 12009n);
    expect(repo.read().payments.filter((p) => p.linkId === first.id)).toHaveLength(1);
  });
  it('does not credit failures and permits a successful retry', () => {
    const before = repo.read().balances.NGN.available;
    const link = repo.createLink({ ...input, currency: 'NGN', amount: '85000' }, 'request-2');
    repo.settle(link.id, 'failed', 'Bank transfer');
    expect(repo.read().balances.NGN.available).toBe(before);
    repo.settle(link.id, 'paid', 'Bank transfer');
    expect(BigInt(repo.read().balances.NGN.available)).toBe(BigInt(before) + 8500000n);
  });
  it('keeps recorded sales independent from received money', () => {
    const before = repo.read();
    repo.stock('linen', 3, 'sale', 'sale-1');
    repo.stock('linen', 3, 'sale', 'sale-1');
    const after = repo.read();
    expect(after.items[0].remaining).toBe(15);
    expect(after.items[0].sold).toBe(35);
    expect(after.balances).toEqual(before.balances);
  });
  it('rejects overselling and fractional quantities atomically', () => {
    expect(() => repo.stock('linen', 19, 'sale', 'sale-2')).toThrow('exceeds');
    expect(() => repo.stock('linen', 1.5, 'sale', 'sale-3')).toThrow('whole');
    expect(repo.read().items[0].remaining).toBe(18);
  });
  it('validates a delivery before a booking is recorded', () => {
    expect(() =>
      repo.delivery(
        { customer: 'A', phone: 'x', pickup: 'x', destination: 'x', item: '' },
        'delivery-1',
      ),
    ).toThrow();
    expect(repo.read().deliveries).toHaveLength(1);
  });
});
describe('catalogue creation', () => {
  it('records opening stock once for an idempotent request', () => {
    const input = {
      name: 'New linen set',
      sku: 'ADA-NEW-1',
      category: 'Clothing' as const,
      quantity: 12,
      amount: '15000',
      currency: 'NGN' as const,
    };
    repo.addItem(input, 'add-1');
    repo.addItem(input, 'add-1');
    expect(repo.read().items).toHaveLength(5);
    expect(repo.read().items[0]).toMatchObject({ sold: 0, remaining: 12, amountMinor: '1500000' });
  });
  it('rejects duplicate SKUs without changing stock', () => {
    expect(() =>
      repo.addItem(
        {
          name: 'Duplicate item',
          sku: 'ada-lin-001',
          category: 'Clothing',
          quantity: 12,
          amount: '0',
          currency: 'NGN',
        },
        'add-2',
      ),
    ).toThrow('SKU already exists');
    expect(repo.read().items).toHaveLength(4);
  });
});
