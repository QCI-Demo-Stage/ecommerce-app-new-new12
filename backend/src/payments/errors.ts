/**
 * Standardized payment errors. Raw Stripe payloads are never attached —
 * only mapped codes and safe user-facing messages are exposed.
 */
export class PaymentError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly userMessage: string;
  readonly provider?: string;
  readonly retryable: boolean;

  constructor(params: {
    code: string;
    message: string;
    userMessage: string;
    statusCode?: number;
    provider?: string;
    retryable?: boolean;
  }) {
    super(params.message);
    this.name = "PaymentError";
    this.code = params.code;
    this.userMessage = params.userMessage;
    this.statusCode = params.statusCode ?? 502;
    this.provider = params.provider;
    this.retryable = params.retryable ?? false;
  }

  /** Safe object for HTTP responses and audit logs — no raw SDK data. */
  toLogObject(): Record<string, string | number | boolean | undefined> {
    return {
      code: this.code,
      statusCode: this.statusCode,
      userMessage: this.userMessage,
      provider: this.provider,
      retryable: this.retryable,
    };
  }

  toClientJson(): { error: string; message: string } {
    return {
      error: this.code,
      message: this.userMessage,
    };
  }
}

interface StripeLikeError {
  type?: string;
  code?: string;
  message?: string;
  statusCode?: number;
  rawType?: string;
}

/**
 * Maps Stripe SDK failures to PaymentError without persisting or
 * returning raw error bodies, stack traces, or request payloads.
 */
export function mapStripeError(err: unknown, operation: string): PaymentError {
  if (err instanceof PaymentError) {
    return err;
  }

  const stripeErr = asStripeLikeError(err);
  if (stripeErr) {
    return mapKnownStripeError(stripeErr, operation);
  }

  return new PaymentError({
    code: "payment_provider_error",
    message: `Stripe ${operation} failed with an unexpected error`,
    userMessage:
      "We could not process your payment right now. Please try again later.",
    statusCode: 502,
    provider: "stripe",
    retryable: true,
  });
}

function asStripeLikeError(err: unknown): StripeLikeError | null {
  if (!err || typeof err !== "object") {
    return null;
  }
  const candidate = err as StripeLikeError & { type?: string };
  // Stripe errors expose `type` such as StripeCardError / card_error
  if (
    typeof candidate.type === "string" ||
    typeof candidate.rawType === "string" ||
    typeof candidate.code === "string"
  ) {
    return candidate;
  }
  return null;
}

function mapKnownStripeError(
  err: StripeLikeError,
  operation: string,
): PaymentError {
  const type = (err.type ?? err.rawType ?? "").toLowerCase();
  const code = (err.code ?? "").toLowerCase();

  if (type.includes("card") || code === "card_declined") {
    return new PaymentError({
      code: "card_declined",
      message: `Stripe ${operation}: card declined`,
      userMessage:
        "Your card was declined. Please use a different payment method.",
      statusCode: 402,
      provider: "stripe",
      retryable: false,
    });
  }

  if (
    code === "incorrect_cvc" ||
    code === "invalid_cvc" ||
    code === "expired_card" ||
    code === "incorrect_number" ||
    code === "invalid_number"
  ) {
    return new PaymentError({
      code: "invalid_payment_method",
      message: `Stripe ${operation}: invalid payment method (${code})`,
      userMessage:
        "The payment method details look invalid. Please check and try again.",
      statusCode: 400,
      provider: "stripe",
      retryable: false,
    });
  }

  if (
    type.includes("invalid_request") ||
    code === "resource_missing" ||
    code === "parameter_invalid_empty"
  ) {
    return new PaymentError({
      code: "invalid_payment_request",
      message: `Stripe ${operation}: invalid request`,
      userMessage:
        "The payment request was invalid. Please verify order details and try again.",
      statusCode: 400,
      provider: "stripe",
      retryable: false,
    });
  }

  if (type.includes("authentication") || code === "api_key_expired") {
    return new PaymentError({
      code: "payment_provider_auth_error",
      message: `Stripe ${operation}: authentication failure`,
      userMessage:
        "Payment service is temporarily unavailable. Please try again later.",
      statusCode: 503,
      provider: "stripe",
      retryable: true,
    });
  }

  if (type.includes("rate_limit")) {
    return new PaymentError({
      code: "payment_rate_limited",
      message: `Stripe ${operation}: rate limited`,
      userMessage:
        "Too many payment attempts. Please wait a moment and try again.",
      statusCode: 429,
      provider: "stripe",
      retryable: true,
    });
  }

  if (type.includes("api_connection") || type.includes("apierror")) {
    return new PaymentError({
      code: "payment_provider_unavailable",
      message: `Stripe ${operation}: connection/API error`,
      userMessage:
        "We could not reach the payment provider. Please try again shortly.",
      statusCode: 503,
      provider: "stripe",
      retryable: true,
    });
  }

  return new PaymentError({
    code: "payment_provider_error",
    message: `Stripe ${operation} failed`,
    userMessage:
      "We could not process your payment right now. Please try again later.",
    statusCode: typeof err.statusCode === "number" ? err.statusCode : 502,
    provider: "stripe",
    retryable: true,
  });
}
