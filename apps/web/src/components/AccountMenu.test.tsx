import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { seed } from '../mocks/seed';
import { AccountMenu } from './AccountMenu';
afterEach(cleanup);
function Route() {
  return <output>{useLocation().pathname}</output>;
}
function setup() {
  const onSignOut = vi.fn();
  render(
    <MemoryRouter>
      <AccountMenu profile={seed().profile} onSignOut={onSignOut} />
      <button>Outside</button>
      <Route />
    </MemoryRouter>,
  );
  return {
    user: userEvent.setup(),
    onSignOut,
    trigger: screen.getByRole('button', { name: /Account options/ }),
  };
}
it('shows account details and restores trigger focus when Escape closes it', async () => {
  const { user, trigger } = setup();
  await user.click(trigger);
  expect(screen.getByText('Ada Okafor')).toBeInTheDocument();
  expect(screen.getByText('ada@example.com')).toBeInTheDocument();
  expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await user.keyboard('{Escape}');
  expect(trigger).toHaveFocus();
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
});
it('navigates to profile, closes on outside click, and calls sign out', async () => {
  const { user, trigger, onSignOut } = setup();
  await user.click(trigger);
  await user.click(screen.getByRole('link', { name: 'Your profile' }));
  expect(screen.getByText('/app/profile')).toBeInTheDocument();
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await user.click(trigger);
  await user.click(screen.getByRole('button', { name: 'Outside' }));
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await user.click(trigger);
  await user.click(screen.getByRole('button', { name: 'Sign out' }));
  expect(onSignOut).toHaveBeenCalledOnce();
});
