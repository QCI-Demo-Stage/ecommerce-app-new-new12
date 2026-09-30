/**
 * Access-token storage for authenticated SPA routes.
 * Stores JWT access tokens only (never passwords). Uses sessionStorage
 * so tokens do not persist across browser sessions.
 */

const ACCESS_TOKEN_KEY = 'ecom_access_token';
const REFRESH_TOKEN_KEY = 'ecom_refresh_token';

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Returns the current access JWT, or null when unauthenticated. */
export function getAccessToken(): string | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }
  const token = storage.getItem(ACCESS_TOKEN_KEY);
  return token && token.trim() ? token.trim() : null;
}

/** Persists access (and optional refresh) tokens after login. */
export function setTokens(accessToken: string, refreshToken?: string): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  const access = accessToken.trim();
  if (!access) {
    return;
  }
  storage.setItem(ACCESS_TOKEN_KEY, access);
  if (refreshToken?.trim()) {
    storage.setItem(REFRESH_TOKEN_KEY, refreshToken.trim());
  }
}

/** Clears stored tokens on logout or auth failure. */
export function clearTokens(): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  storage.removeItem(ACCESS_TOKEN_KEY);
  storage.removeItem(REFRESH_TOKEN_KEY);
}

/** True when an access JWT is present in storage. */
export function hasAccessToken(): boolean {
  return Boolean(getAccessToken());
}
