# Staff and payroll demo

Open `/app/payroll` or choose **Staff & payroll** in the business navigation. On mobile, use the business menu.

- Staff directory: name, optional email, role, department, start date, active/inactive status, monthly basic salary, allowances, deductions, deduction explanation and currency (NGN/USD/EUR/USDC).
- Prepare a monthly payroll for one currency. It includes active staff whose start month is on or before the selected payroll month. Full-month compensation is used; there is no proration, overtime calculation or automatic tax/pension calculation.
- Drafts snapshot current staff settings and show per-person salary, allowances, deductions and net pay, with aggregate gross/deduction/net totals. Updating staff never rewrites existing runs.
- Review and approve a draft before recording a simulated payment. The explicit confirmation records a demo-paid status and timestamp; no wallet balance changes, real payouts or emails occur.
- Drafts can be cancelled and recreated after changing staff settings. Approved/paid records cannot be cancelled or edited. The cancelled record remains in history. Only one non-cancelled run is permitted per month/currency.
- CSV export downloads the selected run locally. Monetary calculations use integer minor units, and formula-like CSV text is escaped.

All staff and payroll records are browser-local demo data; use sample personal details. Existing workspaces migrate to empty staff/payroll lists. Storage failures roll back payroll mutations. A live implementation needs payroll access controls, a secure staff-data backend, audit logging, legally appropriate payroll calculations and a real payout integration.
