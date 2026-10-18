import type { Preferences } from '@safer/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Bell, ShieldCheck, LifeBuoy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../app/session';
import { Button, Dialog, HelpDialog, PageHeading, useToast } from '../../components/ui';
import { api, useWorkspace } from '../../lib/api';
export default function Settings() {
  const { data } = useWorkspace();
  const client = useQueryClient();
  const { logout } = useSession();
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<Preferences>(
    data?.preferences || { email: true, payments: true, stock: true, deliveries: true },
  );
  const [password, setPassword] = useState(false);
  const [help, setHelp] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();
  const mutation = useMutation({
    mutationFn: () => api('/preferences', prefs, 'PUT'),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['workspace'] });
      toast('Notification preferences saved.');
    },
  });
  return (
    <div className="page-content settings-page">
      <PageHeading
        eyebrow="Built around you"
        title="Settings"
        description="Your business, your preferences."
      />
      <form
        className="card settings-form"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <div className="settings-section-title">
          <span>
            <Bell size={20} />
          </span>
          <h3>Notifications</h3>
        </div>
        <p className="muted small-text">Choose the updates that matter to your business.</p>
        {(
          [
            ['payments', 'Payment updates', 'Know when payments arrive or need attention.'],
            ['stock', 'Stock reminders', 'Keep an eye on items running low.'],
            ['deliveries', 'Delivery updates', 'Follow your packages from pickup to arrival.'],
            ['email', 'Email summaries', 'A clearer picture of your business in your inbox.'],
          ] as const
        ).map(([id, title, copy]) => (
          <label className="toggle-row" key={id}>
            <span>
              <strong>{title}</strong>
              <small>{copy}</small>
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={prefs[id]}
              onChange={(e) => setPrefs({ ...prefs, [id]: e.target.checked })}
            />
          </label>
        ))}
        {mutation.error && (
          <p className="form-error" role="alert">
            {mutation.error.message}
          </p>
        )}
        <Button disabled={mutation.isPending}>Save preferences</Button>
        <p className="small-text muted">
          Preferences are saved locally in this demo; notifications are not sent.
        </p>
      </form>
      <section className="card settings-form">
        <div className="settings-section-title">
          <span>
            <ShieldCheck size={20} />
          </span>
          <h3>Security & access</h3>
        </div>
        <div className="settings-row">
          <div>
            <strong>Password</strong>
            <p>Keep your business account secure.</p>
          </div>
          <Button variant="secondary" onClick={() => setPassword(true)}>
            Change password
          </Button>
        </div>
        <div className="settings-row">
          <div>
            <strong>Demo session</strong>
            <p>You’re signed in on this browser tab.</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Sign out
          </Button>
        </div>
      </section>
      <section className="card settings-form">
        <div className="settings-section-title">
          <span>
            <LifeBuoy size={20} />
          </span>
          <h3>Need a hand?</h3>
        </div>
        <p>Find your way around payments, stock and deliveries.</p>
        <Button variant="secondary" onClick={() => setHelp(true)}>
          Help and support
        </Button>
      </section>
      {password && (
        <Dialog
          title="Change password"
          onClose={() => {
            setPassword(false);
            setError('');
          }}
        >
          <form
            className="stack-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              if (String(f.get('new')) !== String(f.get('confirm'))) {
                setError('Passwords do not match.');
                return;
              }
              toast('Demo form checked. No password was changed or stored.');
              setPassword(false);
            }}
          >
            <div className="notice">
              Demo only · Use sample values. Real credential changes require the backend.
            </div>
            <label>
              Current password
              <input type="password" autoComplete="current-password" required minLength={8} />
            </label>
            <label>
              New password
              <input
                name="new"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <label>
              Confirm new password
              <input
                name="confirm"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <Button>Check demo form</Button>
          </form>
        </Dialog>
      )}
      {help && <HelpDialog onClose={() => setHelp(false)} />}
    </div>
  );
}
