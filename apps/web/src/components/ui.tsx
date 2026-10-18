import { AlertCircle, ArrowUpRight, Check, Copy, X } from 'lucide-react';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import { Link } from 'react-router-dom';
import styles from './ui.module.css';
export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}) {
  return <button className={`${styles.button} ${styles[variant]} ${className}`} {...props} />;
}
export function Logo({ light = false, to = '/' }: { light?: boolean; to?: string }) {
  return (
    <Link
      to={to}
      className={`brand ${light ? 'brand-light' : ''}`}
      aria-label={to === '/app' ? 'Safer Business workspace home' : 'Safer Business home'}
    >
      <img src="/images/logo.png" alt="" width="30" height="30" />
      <span>Safer Business</span>
    </Link>
  );
}
export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'error';
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
export function Status({ value }: { value: string }) {
  return (
    <Badge
      tone={
        value === 'paid' || value === 'Delivered'
          ? 'success'
          : value === 'failed' || value === 'expired'
            ? 'error'
            : 'warning'
      }
    >
      {value === 'paid' ? 'Completed' : value[0].toUpperCase() + value.slice(1)}
    </Badge>
  );
}
export function Empty({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-symbol">○</div>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <span className="spinner" /> Getting your business ready…
    </div>
  );
}
export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="empty" role="alert">
      <AlertCircle />
      <h3>We couldn’t load this</h3>
      <p>{message}</p>
      {retry && <Button onClick={retry}>Try again</Button>}
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const previous = useRef<HTMLElement | null>(null);
  useEffect(() => {
    previous.current = document.activeElement as HTMLElement;
    const d = ref.current;
    d?.showModal();
    return () => {
      d?.close();
      previous.current?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <header>
        <h2 id="dialog-title">{title}</h2>
        <button className="icon-button" aria-label="Close dialog" onClick={onClose}>
          <X size={20} />
        </button>
      </header>
      <div className="dialog-body">{children}</div>
    </dialog>
  );
}
const ToastContext = createContext<(message: string) => void>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, set] = useState('');
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => set(''), 4000);
    return () => clearTimeout(t);
  }, [message]);
  return (
    <ToastContext.Provider value={(m) => set(m)}>
      {children}
      <div className={`toast ${message ? 'toast-visible' : ''}`} role="status">
        {message && (
          <>
            <Check size={17} />
            {message}
          </>
        )}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
export function CopyButton({ value, label = 'Copy link' }: { value: string; label?: string }) {
  const toast = useToast();
  return (
    <Button
      variant="secondary"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          toast('Copied to clipboard.');
        } catch {
          toast('Clipboard unavailable. Select and copy the link below.');
        }
      }}
    >
      {label}
    </Button>
  );
}
export function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}
export function HelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="A little help goes a long way" onClose={onClose}>
      <p>
        Use the assistant to prepare payment links, check stock or arrange a delivery. You can also
        use the business menu for each task.
      </p>
      <div className="notice">
        You’re exploring a frontend demo. No real payments are collected and no riders are booked.
      </div>
      <p>
        For this demo, the verification code is <strong>123456</strong>. Your sample business data
        stays in this browser.
      </p>
      <Button onClick={onClose}>Got it</Button>
    </Dialog>
  );
}
export { ArrowUpRight, Copy };
