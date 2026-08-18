/**
 * Structured logger for payment and core services.
 * Never logs secrets, raw provider payloads, or credentials.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  /** Stable action name, e.g. stripe.createCustomer */
  action: string;
  /** Initiating principal when known (user id), never PII */
  userId?: string;
  /** Provider name when applicable */
  provider?: string;
  /** Approval / authorization status for audit trails */
  approvalStatus?: "n/a" | "approved" | "denied" | "pending";
  /** High-level result */
  result?: "success" | "failure" | "skipped";
  /** Safe, non-sensitive metadata only */
  meta?: Record<string, string | number | boolean | null | undefined>;
}

export interface StandardizedErrorLog {
  code: string;
  message: string;
  provider?: string;
  action: string;
  httpStatus?: number;
  /** Stripe-style decline / error type without raw payload */
  type?: string;
}

const AI_IDENTITY = "ecommerce-backend-payment-service";

function timestamp(): string {
  return new Date().toISOString();
}

function write(level: LogLevel, message: string, context: LogContext): void {
  const entry = {
    timestamp: timestamp(),
    level,
    aiIdentity: AI_IDENTITY,
    message,
    action: context.action,
    initiatingUser: context.userId ?? "system",
    provider: context.provider,
    approvalStatus: context.approvalStatus ?? "n/a",
    result: context.result,
    accessedSystems: context.provider ? [context.provider] : undefined,
    meta: context.meta,
  };

  const line = JSON.stringify(entry);
  if (level === "error") {
    // eslint-disable-next-line no-console
    console.error(line);
  } else if (level === "warn") {
    // eslint-disable-next-line no-console
    console.warn(line);
  } else {
    // eslint-disable-next-line no-console
    console.log(line);
  }
}

export const logger = {
  info(message: string, context: LogContext): void {
    write("info", message, context);
  },

  warn(message: string, context: LogContext): void {
    write("warn", message, context);
  },

  error(message: string, context: LogContext): void {
    write("error", message, context);
  },

  /**
   * Logs a sanitized provider error. Callers must pass mapped fields only —
   * never raw SDK error objects or response bodies.
   */
  logStandardizedError(err: StandardizedErrorLog): void {
    write("error", err.message, {
      action: err.action,
      provider: err.provider,
      result: "failure",
      approvalStatus: "n/a",
      meta: {
        code: err.code,
        type: err.type ?? null,
        httpStatus: err.httpStatus ?? null,
      },
    });
  },
};
