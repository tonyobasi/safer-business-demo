import type { Payment } from '@safer/contracts';
import { useState } from 'react';
import { Button, Dialog, useToast } from '../../components/ui';
import { date, money } from '../../lib/money';
export function receiptText(payment: Payment, business: string) {
  return [
    `${business} · Payment receipt`,
    `Status: ${payment.status === 'paid' ? 'Completed' : payment.status[0].toUpperCase() + payment.status.slice(1)}`,
    `Amount: ${money(payment.amountMinor, payment.currency)} ${payment.currency === 'USDC' ? '' : payment.currency}`.trim(),
    `Customer: ${payment.customer}`,
    `Payment for: ${payment.description}`,
    `Payment method: ${payment.method}`,
    `Date: ${date(payment.createdAt)}`,
    `Transaction reference: ${payment.id}`,
    'Illustrative demo payment · No real funds transferred.',
  ].join('\n');
}
export async function shareReceipt(
  text: string,
): Promise<'shared' | 'copied' | 'cancelled' | 'manual'> {
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Payment receipt', text });
      return 'shared';
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError')
        return 'cancelled';
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'manual';
  }
}
export default function ReceiptActions({
  payment,
  business,
}: {
  payment: Payment;
  business: string;
}) {
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState(false);
  const toast = useToast();
  const text = receiptText(payment, business);
  return (
    <>
      <div className="receipt-actions">
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const result = await shareReceipt(text);
              if (result === 'copied')
                toast('Receipt details copied. Paste them into the app you want to share with.');
              if (result === 'manual') setManual(true);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? 'Preparing…' : 'Share receipt'}
        </Button>
        <button type="button" className="receipt-print-text" onClick={() => window.print()}>
          Print receipt
        </button>
      </div>
      {manual && (
        <Dialog title="Share receipt" onClose={() => setManual(false)}>
          <p>Copy these receipt details and paste them into your preferred app.</p>
          <label>
            Receipt details
            <textarea
              readOnly
              rows={12}
              value={text}
              onFocus={(event) => event.currentTarget.select()}
            />
          </label>
        </Dialog>
      )}
    </>
  );
}
