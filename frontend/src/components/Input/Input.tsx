import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import styles from './Input.module.css';

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Visible label text */
  label: string;
  /** Helper text shown below the control when there is no error */
  hint?: ReactNode;
  /** Error message; sets aria-invalid and links via aria-describedby */
  error?: string;
  /** Mark field as required (visual + aria-required) */
  required?: boolean;
}

/**
 * Labeled text input with accessible error / hint associations.
 */
export function Input({
  label,
  hint,
  error,
  required = false,
  id,
  className,
  disabled,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;
  const isInvalid = Boolean(error);

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
        {required ? (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      <input
        id={inputId}
        className={[styles.input, isInvalid ? styles.invalid : undefined]
          .filter(Boolean)
          .join(' ')}
        disabled={disabled}
        required={required}
        aria-required={required || undefined}
        aria-invalid={isInvalid || undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
