import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style of the button. */
  variant?: ButtonVariant;
  /** Control height and padding. */
  size?: ButtonSize;
  /** Stretch to 100% of parent width. */
  fullWidth?: boolean;
  /** Shows a busy state and sets aria-busy. */
  loading?: boolean;
  /** Optional leading icon. */
  leadingIcon?: ReactNode;
  /** Optional trailing icon. */
  trailingIcon?: ReactNode;
}

/**
 * Accessible button with design-token-driven variants and sizes.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    disabled,
    leadingIcon,
    trailingIcon,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <button
      ref={ref}
      type={type}
      className={clsx(
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        loading && styles.loading,
        className,
      )}
      disabled={isDisabled}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span className={styles.spinner} aria-hidden="true" data-testid="button-spinner" />
      ) : (
        leadingIcon
      )}
      <span>{children}</span>
      {!loading ? trailingIcon : null}
    </button>
  );
});

Button.displayName = 'Button';
