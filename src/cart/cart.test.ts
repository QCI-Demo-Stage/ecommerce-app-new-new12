import {
  addItemToCart,
  createEmptyCart,
  getCartItemCount,
  getCartSubtotalCents,
  removeItemFromCart,
  updateCartItemQuantity,
} from './cart';
import type { Product } from './cart';

const sampleProduct: Product = {
  id: 'sku-100',
  name: 'Wireless Headphones',
  description: 'Noise-cancelling over-ear headphones',
  priceCents: 12999,
  inventory: 10,
};

describe('cart', () => {
  it('creates an empty cart', () => {
    expect(createEmptyCart()).toEqual({ items: [] });
  });

  it('adds a new item to the cart', () => {
    const cart = addItemToCart(createEmptyCart(), sampleProduct, 2);

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toEqual({
      productId: 'sku-100',
      quantity: 2,
      unitPriceCents: 12999,
    });
  });

  it('increments quantity when the same product is added again', () => {
    const cart = addItemToCart(
      addItemToCart(createEmptyCart(), sampleProduct, 1),
      sampleProduct,
      2,
    );

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]?.quantity).toBe(3);
  });

  it('rejects non-positive quantities', () => {
    expect(() => addItemToCart(createEmptyCart(), sampleProduct, 0)).toThrow(
      'Quantity must be greater than zero',
    );
  });

  it('rejects quantities that exceed inventory', () => {
    expect(() => addItemToCart(createEmptyCart(), sampleProduct, 11)).toThrow(
      'Insufficient inventory for requested quantity',
    );
  });

  it('rejects increments that exceed inventory', () => {
    const cart = addItemToCart(createEmptyCart(), sampleProduct, 8);

    expect(() => addItemToCart(cart, sampleProduct, 3)).toThrow(
      'Insufficient inventory for requested quantity',
    );
  });

  it('removes an item from the cart', () => {
    const cart = removeItemFromCart(
      addItemToCart(createEmptyCart(), sampleProduct, 1),
      sampleProduct.id,
    );

    expect(cart.items).toHaveLength(0);
  });

  it('updates item quantity and removes when quantity is zero', () => {
    const withItem = addItemToCart(createEmptyCart(), sampleProduct, 2);
    const updated = updateCartItemQuantity(withItem, sampleProduct.id, 5);
    const cleared = updateCartItemQuantity(updated, sampleProduct.id, 0);

    expect(updated.items[0]?.quantity).toBe(5);
    expect(cleared.items).toHaveLength(0);
  });

  it('throws when updating a missing cart item', () => {
    expect(() => updateCartItemQuantity(createEmptyCart(), 'missing', 1)).toThrow(
      'Cart item not found for product missing',
    );
  });

  it('calculates subtotal and item count', () => {
    const cart = addItemToCart(createEmptyCart(), sampleProduct, 3);

    expect(getCartSubtotalCents(cart)).toBe(38997);
    expect(getCartItemCount(cart)).toBe(3);
  });
});
