import { afterEach, expect, it, vi } from 'vitest';
import { receiptText, shareReceipt } from './ReceiptActions';
import { seed } from '../../mocks/seed';
afterEach(() => vi.unstubAllGlobals());
it('shares receipt details using the native share sheet without a private workspace URL', async () => {
  const share = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('navigator', { share });
  const text = receiptText(
    seed().payments.find((p) => p.status === 'pending')!,
    'Ada Atelier',
  );
  expect(text).toContain('Status: Pending');
  expect(text).toContain('No real funds transferred');
  expect(text).not.toContain('http');
  expect(await shareReceipt(text)).toBe('shared');
  expect(share).toHaveBeenCalledWith({ title: 'Payment receipt', text });
});
it('copies details when native sharing is unavailable and allows cancellation without copying', async () => {
  const copy = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('navigator', { clipboard: { writeText: copy } });
  expect(await shareReceipt('Receipt')).toBe('copied');
  expect(copy).toHaveBeenCalledWith('Receipt');
  copy.mockClear();
  vi.stubGlobal('navigator', {
    share: vi.fn().mockRejectedValue(new DOMException('Cancelled', 'AbortError')),
    clipboard: { writeText: copy },
  });
  expect(await shareReceipt('Receipt')).toBe('cancelled');
  expect(copy).not.toHaveBeenCalled();
});
it('provides manual copy when sharing and clipboard are blocked', async () => {
  vi.stubGlobal('navigator', {
    clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Blocked')) },
  });
  expect(await shareReceipt('Receipt')).toBe('manual');
});
