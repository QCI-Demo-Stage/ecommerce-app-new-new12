/**
 * Cart domain types shared by CartContext and consumers.
 */

export interface CartItem {
  /** Product id from the catalog API */
  productId: string;
  name: string;
  sku: string;
  priceCents: number;
  currency: string;
  imageUrl: string;
  quantity: number;
}

export interface CartTotals {
  /** Sum of all line quantities */
  itemCount: number;
  /** Sum of (priceCents * quantity) across lines */
  subtotalCents: number;
  /** Currency code shared by cart lines (USD when empty) */
  currency: string;
}

export interface CartState {
  items: CartItem[];
  totals: CartTotals;
}

/** Payload used when adding a product to the cart (quantity defaults to 1). */
export type AddToCartInput = Omit<CartItem, 'quantity'> & {
  quantity?: number;
};

export interface CartActions {
  addItem: (item: AddToCartInput) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

export const CART_STORAGE_KEY = 'ecom_cart_v1';
export const MAX_LINE_QUANTITY = 99;
