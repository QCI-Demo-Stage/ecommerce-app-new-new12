/**
 * Structured logger for payment and core services.
 * Never logs secrets, raw provider payloads, or PCI-sensitive fields.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  /** Stable action name, e.g. stripe.createCustomer */
  action?: string;
  /** Correlation / request id when available */
  requestId?: string;
  /** Provider name (stripe, paypal, …) */
  provider?: string;
  /** Safe, non-sensitive metadata only */
  [key: string]: unknown;
}

export interface StandardizedErrorLog {
  code: string;
  message: string;
  provider?: string;
  action?: string;
  httpStatus?: number;
  /** Stripe-style decline / error type when known — never raw SDK objects */
  errorType?: string;
}

function timestamp(): string {
  return new Date().toISOString();
}

function write(level: LogLevel, message: string, context?: LogContext): void {
  const entry = {
    ts: timestamp(),
    level,
    message,
    ...sanitizeContext(context),
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

const SENSITIVE_KEY =
  /^(password|secret|token|authorization|api[_-]?key|card|cvc|cvv|pan|raw|stripe[_-]?key|payload)$/i;

function sanitizeContext(
  context?: LogContext,
): Record<string, unknown> | undefined {
  if (!context) {
    return undefined;
  }
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    if (SENSITIVE_KEY.test(key)) {
      out[key] = "[REDACTED]";
      continue;
    }
    if (value !== null && typeof value === "object") {
      // Avoid persisting nested provider objects
      out[key] = "[OBJECT]";
      continue;
    }
    out[key] = value;
  }
  return out;
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if ((process.env.LOG_LEVEL ?? "info") === "debug") {
      write("debug", message, context);
    }
  },
  info(message: string, context?: LogContext): void {
    write("info", message, context);
  },
  warn(message: string, context?: LogContext): void {
    write("warn", message, context);
  },
  error(message: string, context?: LogContext): void {
    write("error", message, context);
  },
  /** Log a standardized payment/provider error — never the raw SDK error. */
  paymentError(std: StandardizedErrorLog): void {
    write("error", "payment_provider_error", {
      action: std.action,
      provider: std.provider,
      code: std.code,
      message: std.message,
      httpStatus: std.httpStatus,
      errorType: std.errorType,
    });
  },
};
