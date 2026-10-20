import type { Profile } from '@safer/contracts';
import { LogOut, Settings, User } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export function AccountMenu({ profile, onSignOut }: { profile: Profile; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const initials = profile.name
    .split(' ')
    .map((name) => name[0])
    .slice(0, 2)
    .join('');
  useEffect(() => {
    if (!open) return;
    const outside = (event: Event) => {
      if (event.target instanceof Node && !container.current?.contains(event.target))
        setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('click', outside, true);
    document.addEventListener('focusin', outside);
    document.addEventListener('keydown', escape);
    container.current
      ?.querySelector<HTMLElement>('.account-menu-panel a')
      ?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('click', outside, true);
      document.removeEventListener('focusin', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  return (
    <div className="account-menu" ref={container}>
      <button
        ref={trigger}
        type="button"
        className="header-profile"
        aria-label={`${profile.business} · Account options`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="avatar" aria-hidden="true">
          {initials}
        </span>
      </button>
      {open && (
        <section className="account-menu-panel" id={id} aria-label="Your account">
          <div className="account-menu-identity">
            <span className="account-menu-avatar" aria-hidden="true">
              {initials}
            </span>
            <div>
              <strong>{profile.name}</strong>
              <span>{profile.email}</span>
              <small>{profile.business}</small>
            </div>
          </div>
          <nav aria-label="Account options">
            <Link to="/app/profile" onClick={() => setOpen(false)}>
              <User size={18} aria-hidden="true" />
              <span>Your profile</span>
            </Link>
            <Link to="/app/settings" onClick={() => setOpen(false)}>
              <Settings size={18} aria-hidden="true" />
              <span>Settings</span>
            </Link>
            <button
              type="button"
              className="account-menu-signout"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
            >
              <LogOut size={18} aria-hidden="true" />
              <span>Sign out</span>
            </button>
          </nav>
        </section>
      )}
    </div>
  );
}
