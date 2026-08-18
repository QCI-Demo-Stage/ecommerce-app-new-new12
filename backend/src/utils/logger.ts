export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  /** Stable operation name, e.g. stripe.createCustomer */
  operation?: string;
  /** Correlation / request id when available */
  requestId?: string;
  /** Provider name when logging payment events */
  provider?: string;
  /** Safe, non-sensitive metadata only */
  meta?: Record<string, string | number | boolean | null | undefined>;
}

/**
 * Minimal structured logger. Never pass secrets, PAN, CVV, or raw SDK
 * payloads into `meta` — callers must sanitize first.
 */
export const logger = {
  debug(message: string, context?: LogContext): void {
    write("debug", message, context);
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
};

function write(level: LogLevel, message: string, context?: LogContext): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context?.operation ? { operation: context.operation } : {}),
    ...(context?.requestId ? { requestId: context.requestId } : {}),
    ...(context?.provider ? { provider: context.provider } : {}),
    ...(context?.meta ? { meta: context.meta } : {}),
  };

  const line = JSON.stringify(entry);
  if (level === "error") {
    // eslint-disable-next-line no-console
    console.error(line);
    return;
  }
  if (level === "warn") {
    // eslint-disable-next-line no-console
    console.warn(line);
    return;
  }
  // eslint-disable-next-line no-console
  console.log(line);
}
