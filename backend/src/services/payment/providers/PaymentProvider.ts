import type {
  ChargeOrderInput,
  CreateCustomerInput,
  PaymentProviderName,
  RefundInput,
} from "../types";

export interface ProviderCustomer {
  providerCustomerId: string;
}

export interface ProviderCharge {
  chargeId: string;
  status: "succeeded" | "pending" | "failed";
  amountCents: number;
  currency: string;
}

export interface ProviderRefund {
  refundId: string;
  chargeId: string;
  amountCents: number;
  currency: string;
  status: "succeeded" | "pending" | "failed";
}

/**
 * Provider adapter contract — Stripe and PayPal implement this interface.
 * Adapters must never accept or log raw cardholder data.
 */
export interface PaymentProvider {
  readonly name: PaymentProviderName;
  createCustomer(input: CreateCustomerInput): Promise<ProviderCustomer>;
  charge(input: ChargeOrderInput): Promise<ProviderCharge>;
  refund(input: RefundInput & { amountCents: number; currency: string }): Promise<ProviderRefund>;
}
