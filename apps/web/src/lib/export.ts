import type { Payment } from '@safer/contracts';
export function exportPayments(payments: Payment[]) {
  const cell = (s: string) => '"' + (/^[=+@-]/.test(s) ? "'" : '') + s.replaceAll('"', '""') + '"';
  const rows = [
    ['Reference', 'Customer', 'Description', 'Currency', 'Amount minor units', 'Status', 'Date'],
    ...payments.map((p) => [
      p.id,
      p.customer,
      p.description,
      p.currency,
      p.amountMinor,
      p.status,
      p.createdAt,
    ]),
  ];
  const blob = new Blob([rows.map((row) => row.map(cell).join(',')).join('\r\n')], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'safer-business-payments.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
