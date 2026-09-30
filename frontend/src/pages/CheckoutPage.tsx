import { Link } from 'react-router-dom';
import { useCart, useCartActions, toCheckoutItems } from '../cart';
import { CheckoutWizard } from '../checkout/CheckoutWizard';
import type { CheckoutItem } from '../checkout/types';
import styles from './CheckoutPage.module.css';

export interface CheckoutPageProps {
  /** Optional items override (tests). When omitted, live cart lines are used. */
  items?: CheckoutItem[];
  currency?: string;
}

/**
 * Checkout page hosting the multi-step CheckoutWizard.
 * Reads line items from Cart context and clears the cart after a successful order.
 */
export function CheckoutPage({
  items: itemsProp,
  currency,
}: CheckoutPageProps) {
  const { items: cartItems, totals } = useCart();
  const { clearCart } = useCartActions();

  const resolvedItems: CheckoutItem[] =
    itemsProp ?? toCheckoutItems(cartItems);

  const resolvedCurrency =
    currency ?? totals.currency ?? resolvedItems[0]?.currency ?? 'USD';

  if (resolvedItems.length === 0) {
    return (
      <section className={styles.page} aria-labelledby="checkout-heading">
        <header className={styles.header}>
          <h1 id="checkout-heading" className={styles.title}>
            Checkout
          </h1>
          <p className={styles.subtitle}>Your cart is empty.</p>
        </header>
        <p className={styles.emptyHint}>
          Add items from the catalog before checking out.
        </p>
        <Link className={styles.catalogLink} to="/products">
          Continue shopping
        </Link>
        <Link className={styles.cartLink} to="/cart">
          View cart
        </Link>
      </section>
    );
  }

  return (
    <section className={styles.page} aria-labelledby="checkout-heading">
      <header className={styles.header}>
        <h1 id="checkout-heading" className={styles.title}>
          Checkout
        </h1>
        <p className={styles.subtitle}>
          Complete shipping and payment to place your order.
        </p>
      </header>
      <CheckoutWizard
        items={resolvedItems}
        currency={resolvedCurrency}
        onOrderPlaced={() => {
          if (itemsProp === undefined) {
            clearCart();
          }
        }}
      />
    </section>
  );
}
