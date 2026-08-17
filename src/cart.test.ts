import {
  addItem,
  cartItemCount,
  cartTotalCents,
  createCart,
  removeItem,
  type Product,
} from './cart';

describe('cart', () => {
  const shirt: Product = {
    id: 'prod-shirt',
    name: 'Classic Shirt',
    priceCents: 2999,
    stock: 10,
  };

  const hat: Product = {
    id: 'prod-hat',
    name: 'Wool Hat',
    priceCents: 1999,
    stock: 5,
  };

  it('creates an empty cart', () => {
    const cart = createCart();
    expect(cart.items).toEqual([]);
    expect(cartTotalCents(cart)).toBe(0);
    expect(cartItemCount(cart)).toBe(0);
  });

  it('adds a new item to the cart', () => {
    const cart = addItem(createCart(), shirt, 2);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toEqual({
      productId: shirt.id,
      quantity: 2,
      unitPriceCents: shirt.priceCents,
    });
    expect(cartTotalCents(cart)).toBe(5998);
    expect(cartItemCount(cart)).toBe(2);
  });

  it('increments quantity when adding an existing product', () => {
    const cart = addItem(addItem(createCart(), shirt, 1), shirt, 3);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]?.quantity).toBe(4);
  });

  it('supports multiple distinct products', () => {
    const cart = addItem(addItem(createCart(), shirt, 1), hat, 2);
    expect(cart.items).toHaveLength(2);
    expect(cartTotalCents(cart)).toBe(2999 + 3998);
    expect(cartItemCount(cart)).toBe(3);
  });

  it('removes an item by product id', () => {
    const cart = removeItem(addItem(addItem(createCart(), shirt, 1), hat, 1), shirt.id);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]?.productId).toBe(hat.id);
  });

  it('rejects non-positive quantities', () => {
    expect(() => addItem(createCart(), shirt, 0)).toThrow('Quantity must be greater than zero');
    expect(() => addItem(createCart(), shirt, -1)).toThrow('Quantity must be greater than zero');
  });

  it('rejects quantities that exceed stock', () => {
    expect(() => addItem(createCart(), hat, 6)).toThrow('Insufficient stock');
    expect(() => addItem(addItem(createCart(), hat, 4), hat, 2)).toThrow('Insufficient stock');
  });
});
