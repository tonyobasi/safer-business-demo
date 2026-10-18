import type { ChatMessage, PaymentLink } from '@safer/contracts';
import {
  ArrowUp,
  CircleCheck,
  BarChart3,
  Bike,
  Link2,
  Package,
  Paperclip,
  X,
  ReceiptText,
  Sparkles,
  Square,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Badge, Button, CopyButton } from '../../components/ui';
import { useWorkspace } from '../../lib/api';
import { money } from '../../lib/money';
import DeliveryForm from '../deliveries/DeliveryForm';
import { PaymentLinkForm } from '../payments/PaymentLinkForm';
import Withdrawal from '../payments/Withdrawal';
import { prepareResponse } from './agent-engine';
const prompts = [
  { icon: Link2, label: 'Get paid', text: 'Create a payment link.' },
  { icon: ReceiptText, label: 'Stay on top', text: 'Show today’s payments.' },
  { icon: BarChart3, label: 'See performance', text: 'How many items have I sold?' },
  { icon: Package, label: 'Manage stock', text: 'What stock do I have left?' },
  { icon: Bike, label: 'Send it out', text: 'Find a rider for a delivery.' },
];
function initialMessages(): ChatMessage[] {
  try {
    return JSON.parse(sessionStorage.getItem('safer-demo-chat') || '[]');
  } catch {
    return [];
  }
}
function PaymentLinkConfirmation({ id, link }: { id: string; link?: PaymentLink }) {
  const url = `${window.location.origin}/pay/${id}`;
  return (
    <div className="chat-link-confirmation">
      <div className="chat-link-summary">
        <div className="chat-link-ready">
          <CircleCheck size={18} />
          <span>PAYMENT LINK CREATED</span>
          <span>Ready to share</span>
        </div>
        <h3>{link?.title || 'Your payment link is ready.'}</h3>
        {link && (
          <strong className="chat-link-amount">
            {money(link.amountMinor, link.currency)} <small>{link.currency}</small>
          </strong>
        )}
        <p>{link?.customer ? `For ${link.customer}` : 'One link. A simpler way to get paid.'}</p>
      </div>
      <div className="chat-link-share">
        <label htmlFor={`chat-link-${id}`}>Your payment link</label>
        <div className="chat-link-copy">
          <input
            id={`chat-link-${id}`}
            readOnly
            aria-label="Generated payment link"
            value={url}
            onFocus={(event) => event.target.select()}
          />
          <CopyButton value={url} />
        </div>
        <div className="chat-link-footer">
          <span>Your customer can pay without an account.</span>
          <Link to={`/app/payment-links/${id}`}>View link details</Link>
        </div>
      </div>
    </div>
  );
}
export default function Agent() {
  const { data } = useWorkspace();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [cancelled, setCancelled] = useState(() =>
    messages.at(-1)?.role === 'user' ? messages.at(-1)!.text : '',
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const location = useLocation();
  useEffect(() => {
    sessionStorage.setItem('safer-demo-chat', JSON.stringify(messages));
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, busy]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    if ((location.state as { reset?: number })?.reset) {
      if (timer.current) clearTimeout(timer.current);
      setBusy(false);
      setMessages([]);
      setText('');
      setCancelled('');
    }
  }, [location.state]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setMessages([]);
        input.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);
  function send(value = text) {
    const hasFiles = files.length > 0;
    const v = [
      value.trim(),
      hasFiles ? `Attachments: ${files.map((file) => file.name).join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');
    if (!v || busy) return;
    setText('');
    setFiles([]);
    setCancelled('');
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'user', text: v }]);
    setBusy(true);
    timer.current = setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          ...(hasFiles
            ? {
                text: 'Your files are selected in this demo. File upload and AI file analysis will be available when the backend is connected.',
              }
            : prepareResponse(v)),
        },
      ]);
      setBusy(false);
      timer.current = null;
    }, 650);
  }
  function complete(id: string, value: string) {
    setMessages((m) => m.map((x) => (x.id === id ? { ...x, completed: value } : x)));
  }
  return (
    <div className="agent-page">
      <div className={`agent-scroll ${messages.length ? 'has-messages' : ''}`}>
        {!messages.length ? (
          <div className="agent-welcome">
            <div className="welcome-mark">
              <Sparkles size={24} />
            </div>
            <p className="eyebrow">A little more possible</p>
            <h1>
              Good morning, {data?.profile.name.split(' ')[0]}. What would you like to do for your
              business today?
            </h1>
            <p>Less admin, more possibility. Let’s get to work.</p>
            <div className="prompt-grid">
              {prompts.map((p) => (
                <button key={p.text} className="prompt-card" onClick={() => send(p.text)}>
                  <p.icon size={18} />
                  <span>
                    <small>{p.label}</small>
                    {p.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="messages">
            {messages.map((m) => (
              <article key={m.id} className={`message message-${m.role}`}>
                <div className="message-label">
                  {m.role === 'assistant' ? (
                    <>
                      <span className="assistant-mark">B</span>Safer assistant <Badge>Demo</Badge>
                    </>
                  ) : (
                    <>You</>
                  )}
                </div>
                <p className="message-text">{m.text}</p>
                {m.completed ? (
                  m.card === 'link' ? (
                    <PaymentLinkConfirmation
                      id={m.completed}
                      link={data?.links.find((link) => link.id === m.completed)}
                    />
                  ) : (
                    <div className="agent-card completed-card">
                      <span className="success-orbit small-orbit">✓</span>
                      <h3>Action prepared.</h3>
                      <Link className="text-button" to={m.completed}>
                        View details
                      </Link>
                    </div>
                  )
                ) : m.card === 'link' ? (
                  <div className="agent-card">
                    <p className="eyebrow">Payment link · Ready for review</p>
                    <PaymentLinkForm
                      currency={m.currency}
                      amount={m.amount}
                      onCreated={(l) => complete(m.id, l.id)}
                    />
                  </div>
                ) : m.card === 'stock' ? (
                  <div className="agent-card">
                    <div className="card-header">
                      <h3>Your stock snapshot</h3>
                      <Badge>Private catalogue</Badge>
                    </div>
                    <div className="stock-mini-list">
                      {data?.items.map((i) => (
                        <div key={i.id}>
                          <span>{i.name}</span>
                          <strong>
                            {i.sold} sold <small>· {i.remaining} remaining</small>
                          </strong>
                        </div>
                      ))}
                    </div>
                    <Link to="/app/catalogue" className="text-button">
                      Open your catalogue
                    </Link>
                  </div>
                ) : m.card === 'payments' ? (
                  <div className="agent-card">
                    <h3>Recent payments</h3>
                    <div className="stock-mini-list">
                      {data?.payments.slice(0, 4).map((p) => (
                        <Link key={p.id} to={`/app/payments/${p.id}`}>
                          <span>
                            {p.customer}
                            <small>{p.status === 'paid' ? 'Completed' : 'Pending'}</small>
                          </span>
                          <strong>{money(p.amountMinor, p.currency)}</strong>
                        </Link>
                      ))}
                    </div>
                    <Link to="/app/payments" className="text-button">
                      View all payments & balances
                    </Link>
                  </div>
                ) : m.card === 'delivery' ? (
                  <div className="agent-card">
                    <p className="eyebrow">Your next delivery</p>
                    <DeliveryForm onBooked={(d) => complete(m.id, `/app/deliveries/${d.id}`)} />
                  </div>
                ) : m.card === 'withdrawal' ? (
                  <div className="agent-card">
                    <Withdrawal onDone={() => complete(m.id, '/app/payments')} />
                  </div>
                ) : null}
              </article>
            ))}
            {busy && (
              <div className="thinking" role="status">
                <span />
                <span />
                <span />
                Preparing your next step…
              </div>
            )}
            {cancelled && (
              <div className="cancelled-message">
                <span>Response stopped.</span>
                <Button variant="ghost" onClick={() => send(cancelled)}>
                  Try again
                </Button>
              </div>
            )}
            <div ref={bottom} />
          </div>
        )}
      </div>
      <div className="composer-wrap">
        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input
            ref={fileInput}
            type="file"
            multiple
            hidden
            onChange={(event) => {
              setFiles((current) => [...current, ...Array.from(event.target.files || [])]);
              event.target.value = '';
            }}
          />
          {files.length > 0 && (
            <div className="composer-attachments">
              {files.map((file, index) => (
                <div className="composer-file" key={`${file.name}-${index}`}>
                  <Paperclip size={14} aria-hidden="true" />
                  <span title={file.name}>{file.name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <small>Demo · Files stay on your device.</small>
            </div>
          )}
          <textarea
            ref={input}
            aria-label="Message your business assistant"
            placeholder="Ask about payments, stock, or deliveries…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <div className="composer-bottom">
            <button
              className="attachment-button"
              type="button"
              aria-label="Attach files"
              title="Attach files"
              disabled={busy}
              onClick={() => fileInput.current?.click()}
            >
              <Paperclip size={16} aria-hidden="true" />
            </button>
            {busy ? (
              <button
                className="send-button"
                type="button"
                aria-label="Stop response"
                onClick={() => {
                  if (timer.current) clearTimeout(timer.current);
                  setBusy(false);
                  setCancelled(messages.at(-1)?.text || '');
                }}
              >
                <Square size={14} />
              </button>
            ) : (
              <button
                className="send-button"
                type="submit"
                disabled={!text.trim() && files.length === 0}
                aria-label="Send message"
              >
                <ArrowUp size={19} />
              </button>
            )}
          </div>
        </form>
        <p className="composer-footnote">
          Demo assistant · Responses and business actions are simulated. Review every detail.
        </p>
      </div>
    </div>
  );
}
