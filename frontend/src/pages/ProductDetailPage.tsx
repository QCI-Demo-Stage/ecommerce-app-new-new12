import { useId, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { LazyImage } from '../components/LazyImage';
import { useProductDetail } from '../hooks/useProductDetail';
import { formatPrice } from '../utils/formatPrice';
import styles from './ProductDetailPage.module.css';

/**
 * Product detail view for route /products/:id.
 * Fetches GET /products/:id and renders accessible product information.
 */
export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { product, loading, error, notFound, reload } = useProductDetail(id);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const headingId = useId();
  const descriptionId = useId();

  if (loading) {
    return (
      <div className={styles.status} role="status" aria-live="polite">
        <p>Loading product…</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className={styles.status} role="alert">
        <h1 className={styles.errorHeading}>Product not found</h1>
        <p>We could not find a product with that id.</p>
        <Link className={styles.backLink} to="/products">
          Back to catalog
        </Link>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className={styles.status} role="alert">
        <h1 className={styles.errorHeading}>Unable to load product</h1>
        <p>{error ?? 'Something went wrong.'}</p>
        <Button type="button" onClick={reload} aria-label="Retry loading product">
          Try again
        </Button>
        <Link className={styles.backLink} to="/products">
          Back to catalog
        </Link>
      </div>
    );
  }

  const priceLabel = formatPrice(product.priceCents, product.currency);
  const imageAlt = `Product photo of ${product.name}`;

  const handleAddToCart = () => {
    // Cart store arrives in a later story; announce intent for screen readers now.
    setCartMessage(`${product.name} added to cart`);
  };

  return (
    <article
      className={styles.detail}
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
    >
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <ol className={styles.breadcrumbList}>
          <li>
            <Link to="/products">Catalog</Link>
          </li>
          <li aria-current="page">{product.name}</li>
        </ol>
      </nav>

      <div className={styles.layout}>
        <div className={styles.media}>
          <LazyImage
            src={product.imageUrl}
            alt={imageAlt}
            width={640}
            height={640}
            className={styles.image}
            rootMargin="0px"
          />
        </div>

        <div className={styles.info}>
          {product.category ? (
            <p className={styles.category}>{product.category}</p>
          ) : null}
          <h1 id={headingId} className={styles.title}>
            {product.name}
          </h1>
          <p className={styles.sku}>SKU: {product.sku}</p>
          <p className={styles.price} aria-label={`Price ${priceLabel}`}>
            {priceLabel}
          </p>
          <p id={descriptionId} className={styles.description}>
            {product.description ?? 'No description available.'}
          </p>

          <div className={styles.actions}>
            <Button
              type="button"
              size="lg"
              onClick={handleAddToCart}
              aria-label={`Add ${product.name} to cart`}
            >
              Add to cart
            </Button>
            <Link className={styles.secondaryLink} to="/products">
              Continue shopping
            </Link>
          </div>

          <div className={styles.liveRegion} role="status" aria-live="polite">
            {cartMessage}
          </div>
        </div>
      </div>
    </article>
  );
}
