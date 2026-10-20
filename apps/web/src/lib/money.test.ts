import { linkSchema } from '@safer/contracts';
import { describe, expect, it } from 'vitest';
import { money, toMinor } from './money';
describe('money contracts', () => {
  it('converts USD and NGN without floating point rounding', () => {
    expect(toMinor('120.09')).toBe('12009');
    expect(toMinor('85000')).toBe('8500000');
    expect(toMinor('0.29')).toBe('29');
    expect(toMinor('999999999.99')).toBe('99999999999');
  });
  it('formats exact minor units', () => {
    expect(money('128450000', 'NGN')).toBe('₦1,284,500.00');
    expect(money('12009', 'USD')).toBe('$120.09');
  });
  it.each(['1e3', '-1', '1.234', 'NaN', '1,200', '01'])('rejects ambiguous input %s', (v) =>
    expect(() => toMinor(v)).toThrow(),
  );
  it('rejects zero and unsupported currencies at the payment boundary', () => {
    const v = {
      title: 'Linen set',
      amount: '0',
      currency: 'USD',
      customer: '',
      email: '',
      expires: '30',
    };
    expect(linkSchema.safeParse(v).success).toBe(false);
    expect(linkSchema.safeParse({ ...v, amount: '120', currency: 'JPY' }).success).toBe(false);
  });
});
it('formats euro and USDC invoices without naira symbols', () => {
  expect(money('12009', 'EUR')).toBe('€120.09');
  expect(money('12009', 'USDC')).toBe('120.09 USDC');
});
