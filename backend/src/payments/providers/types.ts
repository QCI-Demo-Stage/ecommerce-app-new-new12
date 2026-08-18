/**
 * Payment provider adapter interface.
 * Concrete adapters (Stripe, PayPal) implement this contract.
 */

import type {
  ChargeStatus,
  PaymentProviderName,
  RefundReason,
  RefundStatus,
} from "../types";

export interface ProviderCreateCustomerRequest {
  email: string;
  name?: string;
  paymentMethodToken: string;
  metadata?: Record<string, string>;
}

export interface ProviderCreateCustomerResponse {
  providerCustomerId: string;
  /** Provider-normalized token reference suitable for later charges */
  paymentMethodToken: string;
}

export interface ProviderChargeRequest {
  providerCustomerId: string;
  paymentMethodToken: string;
  amountCents: number;
  currency: string;
  orderId: string;
  idempotencyKey?: string;
  description?: string;
}

export interface ProviderChargeResponse {
  providerChargeId: string;
  status: ChargeStatus;
}

export interface ProviderRefundRequest {
  providerChargeId: string;
  amountCents: number;
  reason?: RefundReason;
  idempotencyKey?: string;
}

export interface ProviderRefundResponse {
  providerRefundId: string;
  status: RefundStatus;
}

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  createCustomer(
    request: ProviderCreateCustomerRequest,
  ): Promise<ProviderCreateCustomerResponse>;
  charge(request: ProviderChargeRequest): Promise<ProviderChargeResponse>;
  refund(request: ProviderRefundRequest): Promise<ProviderRefundResponse>;
}
