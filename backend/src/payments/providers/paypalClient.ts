/**
 * PayPal Server SDK client factory.
 * Uses sandbox credentials by default; never log client secrets.
 */

import {
  Client,
  Environment,
  OrdersController,
  PaymentsController,
} from "@paypal/paypal-server-sdk";
import { PaymentError } from "../errors";

export interface PayPalSdkControllers {
  orders: OrdersController;
  payments: PaymentsController;
}

/**
 * Builds an authenticated PayPal Client + Orders/Payments controllers
 * from PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET.
 */
export function createPayPalControllers(): PayPalSdkControllers {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new PaymentError(
      "provider_error",
      "PayPal is not configured (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET)",
      { httpStatus: 503 },
    );
  }

  const nodeEnv = process.env.NODE_ENV ?? "development";
  const envName = (process.env.PAYPAL_ENV ?? "").toLowerCase();
  const environment =
    envName === "live" || envName === "production"
      ? Environment.Production
      : Environment.Sandbox;

  if (nodeEnv === "production" && environment !== Environment.Production) {
    throw new PaymentError(
      "provider_error",
      "PAYPAL_ENV must be live/production when NODE_ENV=production",
      { httpStatus: 503 },
    );
  }

  const client = new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: clientId,
      oAuthClientSecret: clientSecret,
    },
    environment,
    timeout: 30_000,
  });

  return {
    orders: new OrdersController(client),
    payments: new PaymentsController(client),
  };
}

/** True when sandbox/live API credentials are present. */
export function hasPayPalCredentials(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}
