import { authApiFetch } from './authClient';

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  status: OrderStatus;
  totalCents: number;
  currency: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListParams {
  page?: number;
  pageSize?: number;
}

export interface OrderListResponse {
  items: Order[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

function sanitizePositiveInt(
  value: number | undefined,
  fallback: number,
  max: number,
): number {
  if (value === undefined || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(1, Math.floor(value)));
}

/**
 * GET /api/orders — paginated order history for the signed-in user.
 */
export async function fetchOrders(
  params: OrderListParams = {},
): Promise<OrderListResponse> {
  const page = sanitizePositiveInt(params.page, 1, 10_000);
  const pageSize = sanitizePositiveInt(params.pageSize, 10, 50);
  const search = new URLSearchParams();
  search.set('page', String(page));
  search.set('pageSize', String(pageSize));

  return authApiFetch<OrderListResponse>(`/api/orders?${search.toString()}`, {
    auth: true,
  });
}
