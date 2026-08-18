/**
 * Structured audit logger for payment actions.
 * Never logs secrets, raw tokens, or card data.
 */

export type PaymentLogLevel = "info" | "warn" | "error";

export interface PaymentLogEntry {
  timestamp: string;
  level: PaymentLogLevel;
  action: string;
  aiIdentity: "payment-service";
  result: "success" | "failure";
  customerId?: string;
  chargeId?: string;
  orderId?: string;
  provider?: string;
  errorCode?: string;
  message?: string;
}

export interface PaymentLogger {
  log(entry: Omit<PaymentLogEntry, "timestamp" | "aiIdentity">): void;
}

export class ConsolePaymentLogger implements PaymentLogger {
  log(entry: Omit<PaymentLogEntry, "timestamp" | "aiIdentity">): void {
    const full: PaymentLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
      aiIdentity: "payment-service",
    };
    const line = JSON.stringify(full);
    if (entry.level === "error") {
      // eslint-disable-next-line no-console
      console.error(line);
    } else if (entry.level === "warn") {
      // eslint-disable-next-line no-console
      console.warn(line);
    } else {
      // eslint-disable-next-line no-console
      console.info(line);
    }
  }
}
