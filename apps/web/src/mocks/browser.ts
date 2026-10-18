import type { DeliveryInput, ItemInput, LinkInput, Preferences, Profile } from '@safer/contracts';
import { delay, http, HttpResponse } from 'msw';
import { setupWorker } from 'msw/browser';
import { DomainError, repo } from './repository';
const action = (fn: () => unknown) => {
  try {
    return HttpResponse.json(fn() as Record<string, unknown>);
  } catch (e) {
    return HttpResponse.json(
      {
        code: e instanceof DomainError ? e.code : 'VALIDATION',
        message: e instanceof Error ? e.message : 'Something went wrong.',
      },
      { status: e instanceof DomainError && e.code === 'NOT_FOUND' ? 404 : 422 },
    );
  }
};
export const worker = setupWorker(
  http.get('/api/workspace', async () => {
    await delay(180);
    return HttpResponse.json(repo.read());
  }),
  http.get('/api/payment-links/:id', async ({ params }) =>
    action(() => repo.link(String(params.id))),
  ),
  http.post('/api/payment-links', async ({ request }) => {
    const body = (await request.json()) as LinkInput;
    return action(() =>
      repo.createLink(body, request.headers.get('Idempotency-Key') || crypto.randomUUID()),
    );
  }),
  http.post('/api/payment-links/:id/simulate', async ({ params, request }) => {
    const body = (await request.json()) as { status: 'paid' | 'failed'; method: string };
    return action(() => repo.settle(String(params.id), body.status, body.method));
  }),
  http.post('/api/catalogue', async ({ request }) => {
    const b = (await request.json()) as ItemInput;
    return action(() =>
      repo.addItem(b, request.headers.get('Idempotency-Key') || crypto.randomUUID()),
    );
  }),
  http.post('/api/catalogue/:id/movements', async ({ params, request }) => {
    const b = (await request.json()) as { quantity: number; kind: 'sale' | 'restock' };
    return action(() => {
      repo.stock(
        String(params.id),
        b.quantity,
        b.kind,
        request.headers.get('Idempotency-Key') || crypto.randomUUID(),
      );
      return { ok: true };
    });
  }),
  http.post('/api/deliveries', async ({ request }) => {
    const b = (await request.json()) as DeliveryInput;
    return action(() =>
      repo.delivery(b, request.headers.get('Idempotency-Key') || crypto.randomUUID()),
    );
  }),
  http.post('/api/deliveries/:id/advance', async ({ params }) =>
    action(() => repo.advanceDelivery(String(params.id))),
  ),
  http.put('/api/profile', async ({ request }) => {
    const b = (await request.json()) as Profile;
    return action(() => repo.profile(b));
  }),
  http.put('/api/preferences', async ({ request }) => {
    const b = (await request.json()) as Preferences;
    return action(() => repo.preferences(b));
  }),
);
