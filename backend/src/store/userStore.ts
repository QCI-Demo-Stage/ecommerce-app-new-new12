import { randomUUID } from "crypto";

export type UserRole = "customer" | "admin" | "support";

export interface UserRecord {
  id: string;
  email: string;
  /** bcrypt hash — never store plaintext passwords */
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  };
}

/**
 * In-memory user store aligned with the PostgreSQL `users` table shape.
 * Swap for a Postgres-backed repository when the data layer is wired in.
 */
export class UserStore {
  private readonly byId = new Map<string, UserRecord>();
  private readonly byEmail = new Map<string, string>();

  async findByEmail(email: string): Promise<UserRecord | null> {
    const id = this.byEmail.get(email.toLowerCase());
    if (!id) {
      return null;
    }
    return this.byId.get(id) ?? null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    return this.byId.get(id) ?? null;
  }

  async create(input: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
  }): Promise<UserRecord> {
    const normalizedEmail = input.email.toLowerCase();
    if (this.byEmail.has(normalizedEmail)) {
      const err = new Error("EMAIL_TAKEN");
      throw err;
    }

    const now = new Date();
    const user: UserRecord = {
      id: randomUUID(),
      email: normalizedEmail,
      passwordHash: input.passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role ?? "customer",
      isActive: true,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    };

    this.byId.set(user.id, user);
    this.byEmail.set(normalizedEmail, user.id);
    return user;
  }

  async markLogin(userId: string): Promise<void> {
    const user = this.byId.get(userId);
    if (!user) {
      return;
    }
    user.lastLoginAt = new Date();
    user.updatedAt = new Date();
  }
}

export const userStore = new UserStore();
