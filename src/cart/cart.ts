export interface Product {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  inventory: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
  unitPriceCents: number;
}

export interface Cart {
  items: CartItem[];
}

export function createEmptyCart(): Cart {
  return { items: [] };
}

export function addItemToCart(cart: Cart, product: Product, quantity: number): Cart {
  if (quantity <= 0) {
    throw new Error('Quantity must be greater than zero');
  }

  if (product.inventory < quantity) {
    throw new Error('Insufficient inventory for requested quantity');
  }

  const existing = cart.items.find((item) => item.productId === product.id);
  if (existing) {
    const nextQuantity = existing.quantity + quantity;
    if (product.inventory < nextQuantity) {
      throw new Error('Insufficient inventory for requested quantity');
    }

    return {
      items: cart.items.map((item) =>
        item.productId === product.id ? { ...item, quantity: nextQuantity } : item,
      ),
    };
  }

  return {
    items: [
      ...cart.items,
      {
        productId: product.id,
        quantity,
        unitPriceCents: product.priceCents,
      },
    ],
  };
}

export function removeItemFromCart(cart: Cart, productId: string): Cart {
  return {
    items: cart.items.filter((item) => item.productId !== productId),
  };
}

export function updateCartItemQuantity(cart: Cart, productId: string, quantity: number): Cart {
  if (quantity <= 0) {
    return removeItemFromCart(cart, productId);
  }

  const exists = cart.items.some((item) => item.productId === productId);
  if (!exists) {
    throw new Error(`Cart item not found for product ${productId}`);
  }

  return {
    items: cart.items.map((item) => (item.productId === productId ? { ...item, quantity } : item)),
  };
}

export function getCartSubtotalCents(cart: Cart): number {
  return cart.items.reduce((total, item) => total + item.quantity * item.unitPriceCents, 0);
}

export function getCartItemCount(cart: Cart): number {
  return cart.items.reduce((total, item) => total + item.quantity, 0);
}
