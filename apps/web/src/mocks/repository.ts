import {
  productSchema,
  type ProductInput,
  deliverySchema,
  allowsStablecoin,
  itemSchema,
  linkSchema,
  type DeliveryInput,
  type EventEnvelope,
  type ItemInput,
  type LinkInput,
  type PaymentLink,
  type Profile,
  type Workspace,
} from '@safer/contracts';
import { toMinor } from '../lib/money';
import { categoriesFor } from '../features/catalogue/categories';
import { seed } from './seed';
const key = 'safer-demo-workspace-v1';
const processed = new Map<string, unknown>();
export class DomainError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
let memory: Workspace;
function load(): Workspace {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return seed();
    const workspace = JSON.parse(saved) as Workspace;
    workspace.balances = { ...seed().balances, ...workspace.balances };
    return workspace;
  } catch {
    return seed();
  }
}
function data() {
  memory ??= load();
  return memory;
}
export const events = new EventTarget();
function save(type: EventEnvelope['type'], entityId: string) {
  localStorage.setItem(key, JSON.stringify(data()));
  const event: EventEnvelope = {
    eventId: crypto.randomUUID(),
    type,
    entityId,
    version: Date.now(),
    occurredAt: new Date().toISOString(),
    payload: {},
  };
  events.dispatchEvent(new CustomEvent('domain', { detail: event }));
}
export const repo = {
  read: () => structuredClone(data()),
  link: (id: string) => {
    const l = data().links.find((x) => x.id === id);
    if (!l) throw new DomainError('NOT_FOUND', 'This payment link could not be found.');
    return structuredClone(l);
  },
  createLink: (input: LinkInput, idempotency: string) => {
    if (processed.has(idempotency)) return processed.get(idempotency) as PaymentLink;
    const v = linkSchema.parse(input);
    const l: PaymentLink = {
      id: crypto.randomUUID(),
      title: v.title,
      amountMinor: toMinor(v.amount),
      currency: v.currency,
      customer: v.customer,
      email: v.email,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + Number(v.expires) * 86400000).toISOString(),
      status: 'pending',
      allowStablecoin: v.currency === 'USDC' || (v.allowStablecoin ?? false),
    };
    data().links.unshift(l);
    processed.set(idempotency, l);
    save('link.created', l.id);
    return l;
  },
  settle: (id: string, status: 'paid' | 'failed', method: string) => {
    const l = data().links.find((x) => x.id === id);
    if (!l) throw new DomainError('NOT_FOUND', 'Payment link not found.');
    if (l.status === 'paid') return l;
    if (method === 'USDC' && !allowsStablecoin(l))
      throw new DomainError('PAYMENT_METHOD', 'Stablecoin payments are not enabled for this link.');
    if (new Date(l.expiresAt).getTime() < Date.now())
      throw new DomainError('EXPIRED', 'This payment link has expired.');
    l.status = status;
    let p = data().payments.find((x) => x.linkId === id);
    if (!p) {
      p = {
        id: `SB-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        linkId: id,
        customer: l.customer || 'Guest customer',
        description: l.title,
        currency: l.currency,
        amountMinor: l.amountMinor,
        status,
        method,
        createdAt: new Date().toISOString(),
      };
      data().payments.unshift(p);
    } else {
      p.status = status;
      p.method = method;
    }
    if (status === 'paid') {
      const b = data().balances[l.currency];
      b.available = (BigInt(b.available) + BigInt(l.amountMinor)).toString();
    }
    save('payment.updated', id);
    return l;
  },
  addItem: (input: ItemInput, idempotency: string) => {
    if (processed.has(idempotency)) return processed.get(idempotency);
    const v = itemSchema.parse(input);
    if (data().items.some((i) => i.sku.toLowerCase() === v.sku.toLowerCase()))
      throw new DomainError('DUPLICATE_SKU', 'An item with this SKU already exists.');
    const item = {
      id: crypto.randomUUID(),
      name: v.name,
      sku: v.sku,
      category: v.category,
      sold: 0,
      remaining: v.quantity,
      amountMinor: toMinor(v.amount),
      currency: v.currency,
      image: '',
    };
    data().items.unshift(item);
    processed.set(idempotency, item);
    save('inventory.updated', item.id);
    return item;
  },
  saveProduct: (input: ProductInput, id?: string) => {
    const v = productSchema.parse(input);
    const taxonomy = categoriesFor(v.businessType);
    if (!taxonomy[v.category]?.includes(v.subcategory))
      throw new DomainError(
        'CATEGORY',
        'Choose a category and subcategory for this business type.',
      );
    if (data().items.some((i) => i.id !== id && i.sku.toLowerCase() === v.sku.toLowerCase()))
      throw new DomainError('DUPLICATE_SKU', 'An item with this SKU already exists.');
    const existing = id ? data().items.find((i) => i.id === id) : undefined;
    if (id && !existing) throw new DomainError('NOT_FOUND', 'Product not found.');
    const product = {
      ...existing,
      id: existing?.id ?? crypto.randomUUID(),
      name: v.name,
      sku: v.sku,
      category: v.category,
      subcategory: v.subcategory,
      businessType: v.businessType,
      description: v.description,
      images: v.images,
      image: v.images[0] ?? '',
      visibility: v.visibility,
      amountMinor: toMinor(v.amount),
      currency: v.currency,
      sold: existing?.sold ?? 0,
      remaining: existing?.remaining ?? v.quantity,
    };
    const previous = [...data().items];
    data().items = existing
      ? data().items.map((i) => (i.id === id ? product : i))
      : [product, ...data().items];
    try {
      save('inventory.updated', product.id);
    } catch {
      data().items = previous;
      throw new DomainError(
        'STORAGE',
        'Device storage is full. Remove an image or use smaller images and try again.',
      );
    }
    return structuredClone(product);
  },
  storefront: () => ({
    business: data().profile.business,
    category: data().profile.category,
    products: data()
      .items.filter((i) => i.visibility === 'published')
      .map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description ?? '',
        category: i.category,
        subcategory: i.subcategory ?? '',
        amountMinor: i.amountMinor,
        currency: i.currency,
        images: i.images ?? (i.image ? [i.image] : []),
        available: i.remaining > 0,
      })),
  }),
  stock: (id: string, quantity: number, kind: 'sale' | 'restock', idempotency: string) => {
    if (processed.has(idempotency)) return;
    const item = data().items.find((x) => x.id === id);
    if (!item) throw new DomainError('NOT_FOUND', 'Item not found.');
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000)
      throw new DomainError('INVALID_QUANTITY', 'Enter a whole quantity between 1 and 100,000.');
    if (kind === 'sale' && quantity > item.remaining)
      throw new DomainError('INSUFFICIENT_STOCK', 'That quantity exceeds remaining stock.');
    if (kind === 'sale') {
      item.sold += quantity;
      item.remaining -= quantity;
    } else item.remaining += quantity;
    processed.set(idempotency, true);
    save('inventory.updated', id);
  },
  delivery: (input: DeliveryInput, idempotency: string) => {
    if (processed.has(idempotency)) return processed.get(idempotency);
    const v = deliverySchema.parse(input);
    const d = {
      ...v,
      id: `DL-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
      status: 'Requested' as const,
      feeMinor: '250000',
      createdAt: new Date().toISOString(),
    };
    data().deliveries.unshift(d);
    processed.set(idempotency, d);
    save('delivery.updated', d.id);
    return d;
  },
  advanceDelivery: (id: string) => {
    const d = data().deliveries.find((x) => x.id === id);
    if (!d) throw new DomainError('NOT_FOUND', 'Delivery not found.');
    const stages = ['Requested', 'Rider assigned', 'Picked up', 'Delivered'] as const;
    d.status = stages[Math.min(stages.indexOf(d.status) + 1, 3)];
    save('delivery.updated', id);
    return d;
  },
  profile: (p: Profile) => {
    data().profile = p;
    save('profile.updated', 'merchant');
    return p;
  },
  preferences: (p: Workspace['preferences']) => {
    data().preferences = p;
    save('profile.updated', 'preferences');
    return p;
  },
  reset: () => {
    memory = seed();
    processed.clear();
    save('profile.updated', 'reset');
  },
  reload: () => {
    memory = load();
    events.dispatchEvent(new Event('domain'));
  },
};
if (typeof window !== 'undefined')
  window.addEventListener('storage', (e) => {
    if (e.key === key) repo.reload();
  });
