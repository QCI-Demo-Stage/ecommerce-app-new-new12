import type { CartItem, CartState, CartTotals } from './types';
import { CART_STORAGE_KEY, MAX_LINE_QUANTITY } from './types';

/** Recalculate derived totals from line items. */
export function computeTotals(items: CartItem[]): CartTotals {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalCents = items.reduce(
    (sum, item) => sum + item.priceCents * item.quantity,
    0,
  );
  const currency = items[0]?.currency ?? 'USD';
  return { itemCount, subtotalCents, currency };
}

/** Clamp quantity to a positive integer within allowed bounds. */
export function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) {
    return 1;
  }
  return Math.min(MAX_LINE_QUANTITY, Math.max(1, Math.floor(quantity)));
}

export function createEmptyCart(): CartState {
  return {
    items: [],
    totals: { itemCount: 0, subtotalCents: 0, currency: 'USD' },
  };
}

/** Build a CartState from a validated items array. */
export function buildCartState(items: CartItem[]): CartState {
  return { items, totals: computeTotals(items) };
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const item = value as Record<string, unknown>;
  return (
    typeof item.productId === 'string' &&
    item.productId.trim().length > 0 &&
    typeof item.name === 'string' &&
    typeof item.sku === 'string' &&
    typeof item.priceCents === 'number' &&
    Number.isFinite(item.priceCents) &&
    item.priceCents >= 0 &&
    typeof item.currency === 'string' &&
    typeof item.imageUrl === 'string' &&
    typeof item.quantity === 'number' &&
    Number.isFinite(item.quantity)
  );
}

/**
 * Parse persisted cart JSON. Returns empty cart on invalid / missing data.
 */
export function parseStoredCart(raw: string | null): CartState {
  if (!raw) {
    return createEmptyCart();
  }
  try {
    const parsed = JSON.parse(raw) as { items?: unknown };
    if (!Array.isArray(parsed.items)) {
      return createEmptyCart();
    }
    const items: CartItem[] = [];
    for (const entry of parsed.items) {
      if (!isCartItem(entry)) {
        continue;
      }
      items.push({
        productId: entry.productId.trim(),
        name: entry.name,
        sku: entry.sku,
        priceCents: Math.max(0, Math.floor(entry.priceCents)),
        currency: entry.currency || 'USD',
        imageUrl: entry.imageUrl,
        quantity: clampQuantity(entry.quantity),
      });
    }
    // Merge duplicate product lines that may exist in corrupt storage
    const merged = new Map<string, CartItem>();
    for (const item of items) {
      const existing = merged.get(item.productId);
      if (existing) {
        existing.quantity = clampQuantity(existing.quantity + item.quantity);
      } else {
        merged.set(item.productId, { ...item });
      }
    }
    return buildCartState(Array.from(merged.values()));
  } catch {
    return createEmptyCart();
  }
}

export function readCartFromStorage(
  storage: Storage | null = getLocalStorage(),
): CartState {
  if (!storage) {
    return createEmptyCart();
  }
  try {
    return parseStoredCart(storage.getItem(CART_STORAGE_KEY));
  } catch {
    return createEmptyCart();
  }
}

export function writeCartToStorage(
  state: CartState,
  storage: Storage | null = getLocalStorage(),
): void {
  if (!storage) {
    return;
  }
  try {
    storage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ items: state.items, version: 1 }),
    );
  } catch {
    // QuotaExceeded or private mode — cart still works in-memory
  }
}

export function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
