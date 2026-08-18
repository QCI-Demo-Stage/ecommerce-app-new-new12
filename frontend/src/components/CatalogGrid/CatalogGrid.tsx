import { Button } from '../Button';
import { ProductCard } from '../ProductCard';
import { useProducts } from '../../hooks/useProducts';
import styles from './CatalogGrid.module.css';

export interface CatalogGridProps {
  /** Items per page (default 12) */
  pageSize?: number;
  /** Optional category filter */
  category?: string;
  /** Optional search query */
  q?: string;
}

/**
 * Responsive product catalog grid.
 * Fetches GET /products, maps items to ProductCard, and lazy-loads images.
 */
export function CatalogGrid({ pageSize = 12, category, q }: CatalogGridProps) {
  const {
    products,
    page,
    total,
    totalPages,
    loading,
    error,
    setPage,
    reload,
  } = useProducts({ pageSize, category, q });

  if (loading && products.length === 0) {
    return (
      <div className={styles.status} role="status" aria-live="polite">
        <p>Loading products…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.status} role="alert">
        <p>{error}</p>
        <Button type="button" onClick={reload} aria-label="Retry loading products">
          Try again
        </Button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={styles.status} role="status">
        <p>No products found.</p>
      </div>
    );
  }

  return (
    <section className={styles.section} aria-labelledby="catalog-heading">
      <header className={styles.header}>
        <h1 id="catalog-heading" className={styles.heading}>
          Product catalog
        </h1>
        <p className={styles.summary} aria-live="polite">
          Showing {products.length} of {total} products
        </p>
      </header>

      <ul className={styles.grid} role="list">
        {products.map((product) => (
          <li key={product.id} className={styles.item}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>

      {totalPages > 1 ? (
        <nav className={styles.pagination} aria-label="Catalog pagination">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage(page - 1)}
            aria-label="Go to previous page"
          >
            Previous
          </Button>
          <span className={styles.pageLabel} aria-current="page">
            Page {page} of {totalPages}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage(page + 1)}
            aria-label="Go to next page"
          >
            Next
          </Button>
        </nav>
      ) : null}
    </section>
  );
}
