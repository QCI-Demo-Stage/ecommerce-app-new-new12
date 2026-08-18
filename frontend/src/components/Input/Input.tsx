import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import styles from './Input.module.css';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Visible label text. Required for accessibility unless aria-label is provided. */
  label?: string;
  /** Helper text shown below the control. */
  hint?: string;
  /** Error message; sets aria-invalid and announces via aria-describedby. */
  error?: string;
  /** Leading adornment (icon or text). */
  leadingAddon?: ReactNode;
  /** Trailing adornment (icon or text). */
  trailingAddon?: ReactNode;
  /** Marks the field as required visually and via aria-required. */
  required?: boolean;
}

/**
 * Labeled text input with optional hint/error messaging and ARIA wiring.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    id,
    label,
    hint,
    error,
    leadingAddon,
    trailingAddon,
    required,
    disabled,
    className,
    'aria-label': ariaLabel,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className={clsx(styles.field, className)}>
      {label ? (
        <label className={styles.label} htmlFor={inputId}>
          {label}
          {required ? (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}

      <div
        className={clsx(
          styles.control,
          error && styles.error,
          disabled && styles.controlDisabled,
        )}
      >
        {leadingAddon ? <span className={styles.affix}>{leadingAddon}</span> : null}
        <input
          ref={ref}
          id={inputId}
          className={styles.input}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          aria-describedby={describedBy}
          aria-label={label ? undefined : ariaLabel}
          {...rest}
        />
        {trailingAddon ? <span className={styles.affix}>{trailingAddon}</span> : null}
      </div>

      {hint && !error ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} className={styles.errorText} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
