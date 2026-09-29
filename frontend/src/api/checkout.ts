import { authApiFetch } from './authClient';

export interface CheckoutLineItem {
  productId: string;
  name: string;
  sku: string;
  priceCents: number;
  quantity: number;
}

export interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PaymentPayload {
  method: 'card' | 'paypal';
  /** Opaque payment token — never send raw card PANs */
  paymentToken: string;
  cardLast4?: string;
  nameOnCard?: string;
}

export interface CreateOrderRequest {
  items: CheckoutLineItem[];
  shipping: ShippingAddress;
  payment: PaymentPayload;
  currency?: string;
}

export interface CreatedOrder {
  id: string;
  status: string;
  totalCents: number;
  currency: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  items: CheckoutLineItem[];
  shipping: ShippingAddress;
  payment: {
    method: 'card' | 'paypal';
    cardLast4?: string;
  };
}

export interface CreateOrderResponse {
  message: string;
  order: CreatedOrder;
  meta: { processingMs: number };
}

/**
 * POST /api/orders — place an order from checkout (authenticated).
 */
export async function createOrder(
  body: CreateOrderRequest,
): Promise<CreateOrderResponse> {
  if (!body.items.length) {
    throw new Error('Cart is empty');
  }
  return authApiFetch<CreateOrderResponse>('/api/orders', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({
      items: body.items,
      shipping: body.shipping,
      payment: body.payment,
      currency: body.currency ?? 'USD',
    }),
  });
}

/**
 * Client-side mock tokenization — never transmits the full PAN.
 * In production this would call the payment provider SDK.
 */
export function tokenizeCardNumber(cardNumber: string): {
  paymentToken: string;
  cardLast4: string;
} {
  const digits = cardNumber.replace(/\D/g, '');
  const last4 = digits.slice(-4);
  // Deterministic opaque token from last4 + length (demo only)
  const paymentToken = `tok_${last4}_${digits.length}_${Date.now().toString(36)}`;
  return { paymentToken, cardLast4: last4 };
}
