import { findProductsByCategory, formatPrice, isInStock, searchProducts } from './catalog';
import type { CatalogProduct } from './catalog';

const products: CatalogProduct[] = [
  {
    id: 'sku-100',
    name: 'Wireless Headphones',
    description: 'Noise-cancelling over-ear headphones',
    priceCents: 12999,
    inventory: 10,
    category: 'Audio',
  },
  {
    id: 'sku-200',
    name: 'USB-C Hub',
    description: '7-in-1 multiport adapter',
    priceCents: 4999,
    inventory: 0,
    category: 'Accessories',
  },
];

describe('catalog', () => {
  it('formats prices as USD currency strings', () => {
    expect(formatPrice(12999)).toBe('$129.99');
    expect(formatPrice(0)).toBe('$0.00');
  });

  it('rejects invalid prices', () => {
    expect(() => formatPrice(-1)).toThrow('Price must be a non-negative finite number');
    expect(() => formatPrice(Number.NaN)).toThrow('Price must be a non-negative finite number');
  });

  it('checks stock availability', () => {
    expect(isInStock(products[0]!)).toBe(true);
    expect(isInStock(products[0]!, 11)).toBe(false);
    expect(isInStock(products[1]!)).toBe(false);
    expect(isInStock(products[0]!, 0)).toBe(false);
  });

  it('finds products by category', () => {
    expect(findProductsByCategory(products, 'audio')).toHaveLength(1);
    expect(findProductsByCategory(products, 'Accessories')[0]?.id).toBe('sku-200');
  });

  it('searches products by name and description', () => {
    expect(searchProducts(products, 'hub')).toHaveLength(1);
    expect(searchProducts(products, 'noise-cancelling')).toHaveLength(1);
    expect(searchProducts(products, '  ')).toHaveLength(2);
  });
});
