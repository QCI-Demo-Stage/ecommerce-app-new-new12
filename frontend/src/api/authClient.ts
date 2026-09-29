import { ApiError, apiFetch } from './client';
import { getAccessToken } from '../auth/tokenStorage';

export interface ApiFetchOptions extends RequestInit {
  /** When true, attaches Authorization: Bearer <accessToken>. */
  auth?: boolean;
}

/**
 * Authenticated API helper — attaches JWT when `auth` is true.
 */
export async function authApiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { auth = false, headers, ...rest } = options;
  const nextHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string> | undefined),
  };

  if (auth) {
    const token = getAccessToken();
    if (!token) {
      throw new ApiError('Authentication required', 401, 'unauthorized');
    }
    nextHeaders.Authorization = `Bearer ${token}`;
  }

  if (rest.body && !nextHeaders['Content-Type']) {
    nextHeaders['Content-Type'] = 'application/json';
  }

  return apiFetch<T>(path, {
    ...rest,
    headers: nextHeaders,
  });
}
