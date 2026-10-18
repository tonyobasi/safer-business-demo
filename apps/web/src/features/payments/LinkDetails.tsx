import { Link, useParams } from 'react-router-dom';
import { Link2 } from 'lucide-react';
import { CopyButton, ErrorState, Loading, PageHeading, Status } from '../../components/ui';
import { useWorkspace } from '../../lib/api';
import { date, money } from '../../lib/money';
export default function LinkDetails() {
  const { id } = useParams();
  const { data, isPending } = useWorkspace();
  if (isPending) return <Loading />;
  const l = data?.links.find((l) => l.id === id);
  if (!l) return <ErrorState message="This payment link could not be found." />;
  const url = `${location.origin}/pay/${l.id}`;
  return (
    <div className="page-content payment-link-details-page">
      <Link className="back-link" to="/app/payment-links">
        ← Payment links
      </Link>
      <PageHeading
        eyebrow="Ready to share"
        title="Your payment link is ready."
        description="A simple next step for your next sale."
      />
      <article className="payment-link-details-card">
        <header className="payment-link-summary">
          <div className="payment-link-brand">
            <img src="/images/logo.png" alt="" width={28} height={28} />
            <span>{data?.profile.business}</span>
            <Status value={l.status} />
          </div>
          <span className="payment-link-symbol" aria-hidden="true">
            <Link2 size={24} />
          </span>
          <p>{l.title}</p>
          <h2>
            {money(l.amountMinor, l.currency)} <small>{l.currency}</small>
          </h2>
          <span className="payment-link-summary-caption">Payment request</span>
        </header>
        <div className="payment-link-body">
          <div className="payment-link-info">
            <div>
              <span>Business</span>
              <strong>{data?.profile.business}</strong>
            </div>
            <div>
              <span>Customer</span>
              <strong>{l.customer || 'Anyone with the link'}</strong>
            </div>
            <div>
              <span>Expires</span>
              <strong>{date(l.expiresAt)}</strong>
            </div>
            <div>
              <span>Payment options</span>
              <strong>
                {l.currency === 'USD' ? 'US virtual account · USDC' : 'NGN bank transfer'}
              </strong>
            </div>
          </div>
          <div className="payment-link-share-panel">
            <h3>Share your payment link</h3>
            <p>Copy the link and send it to your customer.</p>
            <div className="share-link">
              <input
                aria-label="Payment link URL"
                readOnly
                value={url}
                onFocus={(e) => e.target.select()}
              />
              <CopyButton value={url} />
            </div>
          </div>
          <Link className="primary-link" to={`/pay/${l.id}`} target="_blank" rel="noreferrer">
            Preview customer checkout
          </Link>
          <p className="small-text muted">Your customer can pay without creating an account.</p>
        </div>
      </article>
    </div>
  );
}
