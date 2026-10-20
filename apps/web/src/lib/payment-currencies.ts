import type { Currency } from '@safer/contracts';
export const paymentCurrencies: { code: Currency; name: string; image: string }[] = [
  { code: 'NGN', name: 'Nigerian naira', image: '/images/flags/ng.svg' },
  { code: 'USD', name: 'US dollar', image: '/images/flags/us.svg' },
  { code: 'EUR', name: 'Euro', image: '/images/flags/eu.svg' },
  { code: 'USDC', name: 'USD Coin', image: '/images/flags/usdc.svg' },
];
export const paymentCurrency = (currency: Currency) =>
  paymentCurrencies.find((c) => c.code === currency)!;
export const bankPaymentLabel = (currency: Currency) =>
  currency === 'USD'
    ? 'US virtual account'
    : currency === 'EUR'
      ? 'Euro bank transfer'
      : 'Naira bank transfer';
