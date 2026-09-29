import { useCallback, useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ApiErrorState } from '../components/ApiErrorState';
import { ApiError } from '../api/client';
import { fetchOrders, type Order } from '../api/orders';
import { formatPrice } from '../utils/formatPrice';
import { AccountLayout } from './AccountLayout';
import styles from './OrderHistoryPage.module.css';

const PAGE_SIZE = 5;

function formatOrderDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function statusLabel(status: Order['status']): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Authenticated order history with client-driven pagination.
 */
export function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async (nextPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchOrders({ page: nextPage, pageSize: PAGE_SIZE });
      setOrders(result.items);
      setPage(result.page);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Unable to load order history.';
      setError(message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders(page);
  }, [loadOrders, page]);

  return (
    <AccountLayout>
      <header className={styles.header}>
        <h1 className={styles.title}>Order history</h1>
        <p className={styles.lead}>
          Review your past orders. Use the controls below to move between pages.
        </p>
      </header>

      {loading ? (
        <p role="status" aria-live="polite">
          Loading orders…
        </p>
      ) : null}

      {error && !loading ? (
        <ApiErrorState
          title="Could not load orders"
          message={error}
          onRetry={() => {
            void loadOrders(page);
          }}
        />
      ) : null}

      {!loading && !error && orders.length === 0 ? (
        <p className={styles.empty} role="status">
          You have no orders yet.
        </p>
      ) : null}

      {!loading && !error && orders.length > 0 ? (
        <>
          <ul className={styles.list} aria-label="Past orders">
            {orders.map((order) => (
              <li key={order.id}>
                <Card
                  title={`Order ${order.id.slice(0, 8)}…`}
                  subtitle={`${formatOrderDate(order.createdAt)} · ${statusLabel(order.status)}`}
                  footer={
                    <span className={styles.meta}>
                      {order.itemCount} item{order.itemCount === 1 ? '' : 's'}
                    </span>
                  }
                >
                  <p className={styles.total}>
                    <span className={styles.srOnly}>Total </span>
                    {formatPrice(order.totalCents, order.currency)}
                  </p>
                </Card>
              </li>
            ))}
          </ul>

          <nav className={styles.pagination} aria-label="Order history pagination">
            <p className={styles.pageInfo} aria-live="polite">
              Page {page} of {totalPages} ({total} order{total === 1 ? '' : 's'})
            </p>
            <div className={styles.pageActions}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </nav>
        </>
      ) : null}
    </AccountLayout>
  );
}
