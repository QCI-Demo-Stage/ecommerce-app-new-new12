import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchProducts,
  type Product,
  type ProductListParams,
  type ProductListResponse,
} from '../api/products';
import { ApiError } from '../api/client';

export interface UseProductsResult {
  products: Product[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  setPage: (page: number) => void;
  reload: () => void;
}

/**
 * Fetches paginated products from GET /products.
 * Avoids duplicate requests under React Strict Mode by tracking the latest request id.
 */
export function useProducts(
  params: Omit<ProductListParams, 'page'> & { page?: number } = {},
): UseProductsResult {
  const [page, setPage] = useState(params.page ?? 1);
  const [data, setData] = useState<ProductListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const requestIdRef = useRef(0);

  const pageSize = params.pageSize ?? 12;
  const category = params.category;
  const q = params.q;

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const result = await fetchProducts({
          page,
          pageSize,
          category,
          q,
        });
        if (requestId !== requestIdRef.current || controller.signal.aborted) {
          return;
        }
        setData(result);
      } catch (err) {
        if (requestId !== requestIdRef.current || controller.signal.aborted) {
          return;
        }
        const message =
          err instanceof ApiError
            ? err.message
            : 'Failed to load products. Please try again.';
        setError(message);
        setData(null);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [page, pageSize, category, q, reloadToken]);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return {
    products: data?.items ?? [],
    page: data?.page ?? page,
    pageSize: data?.pageSize ?? pageSize,
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1,
    loading,
    error,
    setPage,
    reload,
  };
}
