import { zodResolver } from '@hookform/resolvers/zod';
import { deliverySchema, type Delivery, type DeliveryInput } from '@safer/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui';
import { api, useWorkspace } from '../../lib/api';
export default function DeliveryForm({ onBooked }: { onBooked: (d: Delivery) => void }) {
  const { data } = useWorkspace();
  const [review, setReview] = useState<DeliveryInput | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeliveryInput>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      pickup: data?.profile.address || '',
      customer: '',
      phone: '',
      destination: '',
      item: '',
    },
  });
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: (v: DeliveryInput) => api<Delivery>('/deliveries', v),
    onSuccess: (d) => {
      client.invalidateQueries({ queryKey: ['workspace'] });
      onBooked(d);
    },
  });
  if (review)
    return (
      <div className="stack-form delivery-booking-form">
        <div className="notice">
          Demo quote · No rider is contacted. Live availability and pricing will come from the
          delivery provider.
        </div>
        <div className="delivery-quote">
          <Truck size={22} />
          <div>
            <strong>Standard delivery</strong>
            <p>Estimated arrival · 45–60 min</p>
          </div>
          <strong>₦2,500.00</strong>
        </div>
        <div className="detail-rows">
          {[
            ['Recipient', review.customer],
            ['Phone', review.phone],
            ['Pickup', review.pickup],
            ['Destination', review.destination],
            ['Package', review.item],
          ].map(([k, v]) => (
            <div key={k}>
              <span>{k}</span>
              <strong>{v}</strong>
            </div>
          ))}
        </div>
        {mutation.error && (
          <p role="alert" className="form-error">
            {mutation.error.message}
          </p>
        )}
        <div className="button-row">
          <Button variant="secondary" onClick={() => setReview(null)}>
            Edit details
          </Button>
          <Button onClick={() => mutation.mutate(review)} disabled={mutation.isPending}>
            {mutation.isPending ? 'Requesting…' : 'Confirm demo booking'}
          </Button>
        </div>
      </div>
    );
  return (
    <form className="stack-form delivery-booking-form" onSubmit={handleSubmit((v) => setReview(v))}>
      <p className="delivery-booking-intro">
        Tell us where it’s going. Review your quote before booking.
      </p>
      <div className="form-row">
        <label>
          Recipient name
          <input {...register('customer')} placeholder="Amina Yusuf" />
          {errors.customer && <small className="form-error">{errors.customer.message}</small>}
        </label>
        <label>
          Phone number
          <input {...register('phone')} type="tel" placeholder="+234 802 345 6789" />
          {errors.phone && <small className="form-error">{errors.phone.message}</small>}
        </label>
      </div>
      <label>
        Pickup address
        <textarea {...register('pickup')} rows={2} />
        {errors.pickup && <small className="form-error">{errors.pickup.message}</small>}
      </label>
      <label>
        Delivery address
        <textarea {...register('destination')} rows={2} placeholder="Street, area, city" />
        {errors.destination && <small className="form-error">{errors.destination.message}</small>}
      </label>
      <label>
        What are you sending?
        <input {...register('item')} placeholder="e.g. One linen two-piece set" />
        {errors.item && <small className="form-error">{errors.item.message}</small>}
      </label>
      <p className="small-text muted">Review the rider quote before confirming your booking.</p>
      <Button>Get delivery quote</Button>
    </form>
  );
}
