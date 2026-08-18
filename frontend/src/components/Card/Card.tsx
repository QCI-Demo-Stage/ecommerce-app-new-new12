import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import styles from './Card.module.css';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Optional card title rendered in the header. */
  title?: ReactNode;
  /** Optional subtitle under the title. */
  subtitle?: ReactNode;
  /** Footer actions / meta. */
  footer?: ReactNode;
  /** Padding token scale. */
  padding?: CardPadding;
  /** Soft elevation via design-token shadow. */
  elevated?: boolean;
  /** Makes the card keyboard-focusable and hoverable for clickable cards. */
  interactive?: boolean;
  /** Element tag; defaults to article. */
  as?: 'article' | 'section' | 'div' | 'li';
  children?: ReactNode;
}

/**
 * Content card with optional header/footer and responsive padding tokens.
 */
export const Card = forwardRef<HTMLElement, CardProps>(function Card(
  {
    title,
    subtitle,
    footer,
    padding = 'md',
    elevated = false,
    interactive = false,
    as: Component = 'article',
    className,
    children,
    tabIndex,
    role,
    ...rest
  },
  ref,
) {
  const paddingClass =
    padding === 'none'
      ? styles.paddingNone
      : padding === 'sm'
        ? styles.paddingSm
        : padding === 'lg'
          ? styles.paddingLg
          : styles.paddingMd;

  const computedTabIndex = interactive ? (tabIndex ?? 0) : tabIndex;
  const computedRole = interactive ? (role ?? 'button') : role;

  return (
    <Component
      ref={ref as never}
      className={clsx(
        styles.card,
        paddingClass,
        elevated && styles.elevated,
        interactive && styles.interactive,
        className,
      )}
      tabIndex={computedTabIndex}
      role={computedRole}
      {...rest}
    >
      {title || subtitle ? (
        <header className={styles.header}>
          {title ? <h3 className={styles.title}>{title}</h3> : null}
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </header>
      ) : null}

      {children ? <div className={styles.body}>{children}</div> : null}

      {footer ? <footer className={styles.footer}>{footer}</footer> : null}
    </Component>
  );
});

Card.displayName = 'Card';
