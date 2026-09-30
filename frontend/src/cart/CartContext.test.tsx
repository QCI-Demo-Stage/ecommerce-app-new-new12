import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  CartProvider,
  useCart,
  useCartActions,
  CART_STORAGE_KEY,
  createEmptyCart,
  parseStoredCart,
  computeTotals,
  clampQuantity,
} from './index';
import type { AddToCartInput } from './types';

const sampleItem: AddToCartInput = {
  productId: 'prod-1',
  name: 'Classic Widget',
  sku: 'WDG-001',
  priceCents: 2499,
  currency: 'USD',
  imageUrl: '/images/products/classic-widget.svg',
};

function createWrapper(persist = true) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <CartProvider persist={persist} initialState={createEmptyCart()}>
        {children}
      </CartProvider>
    );
  };
}

describe('cartUtils', () => {
  it('computes totals from line items', () => {
    const totals = computeTotals([
      { ...sampleItem, quantity: 2 },
      {
        productId: 'prod-2',
        name: 'Gadget',
        sku: 'GAD-1',
        priceCents: 1000,
        currency: 'USD',
        imageUrl: '/g.svg',
        quantity: 3,
      },
    ]);
    expect(totals.itemCount).toBe(5);
    expect(totals.subtotalCents).toBe(2 * 2499 + 3 * 1000);
    expect(totals.currency).toBe('USD');
  });

  it('clamps quantity into 1..99', () => {
    expect(clampQuantity(0)).toBe(1);
    expect(clampQuantity(-5)).toBe(1);
    expect(clampQuantity(150)).toBe(99);
    expect(clampQuantity(4.7)).toBe(4);
    expect(clampQuantity(Number.NaN)).toBe(1);
  });

  it('parses valid stored cart JSON and rejects corrupt payloads', () => {
    const valid = parseStoredCart(
      JSON.stringify({
        items: [{ ...sampleItem, quantity: 2 }],
      }),
    );
    expect(valid.items).toHaveLength(1);
    expect(valid.totals.itemCount).toBe(2);

    expect(parseStoredCart(null).items).toHaveLength(0);
    expect(parseStoredCart('{not-json').items).toHaveLength(0);
    expect(parseStoredCart(JSON.stringify({ items: 'nope' })).items).toHaveLength(
      0,
    );
  });
});

describe('CartContext actions', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('adds, updates, and removes items', () => {
    const { result } = renderHook(
      () => ({ cart: useCart(), actions: useCartActions() }),
      { wrapper: createWrapper(false) },
    );

    act(() => {
      result.current.actions.addItem(sampleItem);
    });
    expect(result.current.cart.items).toHaveLength(1);
    expect(result.current.cart.totals.itemCount).toBe(1);
    expect(result.current.cart.totals.subtotalCents).toBe(2499);

    act(() => {
      result.current.actions.addItem({ ...sampleItem, quantity: 2 });
    });
    expect(result.current.cart.items[0].quantity).toBe(3);
    expect(result.current.cart.totals.subtotalCents).toBe(3 * 2499);

    act(() => {
      result.current.actions.updateQuantity('prod-1', 5);
    });
    expect(result.current.cart.items[0].quantity).toBe(5);

    act(() => {
      result.current.actions.removeItem('prod-1');
    });
    expect(result.current.cart.items).toHaveLength(0);
    expect(result.current.cart.totals.itemCount).toBe(0);
  });

  it('clears the cart and removes lines when quantity drops below 1', () => {
    const { result } = renderHook(
      () => ({ cart: useCart(), actions: useCartActions() }),
      { wrapper: createWrapper(false) },
    );

    act(() => {
      result.current.actions.addItem(sampleItem);
      result.current.actions.addItem({
        ...sampleItem,
        productId: 'prod-2',
        name: 'Other',
        sku: 'OTH-1',
      });
    });
    expect(result.current.cart.items).toHaveLength(2);

    act(() => {
      result.current.actions.updateQuantity('prod-2', 0);
    });
    expect(result.current.cart.items).toHaveLength(1);

    act(() => {
      result.current.actions.clearCart();
    });
    expect(result.current.cart.items).toHaveLength(0);
  });

  it('persists state to localStorage on change', () => {
    const { result } = renderHook(
      () => ({ cart: useCart(), actions: useCartActions() }),
      {
        wrapper: function PersistWrapper({ children }: { children: ReactNode }) {
          return <CartProvider persist>{children}</CartProvider>;
        },
      },
    );

    act(() => {
      result.current.actions.addItem({ ...sampleItem, quantity: 2 });
    });

    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string) as {
      items: Array<{ productId: string; quantity: number }>;
    };
    expect(parsed.items[0].productId).toBe('prod-1');
    expect(parsed.items[0].quantity).toBe(2);
  });

  it('hydrates from localStorage on mount', () => {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ items: [{ ...sampleItem, quantity: 4 }] }),
    );

    const { result } = renderHook(() => useCart(), {
      wrapper: function HydrateWrapper({ children }: { children: ReactNode }) {
        return <CartProvider persist>{children}</CartProvider>;
      },
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(4);
    expect(result.current.totals.subtotalCents).toBe(4 * 2499);
  });

  it('throws when hooks are used outside the provider', () => {
    expect(() => renderHook(() => useCart())).toThrow(/CartProvider/);
    expect(() => renderHook(() => useCartActions())).toThrow(/CartProvider/);
  });
});
