import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import styles from './Layout.module.css';

export interface LayoutProps extends HTMLAttributes<HTMLDivElement> {
  /** Site header slot (typically Navigation). */
  header?: ReactNode;
  /** Optional aside / sidebar shown from tablet upward. */
  aside?: ReactNode;
  /** Footer slot. */
  footer?: ReactNode;
  /** When true, renders a debug badge showing the active breakpoint. */
  showBreakpointBadge?: boolean;
  children: ReactNode;
}

/**
 * Responsive base layout: mobile-first flex shell with a CSS grid content area.
 * Applies safe-area insets and token-driven gutters/columns per breakpoint.
 */
export const Layout = forwardRef<HTMLDivElement, LayoutProps>(function Layout(
  {
    header,
    aside,
    footer,
    showBreakpointBadge = false,
    children,
    className,
    ...rest
  },
  ref,
) {
  const hasAside = Boolean(aside);

  return (
    <div
      ref={ref}
      className={clsx(styles.layout, hasAside && styles.layoutWithAside, className)}
      data-layout="base"
      {...rest}
    >
      {header ? (
        <header className={styles.header}>
          <div className={styles.headerInner}>{header}</div>
        </header>
      ) : null}

      <main className={styles.main} id="main-content">
        <div className={styles.mainInner}>
          <div className={styles.content}>{children}</div>
          {hasAside ? (
            <aside className={styles.aside} aria-label="Complementary">
              {aside}
            </aside>
          ) : null}
        </div>
      </main>

      {footer ? (
        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            {showBreakpointBadge ? (
              <span className={styles.breakpointBadge} data-testid="breakpoint-badge">
                Breakpoint:
              </span>
            ) : null}
            {footer}
          </div>
        </footer>
      ) : null}
    </div>
  );
});

Layout.displayName = 'Layout';
