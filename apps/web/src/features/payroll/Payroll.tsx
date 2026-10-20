import { staffSchema, type Staff, type StaffInput, type PayrollRun } from '@safer/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Check, Download, Plus, Users, Wallet } from 'lucide-react';
import { useState } from 'react';
import { Badge, Button, Dialog, Empty, PageHeading, useToast } from '../../components/ui';
import { api, useWorkspace } from '../../lib/api';
import { date, money, toMinor as toMinorSafe } from '../../lib/money';
import './payroll.css';
const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};
const monthLabel = (month: string) =>
  new Intl.DateTimeFormat('en-NG', { month: 'long', year: 'numeric' }).format(
    new Date(`${month}-01T12:00:00`),
  );
function statusLabel(run: PayrollRun) {
  return run.status === 'paid' ? 'Paid · demo' : run.status[0].toUpperCase() + run.status.slice(1);
}
export default function Payroll() {
  const { data } = useWorkspace();
  const [tab, setTab] = useState<'runs' | 'staff'>('runs');
  const [editor, setEditor] = useState<Staff | 'new' | null>(null);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  if (!data) return null;
  const active = data.staff.filter((s) => s.status === 'active');
  const run = data.payrollRuns.find((r) => r.id === selected);
  const staff = data.staff.filter((s) =>
    `${s.name} ${s.role} ${s.department}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="page-content payroll-page">
      <PageHeading
        eyebrow="Your people. Taken care of."
        title="Staff & payroll"
        description="Keep your team organised and prepare monthly salaries with confidence."
        action={
          <Button onClick={() => setEditor('new')}>
            <Plus size={17} /> Add staff
          </Button>
        }
      />
      <section className="payroll-hero">
        <div className="payroll-hero-icon">
          <Users size={28} />
        </div>
        <div>
          <small>BUILT FOR YOUR TEAM</small>
          <h2>Make payday feel effortless.</h2>
          <p>Review every salary before you record a payment.</p>
        </div>
        <Button onClick={() => setCreating(true)} disabled={!active.length}>
          Prepare payroll
        </Button>
      </section>
      <div className="payroll-summary">
        <div>
          <Users size={19} />
          <span>Active staff</span>
          <strong>{active.length}</strong>
        </div>
        <div>
          <CalendarDays size={19} />
          <span>Awaiting review</span>
          <strong>{data.payrollRuns.filter((r) => r.status === 'draft').length}</strong>
        </div>
        <div>
          <Wallet size={19} />
          <span>Ready to record</span>
          <strong>{data.payrollRuns.filter((r) => r.status === 'approved').length}</strong>
        </div>
      </div>
      <div className="payroll-tabs" role="group" aria-label="Payroll views">
        <button aria-pressed={tab === 'runs'} onClick={() => setTab('runs')}>
          Payroll runs <span>{data.payrollRuns.length}</span>
        </button>
        <button aria-pressed={tab === 'staff'} onClick={() => setTab('staff')}>
          Staff directory <span>{data.staff.length}</span>
        </button>
      </div>
      {tab === 'runs' ? (
        <section className="payroll-panel">
          <div className="payroll-panel-heading">
            <div>
              <h2>Payroll history</h2>
              <p>A clear record of every month and currency.</p>
            </div>
            <Button variant="secondary" onClick={() => setCreating(true)} disabled={!active.length}>
              <Plus size={16} /> New run
            </Button>
          </div>
          {data.payrollRuns.length ? (
            <div className="payroll-run-list">
              {data.payrollRuns.map((r) => (
                <button className="payroll-run-row" key={r.id} onClick={() => setSelected(r.id)}>
                  <div className="payroll-month-icon">
                    <CalendarDays size={22} />
                  </div>
                  <div>
                    <strong>{monthLabel(r.month)}</strong>
                    <small>
                      {r.lines.length} staff · {r.currency}
                    </small>
                  </div>
                  <div className="payroll-run-amount">
                    <strong>{money(r.netMinor, r.currency)}</strong>
                    <Badge
                      tone={
                        r.status === 'paid'
                          ? 'success'
                          : r.status === 'draft'
                            ? 'warning'
                            : 'neutral'
                      }
                    >
                      {statusLabel(r)}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <Empty
              title="Your first payday starts here"
              action={
                <Button onClick={() => (active.length ? setCreating(true) : setEditor('new'))}>
                  {active.length ? 'Prepare first payroll' : 'Add your first staff member'}
                </Button>
              }
            >
              Add your team and their monthly pay, then prepare a payroll run to review.
            </Empty>
          )}
        </section>
      ) : (
        <section className="payroll-panel">
          <div className="payroll-panel-heading">
            <div>
              <h2>Your team</h2>
              <p>Salary settings apply to future payroll runs.</p>
            </div>
          </div>
          <input
            aria-label="Search staff"
            placeholder="Search name, role or department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="payroll-staff-list">
            {staff.map((s) => (
              <article className="payroll-staff-row" key={s.id}>
                <div className="payroll-staff-avatar">
                  {s.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div className="payroll-staff-info">
                  <h3>{s.name}</h3>
                  <p>
                    {s.role}
                    {s.department ? ` · ${s.department}` : ''}
                  </p>
                  <small>{s.email || 'No email added'}</small>
                </div>
                <div className="payroll-staff-salary">
                  <strong>
                    {money(
                      (
                        BigInt(toMinorSafe(s.salary)) +
                        BigInt(toMinorSafe(s.allowance)) -
                        BigInt(toMinorSafe(s.deduction))
                      ).toString(),
                      s.currency,
                    )}
                  </strong>
                  <small>Net / month</small>
                  <Badge tone={s.status === 'active' ? 'success' : 'neutral'}>
                    {s.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <Button variant="ghost" onClick={() => setEditor(s)}>
                  Edit
                </Button>
              </article>
            ))}
          </div>
          {!staff.length && (
            <Empty title={data.staff.length ? 'No matching staff' : 'Meet your growing team'}>
              Add staff to manage salaries, allowances and deductions in one place.
            </Empty>
          )}
        </section>
      )}
      <p className="payroll-demo-note">
        Demo payroll · no money is sent or deducted from wallets. Amounts are entered manually; tax,
        pension and statutory deductions are not calculated.
      </p>
      {editor && (
        <Dialog
          title={editor === 'new' ? 'Add staff member' : 'Edit staff member'}
          onClose={() => setEditor(null)}
        >
          <StaffForm staff={editor === 'new' ? undefined : editor} onDone={() => setEditor(null)} />
        </Dialog>
      )}
      {creating && (
        <Dialog title="Prepare monthly payroll" onClose={() => setCreating(false)}>
          <PreparePayroll
            staff={data.staff}
            onDone={(id) => {
              setCreating(false);
              setSelected(id);
            }}
          />
        </Dialog>
      )}
      {run && (
        <Dialog title={`${monthLabel(run.month)} payroll`} onClose={() => setSelected(null)}>
          <RunDetails run={run} />
        </Dialog>
      )}
    </div>
  );
}
function StaffForm({ staff, onDone }: { staff?: Staff; onDone: () => void }) {
  const [value, setValue] = useState<StaffInput>(
    staff ?? {
      name: '',
      email: '',
      role: '',
      department: '',
      startDate: new Date().toISOString().slice(0, 10),
      salary: '',
      allowance: '0',
      deduction: '0',
      deductionNote: '',
      currency: 'NGN',
      status: 'active',
    },
  );
  const [error, setError] = useState('');
  const client = useQueryClient();
  const toast = useToast();
  const mutation = useMutation({
    mutationFn: (input: StaffInput) =>
      api(staff ? `/staff/${staff.id}` : '/staff', input, staff ? 'PUT' : 'POST'),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['workspace'] });
      toast('Staff details saved.');
      onDone();
    },
  });
  const field = (key: keyof StaffInput, next: string) => setValue((v) => ({ ...v, [key]: next }));
  return (
    <form
      className="stack-form payroll-form"
      onSubmit={(e) => {
        e.preventDefault();
        const result = staffSchema.safeParse(value);
        if (!result.success) {
          setError(result.error.issues[0].message);
          return;
        }
        setError('');
        mutation.mutate(result.data);
      }}
    >
      <div className="payroll-form-section">
        <h3>Staff details</h3>
        <label>
          Full name
          <input
            required
            maxLength={100}
            value={value.name}
            onChange={(e) => field('name', e.target.value)}
            placeholder="e.g. Amaka Okoye"
          />
        </label>
        <label>
          Email (optional)
          <input
            type="email"
            value={value.email}
            onChange={(e) => field('email', e.target.value)}
            placeholder="name@example.com"
          />
        </label>
        <div className="form-row">
          <label>
            Job role
            <input
              required
              maxLength={100}
              value={value.role}
              onChange={(e) => field('role', e.target.value)}
              placeholder="e.g. Sales associate"
            />
          </label>
          <label>
            Department
            <input
              maxLength={80}
              value={value.department}
              onChange={(e) => field('department', e.target.value)}
              placeholder="e.g. Operations"
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Start date
            <input
              type="date"
              required
              value={value.startDate}
              onChange={(e) => field('startDate', e.target.value)}
            />
          </label>
          <label>
            Staff status
            <select value={value.status} onChange={(e) => field('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>
      </div>
      <div className="payroll-form-section">
        <h3>Monthly compensation</h3>
        <div className="form-row">
          <label>
            Basic salary
            <input
              inputMode="decimal"
              required
              value={value.salary}
              onChange={(e) => field('salary', e.target.value)}
              placeholder="0.00"
            />
          </label>
          <label>
            Salary currency
            <select value={value.currency} onChange={(e) => field('currency', e.target.value)}>
              {['NGN', 'USD', 'EUR', 'USDC'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-row">
          <label>
            Monthly allowances
            <input
              inputMode="decimal"
              required
              value={value.allowance}
              onChange={(e) => field('allowance', e.target.value)}
            />
          </label>
          <label>
            Monthly deductions
            <input
              inputMode="decimal"
              required
              value={value.deduction}
              onChange={(e) => field('deduction', e.target.value)}
            />
          </label>
        </div>
        <label>
          Deduction explanation
          <input
            maxLength={200}
            value={value.deductionNote}
            onChange={(e) => field('deductionNote', e.target.value)}
            placeholder="e.g. Agreed salary advance repayment"
          />
        </label>
        <p className="muted">
          Net pay = basic salary + allowances − deductions. Inactive staff are excluded from future
          runs; historical records are preserved.
        </p>
      </div>
      <div className="notice">
        Use sample staff details in this browser-local demo. No invitation or payslip email is sent.
      </div>
      {(error || mutation.error) && (
        <p role="alert" className="form-error">
          {error || mutation.error?.message}
        </p>
      )}
      <Button disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving…' : 'Save staff member'}
      </Button>
    </form>
  );
}
function PreparePayroll({ staff, onDone }: { staff: Staff[]; onDone: (id: string) => void }) {
  const [month, setMonth] = useState(currentMonth());
  const [currency, setCurrency] = useState<Staff['currency']>('NGN');
  const eligible = staff.filter(
    (s) => s.status === 'active' && s.currency === currency && s.startDate.slice(0, 7) <= month,
  );
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => api<PayrollRun>('/payroll', { month, currency }),
    onSuccess: (run) => {
      client.invalidateQueries({ queryKey: ['workspace'] });
      onDone(run.id);
    },
  });
  return (
    <form
      className="stack-form payroll-form"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <div className="form-row">
        <label>
          Payroll month
          <input type="month" required value={month} onChange={(e) => setMonth(e.target.value)} />
        </label>
        <label>
          Payroll currency
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Staff['currency'])}
          >
            {['NGN', 'USD', 'EUR', 'USDC'].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="payroll-eligibility">
        <Users size={22} />
        <strong>{eligible.length} eligible staff</strong>
        <p>Active staff in {currency}, starting on or before this month.</p>
      </div>
      <div className="notice">
        This prepares a full month of pay using the current salary settings. Part-month proration,
        overtime and statutory deductions are not calculated. Review all amounts before approving.
      </div>
      {mutation.error && (
        <p role="alert" className="form-error">
          {mutation.error.message}
        </p>
      )}
      <Button disabled={!month || !eligible.length || mutation.isPending}>
        {mutation.isPending ? 'Preparing…' : 'Create draft for review'}
      </Button>
    </form>
  );
}
function exportRun(run: PayrollRun) {
  const cell = (s: string) => `"${s.replaceAll('"', '""').replace(/^[=+@-]/, "'$&")}"`;
  const rows = [
    [
      'Payroll month',
      'Currency',
      'Status',
      'Staff',
      'Role',
      'Basic salary',
      'Allowances',
      'Deductions',
      'Deduction explanation',
      'Net pay',
    ],
    ...run.lines.map((l) => [
      run.month,
      run.currency,
      statusLabel(run),
      l.name,
      l.role,
      (Number(l.salaryMinor) / 100).toFixed(2),
      (Number(l.allowanceMinor) / 100).toFixed(2),
      (Number(l.deductionMinor) / 100).toFixed(2),
      l.deductionNote,
      (Number(l.netMinor) / 100).toFixed(2),
    ]),
  ];
  const url = URL.createObjectURL(
    new Blob(['\uFEFF' + rows.map((r) => r.map(cell).join(',')).join('\r\n')], {
      type: 'text/csv;charset=utf-8;',
    }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `payroll-${run.month}-${run.currency}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function RunDetails({ run }: { run: PayrollRun }) {
  const [confirmPay, setConfirmPay] = useState(false);
  const client = useQueryClient();
  const toast = useToast();
  const mutation = useMutation({
    mutationFn: (action: 'approve' | 'pay' | 'cancel') => api(`/payroll/${run.id}/${action}`, {}),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['workspace'] });
      setConfirmPay(false);
      toast('Payroll record updated.');
    },
  });
  return (
    <div className="payroll-run-detail">
      <div className="payroll-detail-top">
        <Badge
          tone={run.status === 'paid' ? 'success' : run.status === 'draft' ? 'warning' : 'neutral'}
        >
          {statusLabel(run)}
        </Badge>
        <button className="payroll-export" onClick={() => exportRun(run)}>
          <Download size={16} /> Export CSV
        </button>
      </div>
      <div className="payroll-total">
        <small>NET PAYROLL · {run.currency}</small>
        <strong>{money(run.netMinor, run.currency)}</strong>
        <span>
          {run.lines.length} staff · {monthLabel(run.month)}
        </span>
      </div>
      <div className="payroll-breakdown">
        <div>
          <span>Gross pay</span>
          <strong>{money(run.grossMinor, run.currency)}</strong>
        </div>
        <div>
          <span>Deductions</span>
          <strong>{money(run.deductionMinor, run.currency)}</strong>
        </div>
      </div>
      <h3>Staff breakdown</h3>
      {run.lines.map((line) => (
        <article className="payroll-line" key={line.staffId}>
          <header>
            <div>
              <strong>{line.name}</strong>
              <small>{line.role}</small>
            </div>
            <strong>{money(line.netMinor, run.currency)}</strong>
          </header>
          <dl>
            <div>
              <dt>Basic salary</dt>
              <dd>{money(line.salaryMinor, run.currency)}</dd>
            </div>
            <div>
              <dt>Allowances</dt>
              <dd>{money(line.allowanceMinor, run.currency)}</dd>
            </div>
            <div>
              <dt>Deductions</dt>
              <dd>{money(line.deductionMinor, run.currency)}</dd>
            </div>
          </dl>
          {line.deductionNote && <p>{line.deductionNote}</p>}
        </article>
      ))}
      <p className="muted">
        Created {date(run.createdAt)}
        {run.approvedAt ? ` · Approved ${date(run.approvedAt)}` : ''}
        {run.paidAt ? ` · Demo payment recorded ${date(run.paidAt)}` : ''}
      </p>
      {run.status === 'draft' && (
        <div className="notice">
          This draft is a snapshot. To change salary amounts, cancel it, edit staff settings, then
          create a new run. Approval locks this record.
        </div>
      )}
      {mutation.error && (
        <p role="alert" className="form-error">
          {mutation.error.message}
        </p>
      )}
      {run.status === 'draft' && (
        <div className="payroll-actions">
          <Button
            variant="secondary"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate('cancel')}
          >
            Cancel draft
          </Button>
          <Button disabled={mutation.isPending} onClick={() => mutation.mutate('approve')}>
            <Check size={16} /> Approve payroll
          </Button>
        </div>
      )}
      {run.status === 'approved' &&
        (confirmPay ? (
          <div className="payroll-confirm">
            <h3>Record a simulated payment?</h3>
            <p>
              This marks {money(run.netMinor, run.currency)} for {run.lines.length} staff as paid in
              the demo. No transfer is made and wallet balances stay the same.
            </p>
            <div className="payroll-actions">
              <Button variant="secondary" onClick={() => setConfirmPay(false)}>
                Go back
              </Button>
              <Button disabled={mutation.isPending} onClick={() => mutation.mutate('pay')}>
                Confirm demo payment
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => setConfirmPay(true)}>Record demo payment</Button>
        ))}
      {run.status === 'paid' && (
        <div className="notice">Demo payment recorded. No money was transferred.</div>
      )}
    </div>
  );
}
