import type { Profile, Workspace } from '@safer/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useSession } from '../../app/session';
import { Button, Logo, useToast } from '../../components/ui';
import { api } from '../../lib/api';
interface Onboarding {
  contact: string;
  verified?: boolean;
  passwordSet?: boolean;
  expiresAt: number;
}
function onboarding(): Onboarding | null {
  try {
    return JSON.parse(sessionStorage.getItem('safer-onboarding') || 'null');
  } catch {
    return null;
  }
}
function save(v: Onboarding) {
  sessionStorage.setItem('safer-onboarding', JSON.stringify(v));
}
export function AuthLayout({
  children,
  step = 0,
  compact = false,
}: {
  children: ReactNode;
  step?: number;
  compact?: boolean;
}) {
  return (
    <div className={`auth-layout${compact ? ' auth-layout-signin' : ''}`}>
      <aside className="auth-story">
        <Logo light />
        <div className="auth-story-content">
          <p className="eyebrow">Built around your business</p>
          <h1>An agentic merchant system built for your success.</h1>
          <p>Manage payments, track stock, and coordinate deliveries—all with AI by your side.</p>
          <div className="auth-example">
            <div className="example-prompt">Create a payment link for $120</div>
            <div className="example-link">
              <div>
                <span className="avatar">aa</span>
                <strong>
                  Ada Atelier<small>Payment link · Ready to share</small>
                </strong>
                <ShieldCheck size={17} />
              </div>
              <p>Linen two-piece set</p>
              <strong className="example-amount">
                $120.00 <small>USD</small>
              </strong>
              <span>US virtual account or USDC</span>
            </div>
            <small>Done. Your next sale is one link away.</small>
          </div>
        </div>
        <div className="auth-story-footer">
          A little more possible.<span>▮▮▮</span>
        </div>
      </aside>
      <div className="auth-right">
        <header>
          <Logo />
          <span>
            Already have an account? <Link to="/login">Sign in</Link>
          </span>
        </header>
        <main className={`auth-form-wrap${compact ? ' auth-form-wrap-compact' : ''}`}>
          <div className="auth-form-card">
            {step > 0 && (
              <div className="onboarding-steps" aria-label={`Step ${step} of 4`}>
                {[1, 2, 3, 4].map((i) => (
                  <span key={i} className={i <= step ? 'active' : ''} />
                ))}
              </div>
            )}
            {children}
          </div>
        </main>
        <footer>
          <span>© {new Date().getFullYear()} Safer Business</span>
          <Link to="/" hidden>
            Back to home
          </Link>
        </footer>
      </div>
    </div>
  );
}
export function Signup() {
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  function submit(e: FormEvent) {
    e.preventDefault();
    let v = value.trim();
    if (method === 'phone') {
      const digits = v.replace(/[\s()-]/g, '').replace(/^(?:\+234|234|0)/, '');
      if (!/^[789]\d{9}$/.test(digits)) {
        setError('Enter a valid Nigerian phone number.');
        return;
      }
      v = `+234${digits}`;
    }
    if (
      method === 'email' ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) : !/^\+?[\d\s()-]{8,18}$/.test(v)
    ) {
      setError(`Enter a valid ${method === 'email' ? 'email address' : 'phone number'}.`);
      return;
    }
    save({ contact: v, expiresAt: Date.now() + 5 * 60000 });
    navigate('/signup/verify');
  }
  return (
    <AuthLayout step={1}>
      <p className="eyebrow">Your next chapter starts here</p>
      <h2>Make room for more business.</h2>
      <p>Create your merchant account. Let’s give your business a simpler way to grow.</p>
      <form onSubmit={submit}>
        <label htmlFor="signup-country">Country</label>
        <div className="signup-country-field">
          <img src="/images/flags/ng.svg" alt="Nigeria flag" width={26} height={18} />
          <select id="signup-country" name="country" defaultValue="NG" autoComplete="country">
            <option value="NG">Nigeria (+234)</option>
          </select>
        </div>
        <div className="segmented" aria-label="Signup method">
          {(['email', 'phone'] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={method === m}
              className={method === m ? 'selected' : ''}
              onClick={() => {
                setMethod(m);
                setValue('');
                setError('');
              }}
            >
              {m === 'email' ? 'Email' : 'Phone number'}
            </button>
          ))}
        </div>
        <label>
          {method === 'email' ? 'Email address' : 'Phone number'}
          <span className={method === 'phone' ? 'signup-phone-field' : 'signup-contact-field'}>
            {method === 'phone' && <span className="signup-dial-code">+234</span>}
            <input
              type={method === 'email' ? 'email' : 'tel'}
              autoComplete={method === 'email' ? 'email' : 'tel'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={method === 'email' ? 'you@yourbusiness.com' : '801 234 5678'}
              required
              aria-invalid={!!error}
            />
          </span>
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <small>
          We’ll send a verification code to this {method === 'email' ? 'address' : 'number'}.
        </small>
        <Button type="submit" className="full-width">
          Continue
        </Button>
        <p className="auth-caption">
          <ShieldCheck size={14} />
          Your business. Secure from the start.
        </p>
        <div className="notice">Frontend demo · Use sample details. No email or SMS is sent.</div>
      </form>
    </AuthLayout>
  );
}
export function Verify() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [record, setRecord] = useState(onboarding);
  const [now, setNow] = useState(Date.now());
  const navigate = useNavigate();
  useEffect(() => {
    if (!record) navigate('/signup', { replace: true });
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [record, navigate]);
  if (!record) return null;
  const remaining = Math.max(0, Math.ceil((record.expiresAt - now) / 1000));
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!record) return;
    if (!remaining) {
      setError('This code has expired. Request a new code.');
      return;
    }
    if (code !== '123456') {
      setError('That code doesn’t match. Use 123456 in this demo.');
      return;
    }
    save({ ...record, verified: true });
    navigate('/signup/password');
  }
  return (
    <AuthLayout step={2}>
      <p className="eyebrow">A quick hello</p>
      <h2>Verify your contact.</h2>
      <p>
        Enter the six-digit code for <strong>{record.contact}</strong>.
      </p>
      <form onSubmit={submit}>
        <label>
          Verification code
          <input
            className="otp-input"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            required
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <Button className="full-width" disabled={code.length !== 6}>
          Verify and continue
        </Button>
        <div className="inline-between">
          <small>
            {remaining
              ? `Code expires in ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`
              : 'Code expired'}
          </small>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              const r = { ...record, expiresAt: Date.now() + 5 * 60000 };
              save(r);
              setRecord(r);
              setError('');
              setCode('');
            }}
          >
            Resend code
          </button>
        </div>
        <div className="notice">
          Demo verification code: <strong>123456</strong>
        </div>
        <Link className="subtle-link" to="/signup">
          Use a different email or phone
        </Link>
      </form>
    </AuthLayout>
  );
}
export function Password() {
  const [value, setValue] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const record = onboarding();
  useEffect(() => {
    if (!record?.verified) navigate('/signup', { replace: true });
  }, [navigate, record?.verified]);
  return (
    <AuthLayout step={3}>
      <p className="eyebrow">Keep your business yours</p>
      <h2>A strong start.</h2>
      <p>Create a password for your merchant account.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.length < 8 || !/[0-9]/.test(value) || !/[a-z]/i.test(value)) {
            setError('Use at least 8 characters, including a letter and number.');
            return;
          }
          if (value !== confirm) {
            setError('The passwords do not match.');
            return;
          }
          if (record) {
            save({ ...record, passwordSet: true });
            setValue('');
            setConfirm('');
            navigate('/signup/business');
          }
        }}
      >
        <label>
          Password
          <div className="password-input">
            <input
              type={show ? 'text' : 'password'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoComplete="new-password"
              required
            />
            <button
              className="icon-button"
              type="button"
              aria-label={show ? 'Hide password' : 'Show password'}
              onClick={() => setShow(!show)}
            >
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </label>
        <small>At least 8 characters, with a letter and number.</small>
        <label>
          Confirm password
          <input
            type={show ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <Button className="full-width">Continue</Button>
        <div className="notice">
          Use a sample password. This frontend demo does not save passwords.
        </div>
      </form>
    </AuthLayout>
  );
}
export function BusinessSetup() {
  const record = onboarding();
  const navigate = useNavigate();
  const { login } = useSession();
  const client = useQueryClient();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!record?.passwordSet) navigate('/signup', { replace: true });
  }, [navigate, record?.passwordSet]);
  return (
    <AuthLayout step={4}>
      <p className="eyebrow">Let’s make it your own</p>
      <h2>Meet your business.</h2>
      <p>A few details, and your next chapter is ready.</p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!record) return;
          const f = new FormData(e.currentTarget);
          setBusy(true);
          try {
            const state = await api<Workspace>('/workspace');
            const p: Profile = {
              ...state.profile,
              name: String(f.get('name')),
              business: String(f.get('business')),
              category: String(f.get('category')),
              email: record.contact.includes('@') ? record.contact : '',
              phone: record.contact.includes('@') ? '' : record.contact,
            };
            await api('/profile', p, 'PUT');
            await client.invalidateQueries({ queryKey: ['workspace'] });
            login(record.contact);
            navigate('/app');
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Your full name
          <input
            name="name"
            autoComplete="name"
            placeholder="Ada Okafor"
            minLength={2}
            maxLength={80}
            required
          />
        </label>
        <label>
          Business name
          <input
            name="business"
            autoComplete="organization"
            placeholder="Ada Atelier"
            minLength={2}
            maxLength={80}
            required
          />
        </label>
        <label>
          Business category
          <select name="category">
            <option>Fashion & accessories</option>
            <option>Electronics</option>
            <option>Food & hospitality</option>
            <option>Retail</option>
            <option>Professional services</option>
            <option>Other</option>
          </select>
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <Button className="full-width" disabled={busy}>
          {busy ? 'Preparing workspace…' : 'Meet your workspace'}
        </Button>
      </form>
    </AuthLayout>
  );
}
export function Login() {
  const { login } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [error, setError] = useState('');
  function demo() {
    login('demo@safer.example');
    const next = params.get('next');
    navigate(
      next === 'links'
        ? '/app/payment-links'
        : next === 'catalogue'
          ? '/app/catalogue'
          : next === 'deliveries'
            ? '/app/deliveries'
            : '/app',
    );
  }
  return (
    <AuthLayout compact>
      <p className="eyebrow">Good to have you back</p>
      <h2>Your business awaits.</h2>
      <p>Sign in to pick up where you left off.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const contact = String(f.get('contact')).trim();
          if (!contact || String(f.get('password')).length < 8) {
            setError('Enter your contact and a sample password of at least 8 characters.');
            return;
          }
          login(contact);
          navigate((location.state as { from?: string } | null)?.from || '/app');
        }}
      >
        <label>
          Email or phone number
          <input
            name="contact"
            autoComplete="username"
            required
            placeholder="you@yourbusiness.com"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            minLength={8}
          />
        </label>
        <Link className="subtle-link right" to="/password/reset">
          Forgot password?
        </Link>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <Button className="full-width">Sign in</Button>
        <div className="auth-or">
          <span />
          or explore first
          <span />
        </div>
        <Button type="button" className="full-width" variant="secondary" onClick={demo}>
          Open demo workspace
        </Button>
        <p className="auth-caption">
          New here? <Link to="/signup">Create a merchant account</Link>
        </p>
        <div className="notice">Demo access only. No real credentials are checked or stored.</div>
      </form>
    </AuthLayout>
  );
}
export function ResetPassword() {
  const [sent, setSent] = useState(false);
  const toast = useToast();
  return (
    <AuthLayout>
      <p className="eyebrow">Let’s get you back in</p>
      <h2>{sent ? 'Check your inbox.' : 'Forgot your password?'}</h2>
      <p>
        {sent
          ? 'In production, a recovery link would be sent if the account exists. No email is sent in this demo.'
          : 'Enter your email address to request a recovery link.'}
      </p>
      {sent ? (
        <>
          <Button
            className="full-width"
            variant="secondary"
            onClick={() => toast('Demo only: no recovery email was sent.')}
          >
            Resend recovery link
          </Button>
          <Link className="subtle-link" to="/login">
            Back to sign in
          </Link>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <label>
            Email address
            <input type="email" required autoComplete="email" placeholder="you@yourbusiness.com" />
          </label>
          <Button className="full-width">Send recovery link</Button>
        </form>
      )}
    </AuthLayout>
  );
}
