import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../components/ui';
import { repo } from '../../mocks/repository';
import Payroll from './Payroll';
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it('prepares, reviews, approves and explicitly confirms a demo payment', async () => {
  repo.reset();
  repo.saveStaff({
    name: 'Sample Teammate',
    email: '',
    role: 'Sales associate',
    department: 'Retail',
    startDate: '2020-01-01',
    salary: '100000',
    allowance: '5000',
    deduction: '0',
    deductionNote: '',
    currency: 'NGN',
    status: 'active',
  });
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  });
  const user = userEvent.setup();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ToastProvider>
        <Payroll />
      </ToastProvider>
    </QueryClientProvider>,
  );
  await user.click(await screen.findByRole('button', { name: 'Prepare payroll' }));
  await user.click(screen.getByRole('button', { name: 'Create draft for review' }));
  await user.click(await screen.findByRole('button', { name: 'Approve payroll' }));
  await user.click(await screen.findByRole('button', { name: 'Record demo payment' }));
  expect(repo.read().payrollRuns[0].status).toBe('approved');
  await user.click(screen.getByRole('button', { name: 'Confirm demo payment' }));
  await waitFor(() => expect(repo.read().payrollRuns[0].status).toBe('paid'));
  expect(
    await screen.findByText('Demo payment recorded. No money was transferred.'),
  ).toBeInTheDocument();
});
