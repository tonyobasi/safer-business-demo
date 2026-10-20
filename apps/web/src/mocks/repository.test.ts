import type { LinkInput } from '@safer/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('optional stablecoin checkout', () => {
  it.each(['USD', 'NGN'] as const)(
    'persists USDC preference for %s and supports demo settlement',
    (currency) => {
      const link = repo.createLink(
        { ...input, currency, allowStablecoin: true },
        `usdc-${currency}`,
      );
      expect(repo.link(link.id).allowStablecoin).toBe(true);
      expect(repo.settle(link.id, 'paid', 'USDC').status).toBe('paid');
      expect(repo.read().payments.find((p) => p.linkId === link.id)?.method).toBe('USDC');
    },
  );
  it('keeps new links bank-only unless the merchant enables stablecoin', () => {
    const link = repo.createLink(input, 'bank-only');
    expect(link.allowStablecoin).toBe(false);
    expect(() => repo.settle(link.id, 'paid', 'USDC')).toThrow(
      'Stablecoin payments are not enabled',
    );
    expect(repo.link(link.id).status).toBe('pending');
  });
});

describe('EUR and USDC payment links', () => {
  it.each(['EUR', 'USDC'] as const)(
    'creates, reloads and settles a %s invoice in its own balance',
    (currency) => {
      const link = repo.createLink({ ...input, currency }, `invoice-${currency}`);
      expect(repo.link(link.id).currency).toBe(currency);
      repo.reload();
      expect(repo.link(link.id).currency).toBe(currency);
      repo.settle(link.id, 'paid', currency === 'USDC' ? 'USDC' : 'Euro bank transfer');
      expect(repo.read().balances[currency].available).toBe('12009');
    },
  );
  it('automatically enables stablecoin checkout for a USDC invoice', () => {
    expect(
      repo.createLink({ ...input, currency: 'USDC', allowStablecoin: false }, 'usdc-invoice')
        .allowStablecoin,
    ).toBe(true);
  });
});

describe('merchant products and visitor storefront', () => {
  const product = {
    name: 'Everyday linen set',
    sku: 'NEW-LINEN-001',
    amount: '15000.50',
    currency: 'NGN' as const,
    quantity: 8,
    businessType: 'Fashion & accessories',
    category: 'Clothing',
    subcategory: 'Two-piece sets',
    description: 'A comfortable linen set for everyday wear.',
    images: ['data:image/jpeg;base64,dGVzdA=='],
    visibility: 'draft' as 'draft' | 'published',
  };
  it('keeps drafts private and exposes only customer product details after publishing', () => {
    const draft = repo.saveProduct(product);
    expect(repo.storefront().products.some((p) => p.id === draft.id)).toBe(false);
    repo.saveProduct({ ...product, visibility: 'published' }, draft.id);
    const visible = repo.storefront().products.find((p) => p.id === draft.id)!;
    expect(visible.amountMinor).toBe('1500050');
    expect(visible).not.toHaveProperty('sku');
    expect(visible).not.toHaveProperty('sold');
    expect(repo.storefront()).not.toHaveProperty('profile');
    repo.saveProduct(product, draft.id);
    expect(repo.storefront().products.some((p) => p.id === draft.id)).toBe(false);
  });
  it('validates publication completeness, taxonomy and duplicate SKUs', () => {
    expect(() => repo.saveProduct({ ...product, images: [], visibility: 'published' })).toThrow(
      'Published products need',
    );
    expect(() => repo.saveProduct({ ...product, businessType: 'Electronics' })).toThrow(
      'category and subcategory',
    );
    repo.saveProduct(product);
    expect(() => repo.saveProduct({ ...product, sku: 'new-linen-001' })).toThrow(
      'SKU already exists',
    );
  });
  it('preserves recorded sales and remaining stock when product details change', () => {
    const created = repo.saveProduct(product);
    repo.stock(created.id, 2, 'sale', 'product-sale');
    const edited = repo.saveProduct(
      { ...product, name: 'Updated linen set', quantity: 100, visibility: 'published' },
      created.id,
    );
    expect(edited.sold).toBe(2);
    expect(edited.remaining).toBe(6);
    expect(repo.storefront().products.find((p) => p.id === created.id)?.name).toBe(
      'Updated linen set',
    );
  });
  it('rolls back a product save when browser storage is full', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });
    const before = repo.read().items.length;
    expect(() => repo.saveProduct(product)).toThrow('Device storage is full');
    expect(repo.read().items).toHaveLength(before);
    spy.mockRestore();
  });
});
