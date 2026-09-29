import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LazyImage } from '../components/LazyImage';
import { useCart, useCartActions } from '../cart';
import { formatPrice } from '../utils/formatPrice';
import styles from './CartPage.module.css';

/**
 * Shopping cart page — editable line items, live totals, remove confirmation.
 */
export function CartPage() {
  const navigate = useNavigate();
  const { items, totals } = useCart();
  const { updateQuantity, removeItem } = useCartActions();
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

  const pendingItem = items.find((item) => item.productId === pendingRemoveId);

  const handleQuantityChange = useCallback(
    (productId: string, raw: string) => {
      const trimmed = raw.trim();
      // Ignore intermediate empty/invalid keystrokes; removal is via confirm dialog.
      if (!trimmed) {
        return;
      }
      const parsed = Number(trimmed);
      if (!Number.isFinite(parsed) || parsed < 1) {
        return;
      }
      updateQuantity(productId, parsed);
    },
    [updateQuantity],
  );

  const confirmRemove = useCallback(() => {
    if (pendingRemoveId) {
      removeItem(pendingRemoveId);
      setPendingRemoveId(null);
    }
  }, [pendingRemoveId, removeItem]);

  if (items.length === 0) {
    return (
      <section className={styles.page} aria-labelledby="cart-heading">
        <header className={styles.header}>
          <h1 id="cart-heading" className={styles.title}>
            Your cart
          </h1>
          <p className={styles.subtitle}>Your cart is empty.</p>
        </header>
        <p className={styles.emptyHint}>
          Browse the catalog and add items to get started.
        </p>
        <Link className={styles.catalogLink} to="/products">
          Continue shopping
        </Link>
      </section>
    );
  }

  const subtotalLabel = formatPrice(totals.subtotalCents, totals.currency);

  return (
    <section className={styles.page} aria-labelledby="cart-heading">
      <header className={styles.header}>
        <h1 id="cart-heading" className={styles.title}>
          Your cart
        </h1>
        <p className={styles.subtitle}>
          {totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'} ·{' '}
          {subtotalLabel}
        </p>
      </header>

      <div className={styles.layout}>
        <ul className={styles.lineList} aria-label="Cart items">
          {items.map((item) => {
            const lineTotal = formatPrice(
              item.priceCents * item.quantity,
              item.currency,
            );
            const unitPrice = formatPrice(item.priceCents, item.currency);
            return (
              <li key={item.productId} className={styles.lineItem}>
                <Card
                  title={item.name}
                  subtitle={`SKU: ${item.sku} · ${unitPrice} each`}
                  headingLevel={2}
                  footer={
                    <div className={styles.lineFooter}>
                      <span className={styles.lineTotal} aria-label={`Line total ${lineTotal}`}>
                        {lineTotal}
                      </span>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        aria-label={`Remove ${item.name} from cart`}
                        onClick={() => setPendingRemoveId(item.productId)}
                      >
                        Remove
                      </Button>
                    </div>
                  }
                >
                  <div className={styles.lineBody}>
                    <LazyImage
                      src={item.imageUrl}
                      alt=""
                      width={96}
                      height={96}
                      className={styles.thumb}
                      rootMargin="100px"
                    />
                    <div className={styles.qtyField}>
                      <Input
                        label="Quantity"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={99}
                        step={1}
                        value={item.quantity}
                        onChange={(event) =>
                          handleQuantityChange(
                            item.productId,
                            event.target.value,
                          )
                        }
                        aria-label={`Quantity for ${item.name}`}
                      />
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>

        <aside className={styles.summary} aria-label="Order summary">
          <h2 className={styles.summaryTitle}>Summary</h2>
          <dl className={styles.summaryList}>
            <div className={styles.summaryRow}>
              <dt>Items</dt>
              <dd>{totals.itemCount}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>Subtotal</dt>
              <dd>{subtotalLabel}</dd>
            </div>
          </dl>
          <Button
            type="button"
            size="lg"
            fullWidth
            className={styles.checkoutBtn}
            onClick={() => navigate('/checkout')}
            aria-label="Proceed to checkout"
          >
            Proceed to checkout
          </Button>
          <Link className={styles.continueLink} to="/products">
            Continue shopping
          </Link>
        </aside>
      </div>

      <ConfirmDialog
        open={Boolean(pendingRemoveId)}
        title="Remove item?"
        description={
          pendingItem
            ? `Remove “${pendingItem.name}” from your cart?`
            : 'Remove this item from your cart?'
        }
        confirmLabel="Remove"
        cancelLabel="Keep item"
        danger
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemoveId(null)}
      />
    </section>
  );
}
