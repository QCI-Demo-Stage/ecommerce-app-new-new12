import { Button } from '../components/Button';
import { formatPrice } from '../utils/formatPrice';
import type { CartItem } from '../cart';
import type { PaymentFormValues, ShippingFormValues } from './types';
import styles from './CheckoutSteps.module.css';

export interface ReviewStepProps {
  items: CartItem[];
  subtotalCents: number;
  currency: string;
  shipping: ShippingFormValues;
  payment: PaymentFormValues;
  submitting: boolean;
  error: string | null;
  onBack: () => void;
  onPlaceOrder: () => void;
}

/**
 * Checkout step 3 — review cart, shipping, and payment before placing the order.
 */
export function ReviewStep({
  items,
  subtotalCents,
  currency,
  shipping,
  payment,
  submitting,
  error,
  onBack,
  onPlaceOrder,
}: ReviewStepProps) {
  const cardLast4 =
    payment.method === 'card'
      ? payment.cardNumber.replace(/\D/g, '').slice(-4)
      : undefined;

  return (
    <div className={styles.form} aria-labelledby="review-step-heading">
      <h2 id="review-step-heading" className={styles.stepTitle}>
        Review order
      </h2>
      <p className={styles.stepHint}>Confirm details, then place your order.</p>

      <section className={styles.reviewBlock} aria-labelledby="review-items">
        <h3 id="review-items" className={styles.reviewHeading}>
          Items
        </h3>
        <ul className={styles.reviewList}>
          {items.map((item) => (
            <li key={item.productId}>
              {item.name} × {item.quantity} —{' '}
              {formatPrice(item.priceCents * item.quantity, item.currency)}
            </li>
          ))}
        </ul>
        <p className={styles.reviewTotal}>
          Total:{' '}
          <strong>{formatPrice(subtotalCents, currency)}</strong>
        </p>
      </section>

      <section className={styles.reviewBlock} aria-labelledby="review-ship">
        <h3 id="review-ship" className={styles.reviewHeading}>
          Shipping
        </h3>
        <address className={styles.address}>
          {shipping.fullName}
          <br />
          {shipping.line1}
          {shipping.line2 ? (
            <>
              <br />
              {shipping.line2}
            </>
          ) : null}
          <br />
          {shipping.city}, {shipping.state} {shipping.postalCode}
          <br />
          {shipping.country}
        </address>
      </section>

      <section className={styles.reviewBlock} aria-labelledby="review-pay">
        <h3 id="review-pay" className={styles.reviewHeading}>
          Payment
        </h3>
        <p className={styles.paymentSummary}>
          {payment.method === 'card'
            ? `Card ending in ${cardLast4 || '****'}${
                payment.nameOnCard ? ` · ${payment.nameOnCard}` : ''
              }`
            : 'PayPal'}
        </p>
      </section>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {submitting ? (
        <div className={styles.loading} role="status" aria-live="polite">
          Placing your order…
        </div>
      ) : null}

      <div className={styles.actions}>
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          disabled={submitting}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={onPlaceOrder}
          disabled={submitting}
          aria-busy={submitting || undefined}
        >
          {submitting ? 'Placing order…' : 'Place order'}
        </Button>
      </div>
    </div>
  );
}
