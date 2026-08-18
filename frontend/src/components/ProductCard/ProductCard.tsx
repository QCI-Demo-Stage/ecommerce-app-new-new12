import { Link } from 'react-router-dom';
import { Card } from '../Card';
import { LazyImage } from '../LazyImage';
import { formatPrice } from '../../utils/formatPrice';
import type { Product } from '../../api/products';
import styles from './ProductCard.module.css';

export interface ProductCardProps {
  product: Product;
}

/**
 * Catalog tile mapped from GET /products items onto the shared Card component.
 * The entire card is a single link for keyboard and screen-reader navigation.
 */
export function ProductCard({ product }: ProductCardProps) {
  const priceLabel = formatPrice(product.priceCents, product.currency);
  const altText = `${product.name}${product.category ? ` — ${product.category}` : ''}`;
  const ariaLabel = `View details for ${product.name}, ${priceLabel}`;

  return (
    <Link
      to={`/products/${product.id}`}
      className={styles.link}
      aria-label={ariaLabel}
    >
      <Card
        className={styles.card}
        title={product.name}
        subtitle={product.category ?? product.sku}
        headingLevel={3}
        footer={
          <span className={styles.price} aria-label={`Price ${priceLabel}`}>
            {priceLabel}
          </span>
        }
      >
        <div className={styles.media}>
          <LazyImage
            src={product.imageUrl}
            alt={altText}
            width={640}
            height={640}
            className={styles.image}
          />
        </div>
        {product.description ? (
          <p className={styles.description}>{product.description}</p>
        ) : null}
      </Card>
    </Link>
  );
}
