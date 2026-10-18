import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, MapPin, Package, Truck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Button, ErrorState, PageHeading, Status } from '../../components/ui';
import { api, useWorkspace } from '../../lib/api';
import { money } from '../../lib/money';
export default function TrackDelivery() {
  const { id } = useParams();
  const { data } = useWorkspace();
  const client = useQueryClient();
  const d = data?.deliveries.find((d) => d.id === id);
  const stages = ['Requested', 'Rider assigned', 'Picked up', 'Delivered'];
  const mutation = useMutation({
    mutationFn: () => api(`/deliveries/${id}/advance`, {}),
    onSuccess: () => client.invalidateQueries({ queryKey: ['workspace'] }),
  });
  if (!d) return <ErrorState message="Delivery could not be found." />;
  const stage = stages.indexOf(d.status);
  return (
    <div className="page-content">
      <Link to="/app/deliveries" className="back-link">
        ← Deliveries
      </Link>
      <PageHeading title="Every step, in view." description={`Delivery ${d.id}`} />
      <div className="card tracking-card">
        <div className="inline-between">
          <h3>{d.customer}</h3>
          <Status value={d.status} />
        </div>
        <div className="tracking-visual">
          <div className="route-line" />
          <span className="map-pin from">
            <Package size={22} />
          </span>
          <span className="map-pin rider">
            <Truck size={26} />
          </span>
          <span className="map-pin to">
            <MapPin size={22} />
          </span>
          <div className="map-caption">Illustrative route · Lagos</div>
        </div>
        <div className="delivery-timeline">
          {stages.map((s, i) => (
            <div key={s} className={i <= stage ? 'complete' : ''}>
              <span>{i < stage ? <Check size={14} /> : i + 1}</span>
              <div>
                <strong>{s}</strong>
                <small>{i <= stage ? 'Demo update received' : 'Waiting for update'}</small>
              </div>
            </div>
          ))}
        </div>
        <div className="detail-rows">
          {[
            ['Pickup', d.pickup],
            ['Delivery address', d.destination],
            ['Recipient phone', d.phone],
            ['Package', d.item],
            ['Delivery fee', money(d.feeMinor, 'NGN')],
          ].map(([k, v]) => (
            <div key={k}>
              <span>{k}</span>
              <strong>{v}</strong>
            </div>
          ))}
        </div>
        <div className="demo-controls">
          <span className="eyebrow">Demo tracking controls</span>
          <Button
            variant="secondary"
            disabled={stage === 3 || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {stage === 3 ? 'Delivery complete' : 'Simulate next delivery update'}
          </Button>
          {mutation.error && <p className="form-error">{mutation.error.message}</p>}
        </div>
      </div>
    </div>
  );
}
