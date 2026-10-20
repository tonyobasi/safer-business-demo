import { useState } from 'react';
import { Link2 } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Badge, Button, Dialog, Empty, PageHeading, Status } from '../../components/ui';
import { useWorkspace } from '../../lib/api';
import { date, money } from '../../lib/money';
import { PaymentLinkForm } from './PaymentLinkForm';
export default function PaymentLinks() {
  const { data } = useWorkspace();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const links =
    data?.links.filter((l) =>
      `${l.title} ${l.customer} ${l.currency}`.toLowerCase().includes(search.toLowerCase()),
    ) || [];
  return (
    <div className="page-content payment-links-page">
      <PageHeading
        eyebrow="One link. More possibilities."
        title="Payment links"
        description="Get paid in naira or USD, near or far."
        action={<Button onClick={() => setParams({ create: '1' })}>Create payment link</Button>}
      />
      <div className="toolbar">
        <input
          aria-label="Search payment links"
          placeholder="Search links or customers…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Badge>{links.length} links</Badge>
      </div>
      <div className="card">
        {links.length ? (
          <div className="link-list">
            {links.map((l) => (
              <Link to={`/app/payment-links/${l.id}`} className="link-row" key={l.id}>
                <div className="list-icon">
                  <Link2 size={18} aria-hidden="true" />
                </div>
                <div className="payment-link-list-description">
                  <strong>{l.title}</strong>
                  <small>
                    {l.customer || 'Anyone with the link'} · {date(l.createdAt)}
                  </small>
                </div>
                <div className="amount-column">
                  <strong>
                    {money(l.amountMinor, l.currency)}{' '}
                    {l.currency !== 'USDC' && <small>{l.currency}</small>}
                  </strong>
                  <Status
                    value={
                      new Date(l.expiresAt).getTime() < Date.now() && l.status !== 'paid'
                        ? 'expired'
                        : l.status
                    }
                  />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Empty
            title="Your next sale starts with a link"
            action={<Button onClick={() => setParams({ create: '1' })}>Create payment link</Button>}
          >
            Create a link, share it with a customer and follow its payment here.
          </Empty>
        )}
      </div>
      {params.has('create') && (
        <Dialog title="Create a payment link" onClose={() => setParams({})}>
          <PaymentLinkForm onCreated={(l) => navigate(`/app/payment-links/${l.id}`)} />
        </Dialog>
      )}
    </div>
  );
}
