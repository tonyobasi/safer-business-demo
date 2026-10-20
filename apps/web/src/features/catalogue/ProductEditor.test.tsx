import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../components/ui';
import { repo } from '../../mocks/repository';
import ProductEditor from './ProductEditor';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
beforeEach(() => repo.reset());
function setup() {
  const onDone = vi.fn();
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}
    >
      <ToastProvider>
        <ProductEditor businessType="Fashion & accessories" onDone={onDone} />
      </ToastProvider>
    </QueryClientProvider>,
  );
  return { user: userEvent.setup(), onDone };
}
it('resets dependent category choices when the business type changes', async () => {
  const { user } = setup();
  await user.selectOptions(screen.getByLabelText('Business type'), 'Food & hospitality');
  expect(screen.getByLabelText('Category')).toHaveValue('Meals');
  expect(screen.getByLabelText('Subcategory')).toHaveValue('Local dishes');
  await user.selectOptions(screen.getByLabelText('Category'), 'Drinks');
  expect(screen.getByLabelText('Subcategory')).toHaveValue('Juices');
  expect(screen.queryByRole('option', { name: 'Two-piece sets' })).not.toBeInTheDocument();
});
it('uploads an image, publishes a product and makes it available to the visitor view', async () => {
  const { user, onDone } = setup();
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn().mockResolvedValue({ width: 800, height: 600, close: vi.fn() }),
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    fillRect: vi.fn(),
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
    'data:image/jpeg;base64,dGVzdA==',
  );
  const upload = screen.getByLabelText(/Add images/);
  await user.upload(upload, new File(['image'], 'linen.jpg', { type: 'image/jpeg' }));
  await screen.findByAltText('Product image 1');
  await user.type(screen.getByLabelText('Product title'), 'Summer linen set');
  await user.type(
    screen.getByLabelText(/Description/),
    'Lightweight linen with a relaxed everyday fit.',
  );
  await user.type(screen.getByLabelText('Price'), '25000');
  await user.type(screen.getByLabelText('SKU'), 'SUMMER-001');
  await user.selectOptions(screen.getByLabelText('Publication status'), 'published');
  await user.click(screen.getByRole('button', { name: 'Save & publish' }));
  await waitFor(() => expect(onDone).toHaveBeenCalledOnce());
  expect(repo.storefront().products.some((p) => p.name === 'Summer linen set')).toBe(true);
  vi.restoreAllMocks();
});
