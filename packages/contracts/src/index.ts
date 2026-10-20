import { z } from 'zod';
export type Currency = 'USD' | 'NGN' | 'EUR' | 'USDC';
export interface Money {
  asset: Currency | 'USDC';
  amountMinor: string;
  scale: number;
}
export const amountPattern = /^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/;
export const linkSchema = z.object({
  title: z.string().trim().min(3, 'Describe what this payment is for.').max(100),
  amount: z
    .string()
    .refine(
      (v) => amountPattern.test(v) && Number(v) > 0,
      'Enter a positive amount with up to 2 decimals.',
    ),
  currency: z.enum(['USD', 'NGN', 'EUR', 'USDC']),
  customer: z.string().trim().max(100),
  email: z.union([z.literal(''), z.email('Enter a valid email.')]),
  expires: z.enum(['7', '30', '90']),
  allowStablecoin: z.boolean().optional(),
});
export type LinkInput = z.infer<typeof linkSchema>;
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired';
export interface PaymentLink {
  id: string;
  title: string;
  amountMinor: string;
  currency: Currency;
  customer: string;
  email: string;
  createdAt: string;
  expiresAt: string;
  status: PaymentStatus;
  allowStablecoin?: boolean;
}
// Existing USD links offered USDC before this preference was introduced.
export const allowsStablecoin = (link: PaymentLink) =>
  link.currency === 'USDC' || (link.allowStablecoin ?? link.currency === 'USD');
export interface Payment {
  id: string;
  linkId?: string;
  customer: string;
  description: string;
  currency: Currency;
  amountMinor: string;
  status: PaymentStatus;
  createdAt: string;
  method: string;
}
export interface Item {
  id: string;
  name: string;
  category: string;
  sku: string;
  sold: number;
  remaining: number;
  amountMinor: string;
  currency: Currency;
  image: string;
  images?: string[];
  description?: string;
  subcategory?: string;
  businessType?: string;
  visibility?: 'draft' | 'published';
}
export interface Delivery {
  id: string;
  customer: string;
  phone: string;
  pickup: string;
  destination: string;
  item: string;
  status: 'Requested' | 'Rider assigned' | 'Picked up' | 'Delivered';
  feeMinor: string;
  createdAt: string;
}
export interface Profile {
  name: string;
  business: string;
  email: string;
  phone: string;
  category: string;
  address: string;
}
export interface Preferences {
  email: boolean;
  payments: boolean;
  deliveries: boolean;
  stock: boolean;
}
export interface Workspace {
  profile: Profile;
  preferences: Preferences;
  links: PaymentLink[];
  payments: Payment[];
  items: Item[];
  deliveries: Delivery[];
  balances: Record<Currency, { available: string; pending: string }>;
}
export const deliverySchema = z.object({
  customer: z.string().trim().min(2, 'Enter a recipient name.'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{8,18}$/, 'Enter a valid phone number.'),
  pickup: z.string().trim().min(8, 'Enter a complete pickup address.'),
  destination: z.string().trim().min(8, 'Enter a complete delivery address.'),
  item: z.string().trim().min(3, 'Describe the package.'),
});
export type DeliveryInput = z.infer<typeof deliverySchema>;
export interface EventEnvelope<T = unknown> {
  eventId: string;
  type:
    | 'payment.updated'
    | 'inventory.updated'
    | 'delivery.updated'
    | 'profile.updated'
    | 'link.created';
  entityId: string;
  version: number;
  occurredAt: string;
  payload: T;
}
export interface ApiError {
  code: string;
  message: string;
}
export type AgentCard = 'link' | 'stock' | 'payments' | 'delivery' | 'withdrawal';
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  card?: AgentCard;
  currency?: Currency;
  amount?: string;
  completed?: string;
}
export const itemSchema = z.object({
  name: z.string().trim().min(3, 'Enter an item name.').max(100),
  sku: z.string().trim().min(3, 'Enter a unique SKU.').max(32),
  category: z.string().trim().min(1).max(80),
  quantity: z.coerce.number().int().min(0).max(100000),
  amount: z.string().refine((v) => amountPattern.test(v), 'Enter a valid price.'),
  currency: z.enum(['NGN', 'USD']),
});
export type ItemInput = z.infer<typeof itemSchema>;

export const productSchema = itemSchema
  .extend({
    description: z.string().trim().max(2000),
    subcategory: z.string().trim().min(1, 'Choose a subcategory.').max(80),
    businessType: z.string().trim().min(1).max(80),
    images: z
      .array(
        z
          .string()
          .max(600000)
          .regex(
            /^(?:data:image\/(?:jpeg|png|webp);base64,|\/images\/[a-zA-Z0-9_/-]+\.(?:jpg|jpeg|png|webp)$)/,
            'Upload a supported image.',
          ),
      )
      .max(4),
    visibility: z.enum(['draft', 'published']),
    currency: z.enum(['NGN', 'USD', 'EUR', 'USDC']),
  })
  .superRefine((v, ctx) => {
    if (
      v.visibility === 'published' &&
      (!v.images.length || v.description.length < 10 || Number(v.amount) <= 0)
    )
      ctx.addIssue({
        code: 'custom',
        message:
          'Published products need an image, a description of at least 10 characters, and a positive price.',
      });
  });
export type ProductInput = z.infer<typeof productSchema>;
