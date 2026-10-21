import { CircleCheck, ReceiptText } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ErrorState, Loading, PageHeading, Status } from '../../components/ui';
import { useWorkspace } from '../../lib/api';
import { date, money } from '../../lib/money';
import ReceiptActions from './ReceiptActions';
export default function PaymentDetails() {
  const { id } = useParams();
  const { data, isPending } = useWorkspace();
  if (isPending) return <Loading />;
  const p = data?.payments.find((p) => p.id === id);
  if (!p) return <ErrorState message="This payment could not be found." />;
  return (
    <div className="page-content payment-receipt-page">
      <Link className="back-link" to="/app/payments">
        ← Payments
      </Link>
      <PageHeading title="Payment receipt" description="Every detail, all in one place." />
      <article className="payment-receipt">
        <header className="payment-receipt-hero">
          <div className="receipt-brand">
            <img
              className="receipt-brand-logo"
              src="/images/logo.png"
              alt="Safer Business logo"
              width={28}
              height={28}
            />
            <span>SAFER BUSINESS</span>
            <span>{p.currency}</span>
          </div>
          <span
            className={`receipt-seal${p.status === 'paid' ? ' receipt-seal-success' : ''}`}
            aria-hidden="true"
          >
            {p.status === 'paid' ? (
              <CircleCheck size={46} strokeWidth={1.6} />
            ) : (
              <ReceiptText size={32} />
            )}
          </span>
          <p>{p.status === 'paid' ? 'Payment received' : 'Payment ' + p.status}</p>
          <h2>{money(p.amountMinor, p.currency)}</h2>
          <Status value={p.status} />
          <div className="receipt-hero-footer">
            <span>Transaction reference</span>
            <strong>{p.id}</strong>
          </div>
        </header>
        <div className="receipt-body">
          <div className="receipt-customer">
            <span className="receipt-customer-avatar">
              {p.customer
                .split(' ')
                .map((part) => part[0])
                .slice(0, 2)
                .join('')}
            </span>
            <div>
              <span>Customer</span>
              <strong>{p.customer}</strong>
            </div>
          </div>
          <dl className="receipt-info-grid">
            {[
              ['Payment for', p.description],
              ['Payment method', p.method],
              ['Date', date(p.createdAt)],
              ['Currency', p.currency],
            ].map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <ReceiptActions payment={p} business={data?.profile.business || 'Safer Business'} />
          <p className="receipt-demo-note">
            Illustrative demo payment · No real funds transferred.
          </p>
        </div>
      </article>
    </div>
  );
}
