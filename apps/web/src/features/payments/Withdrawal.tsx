import { useState } from 'react';
import { Button, useToast } from '../../components/ui';
import { useWorkspace } from '../../lib/api';
import { money, toMinor } from '../../lib/money';
export default function Withdrawal({ onDone }: { onDone: () => void }) {
  const [currency, setCurrency] = useState<'USD' | 'NGN'>('NGN');
  const [amount, setAmount] = useState('');
  const [bank, setBank] = useState('');
  const [error, setError] = useState('');
  const [review, setReview] = useState(false);
  const toast = useToast();
  const { data } = useWorkspace();
  return (
    <form
      className="stack-form withdrawal-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!review) {
          const b = data?.balances[currency].available || '0';
          let minor = 0n;
          try {
            minor = BigInt(toMinor(amount));
          } catch {
            minor = 0n;
          }
          if (minor <= 0n || minor > BigInt(b)) {
            setError('Enter an amount within your available balance.');
            return;
          }
          setError('');
          setReview(true);
        } else {
          toast('Demo withdrawal reviewed. No funds have moved.');
          onDone();
        }
      }}
    >
      {review ? (
        <>
          <div className="notice">
            Demo review only. Withdrawals require the live backend and an approved payout account.
          </div>
          <div className="detail-rows">
            <div>
              <span>Amount</span>
              <strong>
                {currency} {amount}
              </strong>
            </div>
            <div>
              <span>Destination</span>
              <strong>{bank}</strong>
            </div>
            <div>
              <span>Fees</span>
              <strong>Determined by the live provider</strong>
            </div>
          </div>
          <Button type="button" variant="ghost" onClick={() => setReview(false)}>
            Edit details
          </Button>
        </>
      ) : (
        <>
          <label>
            Currency
            <select value={currency} onChange={(e) => setCurrency(e.target.value as 'USD' | 'NGN')}>
              <option>NGN</option>
              <option>USD</option>
            </select>
          </label>
          <div className="withdrawal-balance">
            <div>
              <span>Available to withdraw</span>
              <img
                src={`/images/flags/${currency === 'USD' ? 'us' : 'ng'}.svg`}
                alt={currency === 'USD' ? 'United States flag' : 'Nigeria flag'}
                width={28}
                height={20}
              />
            </div>
            <strong>{money(data?.balances[currency].available || '0', currency)}</strong>
            <small>{currency} wallet</small>
          </div>
          <label>
            Amount
            <input
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </label>
          <label>
            Payout account label
            <input
              placeholder="My business bank account"
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              required
              minLength={3}
            />
          </label>
        </>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <Button>{review ? 'Finish demo review' : 'Review withdrawal'}</Button>
    </form>
  );
}
