import { staffSchema, type StaffInput } from '@safer/contracts';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { repo } from './repository';
const staff: StaffInput = {
  name: 'Demo Staff',
  email: 'staff@example.com',
  role: 'Sales associate',
  department: 'Retail',
  startDate: '2026-01-01',
  salary: '150000.25',
  allowance: '20000.10',
  deduction: '5000.05',
  deductionNote: 'Advance repayment',
  currency: 'NGN',
  status: 'active',
};
beforeEach(() => repo.reset());
afterEach(() => vi.restoreAllMocks());
it('calculates precise monthly payroll, rejects duplicates and snapshots staff settings', () => {
  const person = repo.saveStaff(staff);
  const run = repo.createPayroll('2026-10', 'NGN');
  expect(run.grossMinor).toBe('17000035');
  expect(run.deductionMinor).toBe('500005');
  expect(run.netMinor).toBe('16500030');
  expect(() => repo.createPayroll('2026-10', 'NGN')).toThrow('already exists');
  repo.saveStaff({ ...staff, salary: '200000', status: 'inactive' }, person.id);
  expect(repo.read().payrollRuns[0].lines[0].salaryMinor).toBe('15000025');
  expect(() => repo.createPayroll('2026-11', 'NGN')).toThrow('Add active staff');
});
it('excludes inactive staff, other currencies and future starters', () => {
  repo.saveStaff(staff);
  repo.saveStaff({ ...staff, name: 'Inactive', email: '', status: 'inactive' });
  repo.saveStaff({ ...staff, name: 'USD Staff', email: '', currency: 'USD' });
  repo.saveStaff({ ...staff, name: 'Future Staff', email: '', startDate: '2027-01-01' });
  expect(repo.createPayroll('2026-10', 'NGN').lines).toHaveLength(1);
  expect(() => repo.createPayroll('2026-13', 'NGN')).toThrow('valid payroll month');
});
it('requires approval before demo payment and never changes wallet balances', () => {
  repo.saveStaff(staff);
  const run = repo.createPayroll('2026-10', 'NGN');
  const balances = repo.read().balances;
  expect(() => repo.advancePayroll(run.id, 'pay')).toThrow('current payroll status');
  repo.advancePayroll(run.id, 'approve');
  repo.advancePayroll(run.id, 'approve');
  expect(repo.advancePayroll(run.id, 'pay').status).toBe('paid');
  repo.advancePayroll(run.id, 'pay');
  expect(repo.read().balances).toEqual(balances);
  expect(repo.read().payrollRuns).toHaveLength(1);
  expect(() => repo.advancePayroll(run.id, 'cancel')).toThrow('current payroll status');
});
it('retains cancelled drafts while allowing a corrected replacement', () => {
  repo.saveStaff(staff);
  const run = repo.createPayroll('2026-10', 'NGN');
  repo.advancePayroll(run.id, 'cancel');
  const replacement = repo.createPayroll('2026-10', 'NGN');
  expect(replacement.id).not.toBe(run.id);
  expect(repo.read().payrollRuns).toHaveLength(2);
});
it('rejects malformed amounts, negative net pay, missing deduction explanation and duplicate staff emails', () => {
  expect(staffSchema.safeParse({ ...staff, salary: 'abc' }).success).toBe(false);
  expect(staffSchema.safeParse({ ...staff, startDate: '2026-02-30' }).success).toBe(false);
  expect(() => repo.saveStaff({ ...staff, deduction: '999999' })).toThrow('cannot exceed');
  expect(() => repo.saveStaff({ ...staff, deductionNote: '' })).toThrow('Explain');
  repo.saveStaff(staff);
  expect(() => repo.saveStaff({ ...staff, email: 'STAFF@example.com' })).toThrow('already exists');
});
it('rolls back a failed payroll save when storage is full', () => {
  repo.saveStaff(staff);
  const run = repo.createPayroll('2026-10', 'NGN');
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Full');
  });
  expect(() => repo.advancePayroll(run.id, 'approve')).toThrow('Unable to save');
  expect(repo.read().payrollRuns[0].status).toBe('draft');
});
