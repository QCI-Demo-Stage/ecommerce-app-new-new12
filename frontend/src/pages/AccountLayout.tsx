import type { ReactNode } from 'react';
import { AccountNav } from '../components/AccountNav';
import styles from './AccountLayout.module.css';

export interface AccountLayoutProps {
  children: ReactNode;
}

/** Shared chrome for profile and order history pages. */
export function AccountLayout({ children }: AccountLayoutProps) {
  return (
    <div className={styles.wrap}>
      <AccountNav />
      {children}
    </div>
  );
}
