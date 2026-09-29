import type { ShippingAddress } from '../api/checkout';

export type CheckoutStepId =
  | 'shipping'
  | 'payment'
  | 'review'
  | 'confirmation';

export interface ShippingFormValues {
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PaymentFormValues {
  method: 'card' | 'paypal';
  nameOnCard: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
}

export interface CheckoutFormData {
  shipping: ShippingFormValues;
  payment: PaymentFormValues;
}

export const CHECKOUT_STEPS: Array<{
  id: CheckoutStepId;
  label: string;
}> = [
  { id: 'shipping', label: 'Shipping' },
  { id: 'payment', label: 'Payment' },
  { id: 'review', label: 'Review' },
  { id: 'confirmation', label: 'Confirmation' },
];

export const defaultShippingValues: ShippingFormValues = {
  fullName: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
};

export const defaultPaymentValues: PaymentFormValues = {
  method: 'card',
  nameOnCard: '',
  cardNumber: '',
  expiry: '',
  cvc: '',
};

export function toShippingAddress(
  values: ShippingFormValues,
): ShippingAddress {
  return {
    fullName: values.fullName.trim(),
    line1: values.line1.trim(),
    line2: values.line2.trim() || undefined,
    city: values.city.trim(),
    state: values.state.trim(),
    postalCode: values.postalCode.trim(),
    country: values.country.trim().toUpperCase(),
  };
}
