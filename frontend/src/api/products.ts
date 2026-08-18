import { apiFetch } from './client';

/** Product as returned by GET /products and GET /products/:id */
export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  category: string | null;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListParams {
  page?: number;
  pageSize?: number;
  category?: string;
  q?: string;
}

export interface ProductListResponse {
  items: Product[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

function sanitizePositiveInt(
  value: number | undefined,
  fallback: number,
  max = 48,
): number {
  if (value === undefined || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(1, Math.floor(value)));
}

/**
 * GET /products — paginated catalog listing.
 */
export async function fetchProducts(
  params: ProductListParams = {},
): Promise<ProductListResponse> {
  const page = sanitizePositiveInt(params.page, 1, 10_000);
  const pageSize = sanitizePositiveInt(params.pageSize, 12, 48);
  const search = new URLSearchParams();
  search.set('page', String(page));
  search.set('pageSize', String(pageSize));

  if (params.category?.trim()) {
    search.set('category', params.category.trim());
  }
  if (params.q?.trim()) {
    search.set('q', params.q.trim());
  }

  return apiFetch<ProductListResponse>(`/products?${search.toString()}`);
}

/**
 * GET /products/:id — single product detail.
 */
export async function fetchProductById(id: string): Promise<Product> {
  const safeId = id?.trim();
  if (!safeId) {
    throw new Error('Product id is required');
  }
  // Prevent path injection via unexpected characters
  if (!/^[a-zA-Z0-9-]+$/.test(safeId)) {
    throw new Error('Invalid product id');
  }
  return apiFetch<Product>(`/products/${encodeURIComponent(safeId)}`);
}
