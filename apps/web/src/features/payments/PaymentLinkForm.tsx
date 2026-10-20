import { zodResolver } from '@hookform/resolvers/zod';
import { linkSchema, type Currency, type LinkInput, type PaymentLink } from '@safer/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useId } from 'react';
import { Button } from '../../components/ui';
import { api } from '../../lib/api';
import { paymentCurrencies } from '../../lib/payment-currencies';
export function PaymentLinkForm({
  onCreated,
  currency = 'NGN',
  amount = '',
}: {
  onCreated: (link: PaymentLink) => void;
  currency?: Currency;
  amount?: string;
}) {
  const client = useQueryClient();
  const stablecoinDescription = useId();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LinkInput>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      title: '',
      amount,
      currency,
      customer: '',
      email: '',
      expires: '30',
      allowStablecoin: false,
    },
  });
  const selectedCurrency = watch('currency');
  const mutation = useMutation({
    mutationFn: (v: LinkInput) => api<PaymentLink>('/payment-links', v),
    onSuccess: (l) => {
      client.invalidateQueries({ queryKey: ['workspace'] });
      onCreated(l);
    },
  });
  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="stack-form">
      <fieldset className="payment-currency-fieldset">
        <legend>Payment currency</legend>
        <div className="payment-currency-grid">
          {paymentCurrencies.map((option) => (
            <label className="payment-currency-choice" key={option.code}>
              <input type="radio" value={option.code} {...register('currency')} />
              <img src={option.image} alt="" width={28} height={20} />
              <span>
                <strong>{option.code}</strong>
                <small>{option.name}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label>
          Amount
          <input
            inputMode="decimal"
            placeholder="0.00"
            {...register('amount')}
            aria-invalid={!!errors.amount}
          />
          {errors.amount && <small className="form-error">{errors.amount.message}</small>}
        </label>
      </div>
      <label>
        What is this payment for?
        <input
          placeholder="e.g. Linen two-piece set"
          {...register('title')}
          aria-invalid={!!errors.title}
        />
        {errors.title && <small className="form-error">{errors.title.message}</small>}
      </label>
      <div className="form-row">
        <label>
          Customer name <span className="optional">Optional</span>
          <input placeholder="Amina Yusuf" {...register('customer')} />
        </label>
        <label>
          Customer email <span className="optional">Optional</span>
          <input type="email" placeholder="customer@example.com" {...register('email')} />
          {errors.email && <small className="form-error">{errors.email.message}</small>}
        </label>
      </div>
      <label>
        Link expires after
        <select {...register('expires')}>
          <option value="7">7 days</option>
          <option value="30">30 days</option>
          <option value="90">90 days</option>
        </select>
      </label>
      {selectedCurrency === 'USDC' ? (
        <div className="notice">
          This link accepts USDC. Customers will see stablecoin payment instructions at checkout.
        </div>
      ) : (
        <label className="payment-link-stablecoin">
          <input
            type="checkbox"
            {...register('allowStablecoin')}
            aria-describedby={stablecoinDescription}
          />
          <span>
            <strong>Allow stablecoin payments</strong>
            <small id={stablecoinDescription}>
              Let customers pay with USDC alongside bank transfer. Conversion and network details
              are provided at checkout by the live payment provider.
            </small>
          </span>
          <span className="stablecoin-token" aria-hidden="true">
            USDC
          </span>
        </label>
      )}
      <p className="muted small-text">
        Review the amount, currency and payment options before creating your link.
      </p>
      {mutation.error && (
        <p className="form-error" role="alert">
          {mutation.error.message}
        </p>
      )}
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Creating link…' : 'Confirm and create link'}
      </Button>
    </form>
  );
}
