import type { ReactNode, HTMLAttributes } from 'react';
import styles from './Layout.module.css';

export interface LayoutProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional site header / navigation region */
  header?: ReactNode;
  /** Optional footer region */
  footer?: ReactNode;
  /** Main page content */
  children: ReactNode;
}

/**
 * Responsive base layout: mobile-first flex shell with a CSS-grid content area.
 * Applies safe-area insets and breakpoint-driven grid columns / gutters via design tokens.
 */
export function Layout({
  header,
  footer,
  children,
  className,
  ...rest
}: LayoutProps) {
  const rootClassName = [styles.layout, className].filter(Boolean).join(' ');

  return (
    <div className={rootClassName} data-testid="layout-root" {...rest}>
      {header ? (
        <header className={styles.header} data-testid="layout-header">
          {header}
        </header>
      ) : null}
      <main className={styles.main} data-testid="layout-main" id="main-content">
        {children}
      </main>
      {footer ? (
        <footer className={styles.footer} data-testid="layout-footer">
          {footer}
        </footer>
      ) : null}
    </div>
  );
}
