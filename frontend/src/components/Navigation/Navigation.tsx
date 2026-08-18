import { useId, useState, type HTMLAttributes } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Navigation.module.css';

export interface NavItem {
  /** Unique key */
  id: string;
  /** Visible label */
  label: string;
  /** Destination path */
  href: string;
  /** Marks the current page for aria-current (optional; derived from location when omitted) */
  current?: boolean;
}

export interface NavigationProps extends HTMLAttributes<HTMLElement> {
  /** Brand / product name shown in the bar */
  brand: string;
  /** Brand link target */
  brandHref?: string;
  /** Primary navigation links */
  items: NavItem[];
  /** Accessible name for the nav landmark */
  'aria-label'?: string;
}

/**
 * Responsive primary navigation with a mobile disclosure menu.
 * Uses React Router Link for SPA navigation and keyboard-friendly focus.
 */
export function Navigation({
  brand,
  brandHref = '/',
  items,
  className,
  'aria-label': ariaLabel = 'Primary',
  ...rest
}: NavigationProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const location = useLocation();

  return (
    <nav
      className={[styles.nav, className].filter(Boolean).join(' ')}
      aria-label={ariaLabel}
      {...rest}
    >
      <div className={styles.inner}>
        <div className={styles.brandRow}>
          <Link className={styles.brand} to={brandHref}>
            {brand}
          </Link>
          <button
            type="button"
            className={styles.menuToggle}
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
        <ul
          id={menuId}
          className={[styles.list, open ? styles.listOpen : undefined]
            .filter(Boolean)
            .join(' ')}
        >
          {items.map((item) => {
            const isCurrent =
              item.current ??
              (location.pathname === item.href ||
                (item.href !== '/' && location.pathname.startsWith(item.href)));

            return (
              <li key={item.id}>
                <Link
                  className={[
                    styles.link,
                    isCurrent ? styles.linkActive : undefined,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  to={item.href}
                  aria-current={isCurrent ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
