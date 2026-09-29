import { NavLink } from 'react-router-dom';
import styles from './AccountNav.module.css';

const links = [
  { to: '/account', label: 'Profile', end: true },
  { to: '/account/orders', label: 'Order history', end: false },
] as const;

/**
 * Secondary navigation for authenticated account screens (WCAG landmark).
 */
export function AccountNav() {
  return (
    <nav className={styles.nav} aria-label="Account">
      <ul className={styles.list}>
        {links.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                [styles.link, isActive ? styles.linkActive : undefined]
                  .filter(Boolean)
                  .join(' ')
              }
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
