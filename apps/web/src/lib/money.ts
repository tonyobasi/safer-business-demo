import type { Currency } from '@safer/contracts';
export function toMinor(value: string): string {
  if (!/^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(value)) throw new Error('Invalid monetary amount');
  const [whole, fraction = ''] = value.split('.');
  return (BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'))).toString();
}
export function money(value: string, currency: Currency | 'EUR' | 'GBP') {
  const minor = BigInt(value);
  const sign = minor < 0n ? '-' : '';
  const abs = minor < 0n ? -minor : minor;
  const symbol = { USD: '$', NGN: '₦', EUR: '€', GBP: '£' }[currency];
  return `${sign}${symbol}${(abs / 100n).toLocaleString('en-US')}.${(abs % 100n).toString().padStart(2, '0')}`;
}
export function date(value: string) {
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}
