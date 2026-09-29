import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchProductById, type Product } from '../api/products';
import { ApiError } from '../api/client';

export interface UseProductDetailResult {
  product: Product | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
  reload: () => void;
}

/**
 * Fetches a single product from GET /products/:id.
 */
export function useProductDetail(productId: string | undefined): UseProductDetailResult {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(Boolean(productId));
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!productId?.trim()) {
      setProduct(null);
      setLoading(false);
      setError('Missing product id');
      setNotFound(true);
      return;
    }

    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setNotFound(false);

    void (async () => {
      try {
        const result = await fetchProductById(productId);
        if (requestId !== requestIdRef.current || controller.signal.aborted) {
          return;
        }
        setProduct(result);
      } catch (err) {
        if (requestId !== requestIdRef.current || controller.signal.aborted) {
          return;
        }
        setProduct(null);
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
          setError('Product not found');
        } else {
          setNotFound(false);
          setError(
            err instanceof ApiError
              ? err.message
              : 'Failed to load product. Please try again.',
          );
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [productId, reloadToken]);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return { product, loading, error, notFound, reload };
}
