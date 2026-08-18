import {
  forwardRef,
  useId,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import styles from './Navigation.module.css';

export interface NavigationItem {
  /** Unique key for the item. */
  id: string;
  /** Visible label. */
  label: string;
  /** Destination href. */
  href: string;
  /** Marks the current page for aria-current. */
  current?: boolean;
}

export interface NavigationProps extends HTMLAttributes<HTMLElement> {
  /** Brand / product name shown in the bar. */
  brandLabel?: string;
  /** Brand destination. */
  brandHref?: string;
  /** Primary nav links. */
  items: NavigationItem[];
  /** Optional trailing actions (e.g. cart / account buttons). */
  actions?: ReactNode;
  /** Accessible name for the landmark. */
  ariaLabel?: string;
}

/**
 * Responsive site navigation with a mobile menu toggle and desktop inline links.
 */
export const Navigation = forwardRef<HTMLElement, NavigationProps>(function Navigation(
  {
    brandLabel = 'Ecommerce',
    brandHref = '/',
    items,
    actions,
    ariaLabel = 'Primary',
    className,
    ...rest
  },
  ref,
) {
  const [open, setOpen] = useState(false);
  const menuId = useId();

  return (
    <nav
      ref={ref}
      className={clsx(styles.shell, className)}
      aria-label={ariaLabel}
      {...rest}
    >
      <div className={styles.nav}>
        <a className={styles.brand} href={brandHref}>
          <span className={styles.brandMark} aria-hidden="true" />
          <span>{brandLabel}</span>
        </a>

        <button
          type="button"
          className={styles.toggle}
          aria-controls={menuId}
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((value) => !value)}
        >
          <span className={styles.toggleIcon} aria-hidden="true" />
        </button>

        <ul
          id={menuId}
          className={clsx(styles.menu, open && styles.menuOpen)}
        >
          {items.map((item) => (
            <li key={item.id}>
              <a
                className={clsx(styles.link, item.current && styles.linkActive)}
                href={item.href}
                aria-current={item.current ? 'page' : undefined}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
    </nav>
  );
});

Navigation.displayName = 'Navigation';
