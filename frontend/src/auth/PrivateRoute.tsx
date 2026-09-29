import { useState, type FormEvent, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { hasAccessToken } from './tokenStorage';
import { UnauthenticatedFallback } from '../components/UnauthenticatedFallback';
import { login } from '../api/user';
import { ApiError } from '../api/client';

export interface PrivateRouteProps {
  children: ReactNode;
}

/**
 * Route guard that requires a JWT access token in session storage.
 * Renders an accessible fallback (with sign-in) when unauthenticated.
 */
export function PrivateRoute({ children }: PrivateRouteProps) {
  const location = useLocation();
  const [authed, setAuthed] = useState(() => hasAccessToken());
  const [loginError, setLoginError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (authed) {
    return <>{children}</>;
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get('email') ?? '');
    const password = String(data.get('password') ?? '');

    if (!email.trim() || !password) {
      setLoginError('Email and password are required.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      setAuthed(true);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Sign-in failed. Please try again.';
      setLoginError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <UnauthenticatedFallback
      onSubmit={handleLogin}
      error={loginError}
      submitting={submitting}
      returnPath={location.pathname}
    />
  );
}
