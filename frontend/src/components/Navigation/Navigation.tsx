import { useId, useState, type HTMLAttributes } from 'react';
import styles from './Navigation.module.css';

export interface NavItem {
  /** Unique key */
  id: string;
  /** Visible label */
  label: string;
  /** Destination href */
  href: string;
  /** Marks the current page for aria-current */
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

  return (
    <nav
      className={[styles.nav, className].filter(Boolean).join(' ')}
      aria-label={ariaLabel}
      {...rest}
    >
      <div className={styles.inner}>
        <div className={styles.brandRow}>
          <a className={styles.brand} href={brandHref}>
            {brand}
          </a>
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
          {items.map((item) => (
            <li key={item.id}>
              <a
                className={[
                  styles.link,
                  item.current ? styles.linkActive : undefined,
                ]
                  .filter(Boolean)
                  .join(' ')}
                href={item.href}
                aria-current={item.current ? 'page' : undefined}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
