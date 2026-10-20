import { describe, expect, it } from 'vitest';
import { prepareResponse } from './agent-engine';
describe('demo agent interpretation', () => {
  it('preserves explicit dollar currency and amount', () =>
    expect(prepareResponse('Create a payment link for $120.09')).toMatchObject({
      card: 'link',
      currency: 'USD',
      amount: '120.09',
    }));
  it('understands a naira amount', () =>
    expect(prepareResponse('Create a link for 85000 naira')).toMatchObject({
      card: 'link',
      currency: 'NGN',
      amount: '85000',
    }));
  it('asks for review rather than claiming a payment was received', () => {
    const r = prepareResponse('create a payment link');
    expect(r.amount).toBe('');
    expect(r.text).toContain('Review');
  });
  it('routes stock and delivery queries to business cards', () => {
    expect(prepareResponse('What stock remains?').card).toBe('stock');
    expect(prepareResponse('Connect me to a rider').card).toBe('delivery');
  });
});
it('recognizes euro and USDC payment link requests', () => {
  expect(prepareResponse('Create a payment link for EUR 25')).toMatchObject({
    currency: 'EUR',
    amount: '25',
  });
  expect(prepareResponse('Create a payment link for 30 USDC')).toMatchObject({
    currency: 'USDC',
    amount: '30',
  });
});
