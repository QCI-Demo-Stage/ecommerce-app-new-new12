import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../Button';
import { Input } from '../Input';
import styles from './UnauthenticatedFallback.module.css';

export interface UnauthenticatedFallbackProps {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  error: string | null;
  submitting: boolean;
  returnPath?: string;
}

/**
 * Accessible fallback shown when a protected route is visited without a JWT.
 */
export function UnauthenticatedFallback({
  onSubmit,
  error,
  submitting,
  returnPath = '/account',
}: UnauthenticatedFallbackProps) {
  return (
    <section className={styles.wrap} aria-labelledby="auth-required-heading">
      <h1 id="auth-required-heading" className={styles.title}>
        Sign in required
      </h1>
      <p className={styles.lead}>
        Your account pages are protected. Sign in to view your profile and order
        history.
      </p>

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={submitting}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={submitting}
        />
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={submitting} fullWidth>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className={styles.meta}>
        <Link to="/products">Return to catalog</Link>
        <span aria-hidden="true"> · </span>
        <span className={styles.hint}>
          After signing in you will stay on {returnPath}.
        </span>
      </p>
    </section>
  );
}
