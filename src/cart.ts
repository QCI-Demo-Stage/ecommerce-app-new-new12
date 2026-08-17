export interface Product {
  id: string;
  name: string;
  priceCents: number;
  stock: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
  unitPriceCents: number;
}

export interface Cart {
  items: CartItem[];
}

export function createCart(): Cart {
  return { items: [] };
}

export function addItem(cart: Cart, product: Product, quantity: number): Cart {
  if (quantity <= 0) {
    throw new Error('Quantity must be greater than zero');
  }
  if (quantity > product.stock) {
    throw new Error('Insufficient stock');
  }

  const existing = cart.items.find((item) => item.productId === product.id);
  if (existing) {
    const nextQuantity = existing.quantity + quantity;
    if (nextQuantity > product.stock) {
      throw new Error('Insufficient stock');
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

export function removeItem(cart: Cart, productId: string): Cart {
  return {
    items: cart.items.filter((item) => item.productId !== productId),
  };
}

export function cartTotalCents(cart: Cart): number {
  return cart.items.reduce((total, item) => total + item.unitPriceCents * item.quantity, 0);
}

export function cartItemCount(cart: Cart): number {
  return cart.items.reduce((count, item) => count + item.quantity, 0);
}
