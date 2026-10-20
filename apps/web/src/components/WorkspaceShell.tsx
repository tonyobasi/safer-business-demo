import { TransferIcon } from './TransferIcon';
import type { Workspace } from '@safer/contracts';
import {
  ChevronRight,
  Eye,
  EyeOff,
  HelpCircle,
  House,
  Menu,
  Package,
  ReceiptText,
  Settings,
  Sparkles,
  Truck,
  User,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSession } from '../app/session';
import { isDemo, useWorkspace } from '../lib/api';
import { money } from '../lib/money';
import { useKeyboardViewport } from '../lib/useKeyboardViewport';
import { Button, Dialog, ErrorState, HelpDialog, Loading, Logo } from './ui';
export const navigation = [
  { to: '/app', label: 'Assistant', icon: Sparkles, end: true },
  { to: '/app/catalogue', label: 'Catalogue', icon: Package },
  { to: '/app/payments', label: 'Payments', icon: ReceiptText },
  { to: '/app/deliveries', label: 'Deliveries', icon: Truck },
  { to: '/app/profile', label: 'Profile', icon: User },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];
type WalletCurrency = 'USD' | 'NGN' | 'EUR' | 'GBP';
const walletCurrencies: { code: WalletCurrency; name: string; flag: string }[] = [
  { code: 'USD', name: 'US dollar', flag: 'us' },
  { code: 'NGN', name: 'Nigerian naira', flag: 'ng' },
  { code: 'EUR', name: 'Euro', flag: 'eu' },
  { code: 'GBP', name: 'British pound', flag: 'gb' },
];
export function Balances({ data, compact = false }: { data: Workspace; compact?: boolean }) {
  const [hidden, setHidden] = useState(false);
  const [creating, setCreating] = useState(false);
  const [currency, setCurrency] = useState<WalletCurrency>('USD');
  const [walletName, setWalletName] = useState('');
  const [walletError, setWalletError] = useState('');
  const [wallets, setWallets] = useState<{ id: string; name: string; currency: WalletCurrency }[]>(
    () => {
      try {
        return JSON.parse(sessionStorage.getItem('safer-demo-wallets') || '[]');
      } catch {
        return [];
      }
    },
  );
  return (
    <section className={`balance-section ${compact ? 'balance-horizontal' : ''}`}>
      <div className="section-label">
        <span>Your balances</span>
        <button
          className="icon-button"
          onClick={() => setHidden(!hidden)}
          aria-label={hidden ? 'Show balances' : 'Hide balances'}
        >
          {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      <div className="balance-cards">
        {(['USD', 'NGN'] as const).map((c) => (
          <div key={c} className={`balance-card ${c === 'USD' ? 'balance-dark' : ''}`}>
            <div className="balance-caption">
              {c} balance{' '}
              <span
                className="currency-flag"
                role="img"
                aria-label={c === 'USD' ? 'United States flag' : 'Nigeria flag'}
              >
                <img
                  src={`/images/flags/${c === 'USD' ? 'us' : 'ng'}.svg`}
                  alt=""
                  width={36}
                  height={24}
                />
              </span>
            </div>
            <small>Available</small>
            <strong>{hidden ? '••••••' : money(data.balances[c].available, c)}</strong>
            <div className="pending">
              <span>Pending</span>
              <span>{hidden ? '••••' : money(data.balances[c].pending, c)}</span>
            </div>
          </div>
        ))}
        {wallets.map((wallet) => (
          <div
            key={wallet.id}
            className={`balance-card ${wallet.currency === 'USD' ? 'balance-dark' : ''}`}
          >
            <div className="balance-caption">
              {wallet.name}
              <span className="currency-flag" role="img" aria-label={`${wallet.currency} flag`}>
                <img
                  src={`/images/flags/${walletCurrencies.find((c) => c.code === wallet.currency)?.flag || 'us'}.svg`}
                  alt=""
                  width={36}
                  height={24}
                />
              </span>
            </div>
            <small>{wallet.currency} · Demo wallet</small>
            <button
              className="text-button wallet-remove"
              aria-label={`Remove wallet ${wallet.name}`}
              onClick={() => {
                const next = wallets.filter((w) => w.id !== wallet.id);
                sessionStorage.setItem('safer-demo-wallets', JSON.stringify(next));
                setWallets(next);
              }}
            >
              Remove
            </button>
            <strong>{hidden ? '••••••' : money('0', wallet.currency)}</strong>
            <div className="pending">
              <span>Pending</span>
              <span>{hidden ? '••••' : money('0', wallet.currency)}</span>
            </div>
          </div>
        ))}
      </div>
      <Button
        variant="secondary"
        className="create-wallet-button"
        onClick={() => {
          setCreating(true);
          setWalletName('');
          setWalletError('');
        }}
      >
        Create new wallet
      </Button>
      {creating && (
        <Dialog title="Create a new wallet" onClose={() => setCreating(false)}>
          <form
            className="stack-form wallet-create-form"
            onSubmit={(e) => {
              e.preventDefault();
              const name = walletName.trim();
              if (name.length < 2) {
                setWalletError('Enter a wallet name with at least 2 characters.');
                return;
              }
              if (wallets.some((w) => w.name.toLowerCase() === name.toLowerCase())) {
                setWalletError('Choose a different wallet name.');
                return;
              }
              const next = [...wallets, { id: crypto.randomUUID(), name, currency }];
              sessionStorage.setItem('safer-demo-wallets', JSON.stringify(next));
              setWallets(next);
              setCreating(false);
            }}
          >
            <p className="muted small-text">
              Keep money for different business needs in separate wallets.
            </p>
            <label>
              Wallet name
              <input
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder="e.g. Business savings"
                minLength={2}
                maxLength={40}
                required
              />
            </label>
            <fieldset className="wallet-currency-options">
              <legend>Choose currency</legend>
              <div className="wallet-currency-grid">
                {walletCurrencies.map((option) => (
                  <label
                    className={`wallet-currency-option${currency === option.code ? ' selected' : ''}`}
                    key={option.code}
                  >
                    <input
                      type="radio"
                      name="wallet-currency"
                      value={option.code}
                      checked={currency === option.code}
                      onChange={() => setCurrency(option.code)}
                    />
                    <img src={`/images/flags/${option.flag}.svg`} alt="" width={28} height={20} />
                    <span>
                      <strong>{option.code}</strong>
                      <small>{option.name}</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="notice">
              Demo wallet only. This creates a local preview with a zero balance; no financial
              account is opened.
            </div>
            {walletError && (
              <p className="form-error" role="alert">
                {walletError}
              </p>
            )}
            <Button type="submit">Create demo wallet</Button>
          </form>
        </Dialog>
      )}
    </section>
  );
}
export function WorkspaceShell() {
  const viewportRef = useKeyboardViewport();
  useEffect(() => {
    sessionStorage.removeItem('safer-onboarding');
  }, []);
  const { data, isPending, error, refetch } = useWorkspace();
  const [drawer, setDrawer] = useState(false);
  const rail = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!drawer) return;
    const previous = document.activeElement as HTMLElement;
    rail.current
      ?.querySelector<HTMLButtonElement>('button[aria-label="Close business menu"]')
      ?.focus();
    return () => previous?.focus();
  }, [drawer]);
  const [help, setHelp] = useState(false);
  const { logout } = useSession();
  const navigate = useNavigate();
  if (isPending) return <Loading />;
  if (error || !data)
    return (
      <ErrorState message={error?.message || 'Workspace unavailable.'} retry={() => refetch()} />
    );
  return (
    <div className="workspace-shell" ref={viewportRef}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="app-header">
        <button
          className="icon-button mobile-only"
          aria-label="Open business menu"
          onClick={() => setDrawer(true)}
        >
          <Menu size={22} />
        </button>
        <Logo to="/app" />
        <div className="header-end">
          <span className="workspace-health">
            <i />
            {isDemo ? 'Demo workspace' : 'Workspace connected'}
          </span>
          <Link
            className="header-profile"
            aria-label={`${data.profile.business} · Your profile`}
            to="/app/profile"
          >
            <span className="header-profile-business">{data.profile.business}</span>
            <span className="avatar">
              {data.profile.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </span>
          </Link>
        </div>
      </header>
      <div className="workspace-body">
        <aside
          ref={rail}
          role={drawer ? 'dialog' : undefined}
          aria-modal={drawer ? true : undefined}
          aria-label={drawer ? 'Business menu' : undefined}
          onKeyDown={(e) => {
            if (!drawer) return;
            if (e.key === 'Escape') {
              e.preventDefault();
              setDrawer(false);
            }
            if (e.key === 'Tab') {
              const nodes = [
                ...rail.current!.querySelectorAll<HTMLElement>('button,a,input'),
              ].filter((n) => n.offsetParent !== null);
              const first = nodes[0],
                last = nodes.at(-1);
              if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last?.focus();
              } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first?.focus();
              }
            }
          }}
          className={`recent-sidebar ${drawer ? 'drawer-open' : ''}`}
        >
          <div className="mobile-drawer-header">
            <Logo to="/app" />
            <button
              className="icon-button"
              aria-label="Close business menu"
              onClick={() => setDrawer(false)}
            >
              <X />
            </button>
          </div>
          <NavLink to="/app" end className="workspace-home-link" onClick={() => setDrawer(false)}>
            <House size={18} />
            <span>Home</span>
          </NavLink>
          <div className="recent-payments-heading">
            <p className="eyebrow rail-label">Recent payments</p>
            <Link to="/app/payments" onClick={() => setDrawer(false)}>
              View all
            </Link>
          </div>
          <div className="recent-list recent-payment-cards">
            {data.payments.slice(0, 4).map((p) => (
              <Link
                className="recent-payment-card"
                to={`/app/payments/${p.id}`}
                key={p.id}
                onClick={() => setDrawer(false)}
              >
                <div className="recent-payment-top">
                  <span className="payment-currency-mark">{p.currency === 'USD' ? '$' : '₦'}</span>
                  <strong>{money(p.amountMinor, p.currency)}</strong>
                  <ChevronRight className="payment-open" size={13} />
                </div>
                <span className="recent-payment-customer">{p.customer}</span>
                <div className="recent-payment-bottom">
                  <span className={`payment-state payment-state-${p.status}`}>
                    <i />
                    {p.status === 'paid'
                      ? 'Received'
                      : p.status === 'pending'
                        ? 'Pending'
                        : p.status === 'failed'
                          ? 'Failed'
                          : 'Expired'}
                  </span>
                  <time dateTime={p.createdAt}>
                    {new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short' }).format(
                      new Date(p.createdAt),
                    )}
                  </time>
                </div>
              </Link>
            ))}
          </div>
          <nav className="mobile-business-nav">
            {navigation.map((n) => (
              <NavLink end={n.end} to={n.to} key={n.to} onClick={() => setDrawer(false)}>
                <n.icon size={17} />
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="rail-bottom">
            <button className="rail-help" onClick={() => setHelp(true)}>
              <HelpCircle size={16} />
              Help and support
              <ChevronRight size={13} />
            </button>
            <button
              className="account-summary"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              <span className="avatar">
                {data.profile.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </span>
              <span>
                {data.profile.name}
                <small>Sign out of demo</small>
              </span>
            </button>
          </div>
        </aside>
        {drawer && (
          <button
            className="drawer-backdrop"
            aria-label="Close business menu"
            onClick={() => setDrawer(false)}
          />
        )}
        <main id="main-content" className="app-main">
          <Outlet />
        </main>
        <aside className="business-sidebar">
          <Balances data={data} />
          <p className="section-label quick-label">Quick actions</p>
          <div className="quick-actions">
            <Link to="/app/payment-links?create=1">
              <span>＋</span>Create payment link
            </Link>
            <Link to="/app/payments">
              <span>
                <TransferIcon direction="receive" />
              </span>
              Receive money
            </Link>
            <Link to="/app/payments?withdraw=1">
              <span>
                <TransferIcon direction="send" />
              </span>
              Withdraw
            </Link>
          </div>
          <p className="eyebrow rail-label">Your business</p>
          <nav className="business-nav">
            {navigation
              .filter((n) => n.to !== '/app')
              .map((n) => (
                <NavLink to={n.to} key={n.to}>
                  <n.icon size={16} />
                  <span>{n.label}</span>
                  <ChevronRight size={13} />
                </NavLink>
              ))}
          </nav>
          <p className="security-footnote">Your business. Your next chapter.</p>
        </aside>
      </div>
      <nav className="mobile-bottom-nav" aria-label="Main workspace navigation">
        {navigation.slice(0, 4).map((n) => (
          <NavLink end={n.end} to={n.to} key={n.to}>
            <n.icon size={19} />
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
      {help && <HelpDialog onClose={() => setHelp(false)} />}{' '}
    </div>
  );
}
