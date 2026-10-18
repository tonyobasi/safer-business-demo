import { MapPin, Truck } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Dialog, Empty, PageHeading, Status } from '../../components/ui';
import { useWorkspace } from '../../lib/api';
import { date, money } from '../../lib/money';
import DeliveryForm from './DeliveryForm';
export default function Deliveries() {
  const { data } = useWorkspace();
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  const deliveries =
    data?.deliveries.filter(
      (d) =>
        filter === 'all' ||
        (filter === 'active' ? d.status !== 'Delivered' : d.status === 'Delivered'),
    ) || [];
  return (
    <div className="page-content deliveries-page">
      <PageHeading
        eyebrow="From your business to their door"
        title="Deliveries"
        description="Keep your next delivery moving."
        action={<Button onClick={() => setParams({ book: '1' })}>Book delivery</Button>}
      />
      <div className="segmented tabs">
        {[
          ['all', 'All deliveries'],
          ['active', 'In progress'],
          ['delivered', 'Delivered'],
        ].map(([id, label]) => (
          <button
            key={id}
            className={filter === id ? 'selected' : ''}
            onClick={() => setFilter(id)}
            aria-pressed={filter === id}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="delivery-list">
        {deliveries.map((d) => (
          <Link className="card delivery-list-card" to={`/app/deliveries/${d.id}`} key={d.id}>
            <div className="inline-between">
              <span className="list-icon">
                <Truck size={20} />
              </span>
              <Status value={d.status} />
            </div>
            <h3>{d.customer}</h3>
            <p>{d.item}</p>
            <div className="route-preview">
              <span>
                <i />
                <span>
                  <small>Pickup address</small>
                  {d.pickup}
                </span>
              </span>
              <span>
                <MapPin size={14} />
                <span>
                  <small>Delivery address</small>
                  {d.destination}
                </span>
              </span>
            </div>
            <div className="inline-between">
              <small>
                {d.id} · {date(d.createdAt)}
              </small>
              <strong>{money(d.feeMinor, 'NGN')}</strong>
            </div>
          </Link>
        ))}
      </div>
      {!deliveries.length && (
        <Empty
          title="Your next delivery starts here"
          action={<Button onClick={() => setParams({ book: '1' })}>Book delivery</Button>}
        >
          Request a quote and review the details before booking.
        </Empty>
      )}
      {params.has('book') && (
        <Dialog title="Find a rider for your delivery" onClose={() => setParams({})}>
          <DeliveryForm onBooked={(d) => navigate(`/app/deliveries/${d.id}`)} />
        </Dialog>
      )}
    </div>
  );
}
