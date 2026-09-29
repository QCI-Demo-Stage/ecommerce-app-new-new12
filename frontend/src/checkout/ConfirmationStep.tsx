import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { formatPrice } from '../utils/formatPrice';
import type { CreatedOrder } from '../api/checkout';
import styles from './CheckoutSteps.module.css';

export interface ConfirmationStepProps {
  order: CreatedOrder;
  processingMs?: number;
}

/**
 * Checkout step 4 — order confirmation after a successful POST /orders.
 */
export function ConfirmationStep({
  order,
  processingMs,
}: ConfirmationStepProps) {
  const total = formatPrice(order.totalCents, order.currency);

  return (
    <div className={styles.form} aria-labelledby="confirm-step-heading">
      <h2 id="confirm-step-heading" className={styles.stepTitle}>
        Order confirmed
      </h2>
      <p className={styles.successBanner} role="status" aria-live="polite">
        Thank you! Your order has been placed successfully.
      </p>

      <dl className={styles.confirmMeta}>
        <div>
          <dt>Order ID</dt>
          <dd>
            <code>{order.id}</code>
          </dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{order.status}</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>{total}</dd>
        </div>
        {typeof processingMs === 'number' ? (
          <div>
            <dt>Checkout processing</dt>
            <dd>{processingMs} ms</dd>
          </div>
        ) : null}
      </dl>

      <div className={styles.actions}>
        <Link to="/account/orders">
          <Button type="button" variant="secondary">
            View order history
          </Button>
        </Link>
        <Link to="/products">
          <Button type="button">Continue shopping</Button>
        </Link>
      </div>
    </div>
  );
}
