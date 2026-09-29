import { authApiFetch } from './authClient';
import { setTokens } from '../auth/tokenStorage';

export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface LoginResponse {
  message: string;
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
}

export interface UpdateProfileInput {
  firstName: string;
  lastName: string;
  email?: string;
}

export interface UpdateProfileResponse {
  message: string;
  user: PublicUser;
}

/**
 * POST /auth/login — stores JWTs on success.
 */
export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const trimmedEmail = email.trim();
  if (!trimmedEmail || !password) {
    throw new Error('Email and password are required');
  }

  const result = await authApiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: trimmedEmail, password }),
  });

  setTokens(result.accessToken, result.refreshToken);
  return result;
}

/**
 * GET /api/me — authenticated profile.
 */
export async function fetchProfile(): Promise<PublicUser> {
  return authApiFetch<PublicUser>('/api/me', { auth: true });
}

/**
 * PATCH /api/me — save editable profile fields.
 */
export async function updateProfile(
  input: UpdateProfileInput,
): Promise<UpdateProfileResponse> {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  if (!firstName || !lastName) {
    throw new Error('First name and last name are required');
  }

  const body: UpdateProfileInput = { firstName, lastName };
  if (input.email !== undefined) {
    const email = input.email.trim();
    if (!email) {
      throw new Error('Email is required');
    }
    body.email = email;
  }

  return authApiFetch<UpdateProfileResponse>('/api/me', {
    method: 'PATCH',
    auth: true,
    body: JSON.stringify(body),
  });
}
