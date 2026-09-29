import { useMemo, useState } from 'react';
import { CheckoutWizard } from '../checkout/CheckoutWizard';
import type { CheckoutItem } from '../checkout/types';
import styles from './CheckoutPage.module.css';

/**
 * Provisional checkout items until the Cart context task lands.
 * Allows manual verification of the wizard + POST /api/orders flow.
 * Replace by wiring CartProvider / cart line items in a later step.
 */
const DEMO_CHECKOUT_ITEMS: CheckoutItem[] = [
  {
    productId: 'prod-classic-widget',
    name: 'Classic Widget',
    sku: 'WDG-001',
    priceCents: 2500,
    currency: 'USD',
    quantity: 1,
  },
];

export interface CheckoutPageProps {
  /** Optional items override (tests / future cart integration). */
  items?: CheckoutItem[];
  currency?: string;
}

/**
 * Checkout page hosting the multi-step CheckoutWizard.
 */
export function CheckoutPage({
  items: itemsProp,
  currency = 'USD',
}: CheckoutPageProps) {
  const [items, setItems] = useState<CheckoutItem[]>(
    () => itemsProp ?? DEMO_CHECKOUT_ITEMS,
  );

  const resolvedItems = useMemo(
    () => itemsProp ?? items,
    [itemsProp, items],
  );

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
        currency={currency}
        onOrderPlaced={() => {
          if (itemsProp === undefined) {
            setItems([]);
          }
        }}
      />
    </section>
  );
}
