import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { PaymentLinkForm } from './PaymentLinkForm';
it('prevents creating a link with an invalid amount and description', async () => {
  const onCreated = vi.fn();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PaymentLinkForm onCreated={onCreated} />
    </QueryClientProvider>,
  );
  await userEvent.type(screen.getByLabelText('Amount'), '1.234');
  await userEvent.click(screen.getByRole('button', { name: 'Confirm and create link' }));
  expect(
    await screen.findByText('Enter a positive amount with up to 2 decimals.'),
  ).toBeInTheDocument();
  expect(screen.getByText('Describe what this payment is for.')).toBeInTheDocument();
  expect(onCreated).not.toHaveBeenCalled();
});
