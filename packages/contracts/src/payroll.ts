import { z } from 'zod';
const amount = z
  .string()
  .regex(/^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/, 'Enter an amount with up to two decimals.');
export const staffSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.union([z.literal(''), z.email()]),
    role: z.string().trim().min(2).max(100),
    department: z.string().trim().max(80),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine(
        (v) => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v,
        'Choose a valid start date.',
      ),
    salary: amount.refine((v) => Number(v) > 0, 'Monthly salary must be greater than zero.'),
    allowance: amount,
    deduction: amount,
    deductionNote: z.string().trim().max(200),
    currency: z.enum(['NGN', 'USD', 'EUR', 'USDC']),
    status: z.enum(['active', 'inactive']),
  })
  .superRefine((v, ctx) => {
    if (
      ![v.salary, v.allowance, v.deduction].every((s) =>
        /^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(s),
      )
    )
      return;
    const minor = (s: string) => {
      const [w, f = ''] = s.split('.');
      return BigInt(w) * 100n + BigInt(f.padEnd(2, '0'));
    };
    if (minor(v.deduction) > minor(v.salary) + minor(v.allowance))
      ctx.addIssue({ code: 'custom', message: 'Deductions cannot exceed salary plus allowances.' });
    if (Number(v.deduction) > 0 && !v.deductionNote)
      ctx.addIssue({ code: 'custom', message: 'Explain the deduction.' });
  });
export type StaffInput = z.infer<typeof staffSchema>;
export type Staff = StaffInput & { id: string };
export interface PayrollLine {
  staffId: string;
  name: string;
  role: string;
  department: string;
  salaryMinor: string;
  allowanceMinor: string;
  deductionMinor: string;
  deductionNote: string;
  netMinor: string;
}
export interface PayrollRun {
  id: string;
  month: string;
  currency: Staff['currency'];
  status: 'draft' | 'approved' | 'paid' | 'cancelled';
  createdAt: string;
  approvedAt?: string;
  paidAt?: string;
  lines: PayrollLine[];
  grossMinor: string;
  deductionMinor: string;
  netMinor: string;
}
