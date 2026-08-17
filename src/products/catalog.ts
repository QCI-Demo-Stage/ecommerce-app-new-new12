export interface CatalogProduct {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  inventory: number;
  category: string;
}

export function formatPrice(priceCents: number): string {
  if (!Number.isFinite(priceCents) || priceCents < 0) {
    throw new Error('Price must be a non-negative finite number');
  }

  return `$${(priceCents / 100).toFixed(2)}`;
}

export function isInStock(product: CatalogProduct, quantity = 1): boolean {
  if (quantity <= 0) {
    return false;
  }

  return product.inventory >= quantity;
}

export function findProductsByCategory(
  products: CatalogProduct[],
  category: string,
): CatalogProduct[] {
  const normalized = category.trim().toLowerCase();
  return products.filter((product) => product.category.toLowerCase() === normalized);
}

export function searchProducts(products: CatalogProduct[], query: string): CatalogProduct[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [...products];
  }

  return products.filter((product) => {
    const haystack = `${product.name} ${product.description}`.toLowerCase();
    return haystack.includes(normalized);
  });
}
