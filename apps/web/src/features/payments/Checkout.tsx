import { allowsStablecoin, type PaymentLink } from '@safer/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Clock, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Button, CopyButton, ErrorState, Loading, Logo } from '../../components/ui';
import { api, isDemo } from '../../lib/api';
import { date, money } from '../../lib/money';
export default function Checkout() {
  const { token } = useParams();
  const client = useQueryClient();
  const {
    data: link,
    isPending,
    error,
  } = useQuery({
    queryKey: ['checkout', token],
    queryFn: () => api<PaymentLink>(`/payment-links/${token}`),
    refetchInterval: 4000,
  });
  const [method, setMethod] = useState<'bank' | 'usdc'>('bank');
  const [pending, setPending] = useState(false);
  const mutate = useMutation({
    mutationFn: (status: 'paid' | 'failed') =>
      api(`/payment-links/${token}/simulate`, {
        status,
        method:
          method === 'usdc' && link && allowsStablecoin(link)
            ? 'USDC'
            : link?.currency === 'USD'
              ? 'US virtual account'
              : 'Bank transfer',
      }),
    onSuccess: () => {
      setPending(false);
      client.invalidateQueries({ queryKey: ['checkout', token] });
      client.invalidateQueries({ queryKey: ['workspace'] });
    },
  });
  if (isPending) return <Loading />;
  if (error || !link)
    return (
      <div className="checkout-page">
        <Logo />
        <ErrorState message={error?.message || 'Invalid payment link.'} />
      </div>
    );
  const expired = new Date(link.expiresAt).getTime() < Date.now() && link.status !== 'paid';
  const stablecoinEnabled = allowsStablecoin(link);
  const payingWithStablecoin = stablecoinEnabled && method === 'usdc';
  return (
    <div className="checkout-page modern-checkout">
      <Logo />
      <div className="checkout-card card">
        <p className="eyebrow checkout-security">
          <ShieldCheck size={13} /> Secure customer checkout
        </p>
        {expired ? (
          <>
            <div className="status-orbit error">
              <Clock />
            </div>
            <h1>This link has expired.</h1>
            <p>Please ask the merchant for a new payment link.</p>
          </>
        ) : link.status === 'paid' ? (
          <>
            <div className="status-orbit">
              <Check />
            </div>
            <h1>Payment successful.</h1>
            <p>Thank you. Your payment for {link.title} is complete.</p>
            <h2>{money(link.amountMinor, link.currency)}</h2>
            <div className="detail-rows">
              <div>
                <span>Reference</span>
                <strong>{link.id.slice(0, 12).toUpperCase()}</strong>
              </div>
              <div>
                <span>Customer</span>
                <strong>{link.customer || 'Guest customer'}</strong>
              </div>
              <div>
                <span>Invoice currency</span>
                <strong>{link.currency}</strong>
              </div>
            </div>
            <Button variant="secondary" onClick={() => window.print()}>
              Print receipt
            </Button>
          </>
        ) : link.status === 'failed' ? (
          <>
            <div className="status-orbit error">
              <X />
            </div>
            <h1>Payment wasn’t completed.</h1>
            <p>Your demo payment failed. Check the details and try again.</p>
            <Button disabled={mutate.isPending} onClick={() => mutate.mutate('paid')}>
              Retry demo payment
            </Button>
          </>
        ) : pending ? (
          <>
            <div className="status-orbit warning">
              <Clock />
            </div>
            <h1>Waiting for payment.</h1>
            <p>
              Your payment is pending confirmation. This page will update when the payment status
              changes.
            </p>
            <h2>{money(link.amountMinor, link.currency)}</h2>
            <Button variant="secondary" onClick={() => setPending(false)}>
              View payment details
            </Button>
          </>
        ) : (
          <>
            <div className="checkout-summary">
              <div className="checkout-summary-caption">
                <Badge>Payment request</Badge>
                <img
                  src={`/images/flags/${link.currency === 'USD' ? 'us' : 'ng'}.svg`}
                  alt={`${link.currency} flag`}
                  width={28}
                  height={20}
                />
              </div>
              <h1>{link.title}</h1>
              <h2 className="checkout-amount">
                {money(link.amountMinor, link.currency)} <small>{link.currency}</small>
              </h2>
              <p>
                {link.customer
                  ? `Prepared for ${link.customer}`
                  : 'Pay securely without creating an account.'}
              </p>
            </div>
            {stablecoinEnabled && (
              <div className="segmented">
                <button
                  aria-pressed={method === 'bank'}
                  className={method === 'bank' ? 'selected' : ''}
                  onClick={() => setMethod('bank')}
                >
                  {link.currency === 'USD' ? 'US virtual account' : 'Bank transfer'}
                </button>
                <button
                  aria-pressed={method === 'usdc'}
                  className={method === 'usdc' ? 'selected' : ''}
                  onClick={() => setMethod('usdc')}
                >
                  Stablecoin · USDC
                </button>
              </div>
            )}
            <div className="payment-instructions">
              {payingWithStablecoin ? (
                <>
                  <strong>Pay with USDC</strong>
                  <p>
                    A supported network and receiving address will be supplied by the live payment
                    provider.
                  </p>
                  {link.currency === 'NGN' && (
                    <p className="stablecoin-conversion-note">
                      Your invoice is in NGN. The live provider will quote the USDC amount and
                      conversion rate before payment. No conversion is calculated in this demo.
                    </p>
                  )}
                  <div className="notice">Demo address only · Do not send crypto.</div>
                  <input
                    aria-label="Demo USDC receiving address"
                    readOnly
                    value="DEMO-USDC-ADDRESS-NOT-FOR-PAYMENT"
                  />
                  <CopyButton value="DEMO-USDC-ADDRESS-NOT-FOR-PAYMENT" label="Copy demo address" />
                </>
              ) : (
                <>
                  <strong>
                    {link.currency === 'USD' ? 'US virtual account' : 'Naira bank transfer'}
                  </strong>
                  <div className="detail-rows">
                    <div>
                      <span>Bank</span>
                      <strong>Sandbox Bank · Demo</strong>
                    </div>
                    <div>
                      <span>Account name</span>
                      <strong>Safer Business Demo</strong>
                    </div>
                    <div>
                      <span>Account number</span>
                      <strong>DEMO ACCOUNT</strong>
                    </div>
                    <div>
                      <span>Transfer amount</span>
                      <strong>{money(link.amountMinor, link.currency)}</strong>
                    </div>
                    {link.currency === 'USD' && (
                      <div>
                        <span>Routing number</span>
                        <strong>DEMO ROUTING</strong>
                      </div>
                    )}
                  </div>
                  <div className="notice">These are sample details. Do not send money.</div>
                </>
              )}
            </div>
            <small className="muted">
              Expires {date(link.expiresAt)} · No customer account required
            </small>
          </>
        )}
        {isDemo && !expired && link.status !== 'paid' && (
          <div className="demo-controls">
            <span className="eyebrow">Demo checkout controls · No real payment</span>
            <div>
              <Button onClick={() => mutate.mutate('paid')} disabled={mutate.isPending}>
                {mutate.isPending ? 'Updating…' : 'Simulate successful payment'}
              </Button>
              <Button variant="secondary" onClick={() => setPending(true)}>
                Pending
              </Button>
              <Button
                variant="ghost"
                onClick={() => mutate.mutate('failed')}
                disabled={mutate.isPending}
              >
                Failed
              </Button>
            </div>
          </div>
        )}
        {mutate.error && (
          <p className="form-error" role="alert">
            {mutate.error.message}
          </p>
        )}
      </div>
      <p className="checkout-footer">
        <ShieldCheck size={14} />
        Powered by Safer Business · {isDemo ? 'Frontend demo' : 'Secure checkout'}
      </p>
    </div>
  );
}
