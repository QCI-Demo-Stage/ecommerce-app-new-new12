import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  buildCartState,
  clampQuantity,
  createEmptyCart,
  readCartFromStorage,
  writeCartToStorage,
} from './cartUtils';
import type {
  AddToCartInput,
  CartActions,
  CartItem,
  CartState,
} from './types';

const CartStateContext = createContext<CartState | null>(null);
const CartActionsContext = createContext<CartActions | null>(null);

export interface CartProviderProps {
  children: ReactNode;
  /** Optional seed for tests — skips localStorage hydration when provided. */
  initialState?: CartState;
  /** Disable persistence (useful in unit tests). */
  persist?: boolean;
}

/**
 * Provides cart items, totals, and mutation actions to the SPA tree.
 * State is hydrated from and synced to localStorage by default.
 */
export function CartProvider({
  children,
  initialState,
  persist = true,
}: CartProviderProps) {
  const [state, setState] = useState<CartState>(() => {
    if (initialState) {
      return buildCartState(initialState.items);
    }
    return persist ? readCartFromStorage() : createEmptyCart();
  });

  useEffect(() => {
    if (!persist) {
      return;
    }
    writeCartToStorage(state);
  }, [state, persist]);

  const addItem = useCallback((input: AddToCartInput) => {
    const productId = input.productId?.trim();
    if (!productId) {
      return;
    }
    const quantity = clampQuantity(input.quantity ?? 1);
    setState((prev) => {
      const existing = prev.items.find((item) => item.productId === productId);
      let items: CartItem[];
      if (existing) {
        items = prev.items.map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity: clampQuantity(item.quantity + quantity),
                // Refresh snapshot fields from latest add
                name: input.name,
                sku: input.sku,
                priceCents: Math.max(0, Math.floor(input.priceCents)),
                currency: input.currency || 'USD',
                imageUrl: input.imageUrl,
              }
            : item,
        );
      } else {
        items = [
          ...prev.items,
          {
            productId,
            name: input.name,
            sku: input.sku,
            priceCents: Math.max(0, Math.floor(input.priceCents)),
            currency: input.currency || 'USD',
            imageUrl: input.imageUrl,
            quantity,
          },
        ];
      }
      return buildCartState(items);
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    const id = productId?.trim();
    if (!id) {
      return;
    }
    setState((prev) =>
      buildCartState(prev.items.filter((item) => item.productId !== id)),
    );
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    const id = productId?.trim();
    if (!id) {
      return;
    }
    if (!Number.isFinite(quantity) || quantity < 1) {
      setState((prev) =>
        buildCartState(prev.items.filter((item) => item.productId !== id)),
      );
      return;
    }
    const nextQty = clampQuantity(quantity);
    setState((prev) =>
      buildCartState(
        prev.items.map((item) =>
          item.productId === id ? { ...item, quantity: nextQty } : item,
        ),
      ),
    );
  }, []);

  const clearCart = useCallback(() => {
    setState(createEmptyCart());
  }, []);

  const actions = useMemo<CartActions>(
    () => ({ addItem, removeItem, updateQuantity, clearCart }),
    [addItem, removeItem, updateQuantity, clearCart],
  );

  return (
    <CartStateContext.Provider value={state}>
      <CartActionsContext.Provider value={actions}>
        {children}
      </CartActionsContext.Provider>
    </CartStateContext.Provider>
  );
}

/**
 * Read-only cart state (items + totals).
 * Prefer this in presentational components to avoid action identity churn.
 */
export function useCart(): CartState {
  const ctx = useContext(CartStateContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}

/** Cart mutation helpers (add / remove / update / clear). */
export function useCartActions(): CartActions {
  const ctx = useContext(CartActionsContext);
  if (!ctx) {
    throw new Error('useCartActions must be used within a CartProvider');
  }
  return ctx;
}
