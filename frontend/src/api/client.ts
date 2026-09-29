/**
 * Shared API client for the ecommerce backend.
 * Validates base URL and normalizes HTTP / network errors.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code = 'api_error') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

declare global {
  // Runtime override set from main.tsx (Vite env) — avoids import.meta in Jest.
  // eslint-disable-next-line no-var
  var __ECOM_API_BASE_URL__: string | undefined;
}

function resolveBaseUrl(): string {
  const fromRuntime =
    typeof globalThis !== 'undefined'
      ? globalThis.__ECOM_API_BASE_URL__
      : undefined;
  if (fromRuntime && fromRuntime.trim()) {
    return fromRuntime.replace(/\/$/, '');
  }
  // Vite proxy in development; same-origin in production behind a gateway
  return '';
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${resolveBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(
      'Unable to reach the API. Check your connection.',
      0,
      'network_error',
    );
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    let code = 'api_error';
    try {
      const body = (await response.json()) as {
        message?: string;
        error?: string;
      };
      if (body.message) {
        message = body.message;
      }
      if (body.error) {
        code = body.error;
      }
    } catch {
      // ignore non-JSON error bodies
    }
    throw new ApiError(message, response.status, code);
  }

  return (await response.json()) as T;
}
