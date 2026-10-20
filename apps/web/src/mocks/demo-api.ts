import type { DeliveryInput, ItemInput, LinkInput, Preferences, Profile } from '@safer/contracts';
import { repo } from './repository';

/** Browser-local demo transport. Never sends a financial action to a live API. */
export function demoApi(path: string, body: unknown, method: string, idempotency: string): unknown {
  if (method === 'GET' && path === '/workspace') return repo.read();
  if (method === 'POST' && path === '/payment-links')
    return repo.createLink(body as LinkInput, idempotency);
  if (method === 'POST' && path === '/catalogue')
    return repo.addItem(body as ItemInput, idempotency);
  if (method === 'POST' && path === '/deliveries')
    return repo.delivery(body as DeliveryInput, idempotency);
  if (method === 'PUT' && path === '/profile') return repo.profile(body as Profile);
  if (method === 'PUT' && path === '/preferences') return repo.preferences(body as Preferences);
  const link = path.match(/^\/payment-links\/([^/]+)$/);
  if (method === 'GET' && link) return repo.link(decodeURIComponent(link[1]));
  const settle = path.match(/^\/payment-links\/([^/]+)\/simulate$/);
  if (method === 'POST' && settle) {
    const input = body as { status: 'paid' | 'failed'; method: string };
    return repo.settle(decodeURIComponent(settle[1]), input.status, input.method);
  }
  const stock = path.match(/^\/catalogue\/([^/]+)\/movements$/);
  if (method === 'POST' && stock) {
    const input = body as { quantity: number; kind: 'sale' | 'restock' };
    repo.stock(decodeURIComponent(stock[1]), input.quantity, input.kind, idempotency);
    return { ok: true };
  }
  const advance = path.match(/^\/deliveries\/([^/]+)\/advance$/);
  if (method === 'POST' && advance) return repo.advanceDelivery(decodeURIComponent(advance[1]));
  throw new Error(`Demo action is not supported: ${method} ${path}`);
}
