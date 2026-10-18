import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Balances } from '../../components/WorkspaceShell';
import { Button, Dialog, Empty, PageHeading, Status } from '../../components/ui';
import { useWorkspace } from '../../lib/api';
import { date, money } from '../../lib/money';
import Withdrawal from './Withdrawal';
export default function Payments() {
  const { data } = useWorkspace();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [params, setParams] = useSearchParams();
  if (!data) return null;
  const rows = data.payments.filter(
    (p) =>
      (filter === 'all' || p.status === filter) &&
      `${p.customer} ${p.id} ${p.description}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="page-content payments-page">
      <PageHeading
        eyebrow="Your money, in view"
        title="Payments & balances"
        description="Every payment. A clearer picture."
      />
      <Balances data={data} compact />
      <section className="payments-activity">
        <div className="payments-activity-heading">
          <div>
            <h2>Payment activity</h2>
            <p>A clear view of your incoming payments.</p>
          </div>
          <Button variant="secondary" onClick={() => setParams({ withdraw: '1' })}>
            Withdraw
          </Button>
        </div>
        <div className="toolbar payments-toolbar">
          <input
            placeholder="Search payments…"
            aria-label="Search payments"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            aria-label="Payment status"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All payments</option>
            <option value="paid">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div className="payments-results-count" aria-live="polite">
          {rows.length} {rows.length === 1 ? 'payment' : 'payments'}
        </div>
        {rows.length ? (
          <ul className="payments-feed">
            {rows.map((p) => (
              <li key={p.id}>
                <Link to={`/app/payments/${p.id}`} className="payment-feed-link">
                  <span className="payment-feed-avatar" aria-hidden="true">
                    {p.customer
                      .split(' ')
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join('')}
                  </span>
                  <div className="payment-feed-customer">
                    <strong>{p.customer}</strong>
                    <span>{p.description}</span>
                    <small>
                      {p.id} · {date(p.createdAt)}
                    </small>
                  </div>
                  <div className="payment-feed-value">
                    <strong>{money(p.amountMinor, p.currency)}</strong>
                    <Status value={p.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="No payments found">Try a different customer or payment status.</Empty>
        )}
      </section>
      {params.has('withdraw') && (
        <Dialog title="Review a withdrawal" onClose={() => setParams({})}>
          <Withdrawal onDone={() => setParams({})} />
        </Dialog>
      )}
    </div>
  );
}
