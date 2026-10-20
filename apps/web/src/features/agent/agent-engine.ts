import type { ChatMessage } from '@safer/contracts';
export function prepareResponse(text: string): Omit<ChatMessage, 'id' | 'role'> {
  const q = text.toLowerCase();
  if (/deliver|rider|courier/.test(q))
    return {
      text: 'Let’s get your delivery moving. Add the recipient and addresses, then review the quote before booking.',
      card: 'delivery',
    };
  if (/withdraw|payout/.test(q))
    return {
      text: 'Let’s prepare a withdrawal review. Check the amount and destination before continuing.',
      card: 'withdrawal',
    };
  if (/stock|sold|remaining|catalogue|inventory|bestseller/.test(q))
    return {
      text: 'Here’s your current stock snapshot. Your catalogue stays private to your business.',
      card: 'stock',
    };
  if (/link|charge|invoice|request.*pay/.test(q)) {
    const currency = /usdc/i.test(text)
      ? 'USDC'
      : /€|eur|euro/i.test(text)
        ? 'EUR'
        : /\$|usd|dollar/i.test(text)
          ? 'USD'
          : 'NGN';
    const amount =
      text
        .match(/(?:\$|₦|NGN\s*|USDC\s*|USD\s*|EUR\s*|€)([\d,]+(?:\.\d{1,2})?)/i)?.[1]
        ?.replaceAll(',', '') ||
      text.match(/(\d+(?:\.\d{1,2})?)\s*(?:naira|dollars?|usdc|usd|ngn|euros?|eur)/i)?.[1] ||
      '';
    return {
      text: 'I can prepare that payment link. Review the amount, currency and description below, then confirm when everything looks right.',
      card: 'link',
      currency,
      amount,
    };
  }
  if (/payment|balance|money|received|sales/.test(q))
    return {
      text: 'Here are your recent payments. Confirmed and pending payments are shown separately.',
      card: 'payments',
    };
  return {
    text: 'I can help you create a payment link, check sold and remaining stock, review payments or request a delivery. What would you like to do next?',
  };
}
