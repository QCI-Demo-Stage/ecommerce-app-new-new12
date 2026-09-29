import { CheckoutWizard } from '../checkout/CheckoutWizard';
import styles from './CheckoutPage.module.css';

/**
 * Checkout page hosting the multi-step CheckoutWizard.
 */
export function CheckoutPage() {
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
      <CheckoutWizard />
    </section>
  );
}
