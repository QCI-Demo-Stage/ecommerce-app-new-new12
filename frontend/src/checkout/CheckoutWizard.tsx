import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../api/client';
import {
  createOrder,
  tokenizeCardNumber,
  type CreatedOrder,
} from '../api/checkout';
import { hasAccessToken } from '../auth/tokenStorage';
import { ShippingStep } from './ShippingStep';
import { PaymentStep } from './PaymentStep';
import { ReviewStep } from './ReviewStep';
import { ConfirmationStep } from './ConfirmationStep';
import {
  CHECKOUT_STEPS,
  sumSubtotalCents,
  toShippingAddress,
  type CheckoutItem,
  type CheckoutStepId,
  type PaymentFormValues,
  type ShippingFormValues,
} from './types';
import styles from './CheckoutWizard.module.css';

/** Soft client-side budget for place-order UX (story performance target). */
export const CHECKOUT_PERF_BUDGET_MS = 2000;

export interface CheckoutWizardProps {
  /** Line items to check out. Cart context will supply these in a later task. */
  items: CheckoutItem[];
  currency?: string;
  /** Called after a successful order so a future cart can clear itself. */
  onOrderPlaced?: (order: CreatedOrder) => void;
}

/**
 * Multi-step checkout wizard: Shipping → Payment → Review → Confirmation.
 * Places the order via POST /api/orders. Items are passed as props so the
 * wizard does not depend on cart state management (a separate story task).
 */
export function CheckoutWizard({
  items,
  currency = 'USD',
  onOrderPlaced,
}: CheckoutWizardProps) {
  const [step, setStep] = useState<CheckoutStepId>('shipping');
  const [shipping, setShipping] = useState<ShippingFormValues | null>(null);
  const [payment, setPayment] = useState<PaymentFormValues | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [order, setOrder] = useState<CreatedOrder | null>(null);
  const [processingMs, setProcessingMs] = useState<number | undefined>();

  const subtotalCents = useMemo(() => sumSubtotalCents(items), [items]);

  const stepIndex = useMemo(
    () => CHECKOUT_STEPS.findIndex((s) => s.id === step),
    [step],
  );

  const handleShippingContinue = useCallback((values: ShippingFormValues) => {
    setShipping(values);
    setStep('payment');
  }, []);

  const handlePaymentContinue = useCallback((values: PaymentFormValues) => {
    setPayment(values);
    setStep('review');
  }, []);

  const handlePlaceOrder = useCallback(async () => {
    if (!shipping || !payment || items.length === 0) {
      return;
    }
    if (!hasAccessToken()) {
      setSubmitError('Please sign in to place your order.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    const started = performance.now();

    try {
      let paymentPayload;
      if (payment.method === 'card') {
        const { paymentToken, cardLast4 } = tokenizeCardNumber(
          payment.cardNumber,
        );
        paymentPayload = {
          method: 'card' as const,
          paymentToken,
          cardLast4,
          nameOnCard: payment.nameOnCard.trim(),
        };
      } else {
        paymentPayload = {
          method: 'paypal' as const,
          paymentToken: `paypal_${Date.now().toString(36)}_${Math.random()
            .toString(36)
            .slice(2, 10)}`,
        };
      }

      const response = await createOrder({
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          sku: item.sku,
          priceCents: item.priceCents,
          quantity: item.quantity,
        })),
        shipping: toShippingAddress(shipping),
        payment: paymentPayload,
        currency,
      });

      const elapsed = Math.round(performance.now() - started);
      setProcessingMs(response.meta?.processingMs ?? elapsed);
      setOrder(response.order);
      onOrderPlaced?.(response.order);
      setStep('confirmation');

      if (elapsed > CHECKOUT_PERF_BUDGET_MS) {
        // Soft signal for ops — order still succeeded
        // eslint-disable-next-line no-console
        console.warn(
          `[checkout] place-order took ${elapsed}ms (budget ${CHECKOUT_PERF_BUDGET_MS}ms)`,
        );
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Unable to place order. Please try again.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }, [shipping, payment, items, currency, onOrderPlaced]);

  if (items.length === 0 && step !== 'confirmation') {
    return (
      <div className={styles.empty} role="status">
        <h2 className={styles.emptyTitle}>Nothing to check out</h2>
        <p>Add items from the catalog before checking out.</p>
        <Link className={styles.link} to="/products">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.wizard}>
      <nav className={styles.steps} aria-label="Checkout progress">
        <ol className={styles.stepList}>
          {CHECKOUT_STEPS.map((entry, index) => {
            const status =
              index < stepIndex
                ? 'complete'
                : index === stepIndex
                  ? 'current'
                  : 'upcoming';
            return (
              <li
                key={entry.id}
                className={`${styles.stepItem} ${styles[status]}`}
                aria-current={status === 'current' ? 'step' : undefined}
              >
                <span className={styles.stepIndex} aria-hidden="true">
                  {index + 1}
                </span>
                <span className={styles.stepLabel}>{entry.label}</span>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className={styles.panel}>
        {step === 'shipping' ? (
          <ShippingStep
            defaultValues={shipping ?? undefined}
            onContinue={handleShippingContinue}
          />
        ) : null}

        {step === 'payment' && shipping ? (
          <PaymentStep
            defaultValues={payment ?? undefined}
            onContinue={handlePaymentContinue}
            onBack={() => setStep('shipping')}
          />
        ) : null}

        {step === 'review' && shipping && payment ? (
          <ReviewStep
            items={items}
            subtotalCents={subtotalCents}
            currency={currency}
            shipping={shipping}
            payment={payment}
            submitting={submitting}
            error={submitError}
            onBack={() => setStep('payment')}
            onPlaceOrder={() => {
              void handlePlaceOrder();
            }}
          />
        ) : null}

        {step === 'confirmation' && order ? (
          <ConfirmationStep order={order} processingMs={processingMs} />
        ) : null}
      </div>
    </div>
  );
}
