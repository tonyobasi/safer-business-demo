import type { Profile as ProfileType } from '@safer/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Badge, Button, PageHeading, useToast } from '../../components/ui';
import { api, useWorkspace } from '../../lib/api';
export default function Profile() {
  const { data } = useWorkspace();
  const client = useQueryClient();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileType>({ defaultValues: data?.profile });
  const mutation = useMutation({
    mutationFn: (v: ProfileType) => api('/profile', v, 'PUT'),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['workspace'] });
      toast('Your business profile is up to date.');
    },
  });
  return (
    <div className="page-content profile-page">
      <PageHeading
        eyebrow="The business behind the ambition"
        title="Your profile"
        description="Make your workspace feel a little more like you."
      />
      <div className="card profile-summary">
        <div className="avatar profile-avatar">
          {data?.profile.business
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')}
        </div>
        <div>
          <h2>{data?.profile.business}</h2>
          <p>{data?.profile.category}</p>
          <Badge>Merchant account</Badge>
        </div>
      </div>
      <form className="card settings-form" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
        <h3>Business details</h3>
        <p className="muted small-text">These details identify your business in the workspace.</p>
        <div className="form-row">
          <label>
            Your full name
            <input
              autoComplete="name"
              {...register('name', {
                required: 'Your name is required.',
                minLength: { value: 2, message: 'Enter at least 2 characters.' },
                maxLength: 80,
              })}
            />
            {errors.name && <small className="form-error">{errors.name.message}</small>}
          </label>
          <label>
            Business name
            <input
              autoComplete="organization"
              {...register('business', {
                required: 'Business name is required.',
                minLength: { value: 2, message: 'Enter at least 2 characters.' },
                maxLength: 80,
              })}
            />
            {errors.business && <small className="form-error">{errors.business.message}</small>}
          </label>
        </div>
        <div className="form-row">
          <label>
            Email address
            <input type="email" autoComplete="email" {...register('email')} />
          </label>
          <label>
            Phone number
            <input
              type="tel"
              autoComplete="tel"
              {...register('phone', {
                validate: (v) =>
                  !v || /^\+?[\d\s()-]{8,18}$/.test(v) || 'Enter a valid phone number.',
              })}
            />
            {errors.phone && <small className="form-error">{errors.phone.message}</small>}
          </label>
        </div>
        <label>
          Business category
          <select {...register('category')}>
            <option>Fashion & accessories</option>
            <option>Electronics</option>
            <option>Food & hospitality</option>
            <option>Retail</option>
            <option>Professional services</option>
            <option>Other</option>
          </select>
        </label>
        <label>
          Business address
          <textarea
            autoComplete="street-address"
            rows={2}
            {...register('address', { maxLength: 250 })}
          />
        </label>
        {mutation.error && (
          <p className="form-error" role="alert">
            {mutation.error.message}
          </p>
        )}
        <Button disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </form>
    </div>
  );
}
