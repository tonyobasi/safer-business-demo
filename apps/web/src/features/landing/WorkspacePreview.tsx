import {
  ArrowDownLeft,
  ArrowUp,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bike,
  ChevronDown,
  ChevronRight,
  Eye,
  HelpCircle,
  Link2,
  LockKeyhole,
  Package,
  ReceiptText,
  Settings,
  Sparkles,
  Truck,
  User,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from './WorkspacePreview.module.css';

const prompts = [
  { icon: Link2, label: 'Get paid', text: 'Create a payment link.' },
  { icon: ArrowDownLeft, label: 'Stay on top', text: 'Show today’s payments.' },
  { icon: BarChart3, label: 'See performance', text: 'How many items have I sold?' },
  { icon: Package, label: 'Manage stock', text: 'What stock do I have left?' },
  { icon: Bike, label: 'Send it out', text: 'Find a rider for a delivery.' },
];
const payments = [
  '₦85,000 · Amina Yusuf',
  '$120 · Daniel James',
  '₦42,500 · Tola Ade',
  '₦18,000 · Chioma Obi',
];
const tools = [
  { icon: Package, label: 'Catalogue' },
  { icon: ReceiptText, label: 'Payments' },
  { icon: Truck, label: 'Deliveries' },
  { icon: User, label: 'Profile' },
  { icon: Settings, label: 'Settings' },
];

/** A scaled, non-interactive representation of the merchant workspace, using the same UI structure. */
export default function WorkspacePreview() {
  return (
    <div className={styles.presentation}>
      <div
        className={styles.frame}
        role="img"
        aria-label="Safer Business merchant dashboard with recent payments, the AI assistant, USD and NGN balances, catalogue, payments and delivery tools"
      >
        <div className={styles.dashboard} aria-hidden="true">
          <div className={styles.header}>
            <div className={styles.brand}>
              <img src="/images/logo.png" alt="" />
              Safer Business
            </div>
            <span className={styles.business}>
              <span className={styles.avatar}>aa</span>Ada Atelier
              <ChevronDown />
            </span>
            <span className={styles.health}>• Your workspace is up to date</span>
            <Bell />
            <span className={styles.avatar}>AO</span>
          </div>
          <div className={styles.body}>
            <div className={styles.rail}>
              <div className={styles.newChat}>
                New conversation <span>⌘ K</span>
              </div>
              <p className={styles.eyebrow}>Recent payments</p>
              <div className={styles.payments}>
                {payments.map((p, i) => (
                  <div key={p}>
                    <ReceiptText />
                    <span>
                      {p}
                      <small>{i < 2 ? 'Today' : 'Yesterday'}</small>
                    </span>
                  </div>
                ))}
              </div>
              <div className={styles.railBottom}>
                <div className={styles.help}>
                  <Sparkles />
                  <strong>A little help goes a long way.</strong>
                  <p>
                    Ask about payments, stock or your next delivery. Focus on your next big thing.
                  </p>
                </div>
                <div className={styles.support}>
                  <HelpCircle />
                  Help and support
                  <ArrowUpRight />
                </div>
                <div className={styles.account}>
                  <span className={styles.avatar}>AO</span>
                  <span>
                    Ada Okafor<small>Business owner</small>
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.assistant}>
              <div className={styles.topline}>
                <span>Your business assistant</span>
                <span>
                  <LockKeyhole />
                  Private workspace
                </span>
              </div>
              <div className={styles.welcome}>
                <h3>Good morning, Ada. What would you like to do for your business today?</h3>
                <p>Less admin, more possibility. Let’s get to work.</p>
                <div className={styles.prompts}>
                  {prompts.map((p) => (
                    <div key={p.text}>
                      <p.icon />
                      <span>
                        <small>{p.label}</small>
                        {p.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.composer}>
                <div>Ask about payments, stock, or deliveries…</div>
                <div>
                  <span>
                    <Sparkles />
                    AI by your side
                  </span>
                  <span className={styles.send}>
                    <ArrowUp />
                  </span>
                </div>
              </div>
              <p className={styles.footnote}>
                Your assistant can make mistakes. Review important details.
              </p>
            </div>
            <div className={styles.overview}>
              <div className={styles.balanceTitle}>
                Your balances
                <Eye />
              </div>
              {(['USD', 'NGN'] as const).map((c) => (
                <div className={`${styles.balance} ${c === 'USD' ? styles.dark : ''}`} key={c}>
                  <div>
                    {c} balance<span>{c === 'USD' ? '$' : '₦'}</span>
                  </div>
                  <small>Available</small>
                  <strong>{c === 'USD' ? '$4,280.00' : '₦1,284,500.00'}</strong>
                  <div className={styles.pending}>
                    <span>Pending</span>
                    <span>{c === 'USD' ? '$320.00' : '₦85,000.00'}</span>
                  </div>
                </div>
              ))}
              <p className={styles.quickTitle}>Quick actions</p>
              <div className={styles.quickActions}>
                <span>
                  <i>
                    <Link2 />
                  </i>
                  Create payment
                  <br />
                  link
                </span>
                <span>
                  <i>
                    <ArrowDownLeft />
                  </i>
                  Receive money
                </span>
                <span>
                  <i>
                    <ArrowUpRight />
                  </i>
                  Withdraw
                </span>
              </div>
              <p className={styles.eyebrow}>Your business</p>
              <div className={styles.tools}>
                {tools.map((t) => (
                  <div key={t.label}>
                    <t.icon />
                    <span>{t.label}</span>
                    <ChevronRight />
                  </div>
                ))}
              </div>
              <p className={styles.secure}>Your business. Your next chapter.</p>
            </div>
          </div>
        </div>
      </div>
      <Link className="pill-button" to="/login?demo=1">
        Try the workspace
      </Link>
    </div>
  );
}
