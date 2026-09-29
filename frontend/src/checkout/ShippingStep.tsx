import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import type { ShippingFormValues } from './types';
import { defaultShippingValues } from './types';
import styles from './CheckoutSteps.module.css';

export interface ShippingStepProps {
  defaultValues?: Partial<ShippingFormValues>;
  onContinue: (values: ShippingFormValues) => void;
  /** When true, show a link back to the cart instead of a Back button. */
  showCartLink?: boolean;
  onBack?: () => void;
}

/**
 * Checkout step 1 — shipping address with React Hook Form validation.
 */
export function ShippingStep({
  defaultValues,
  onContinue,
  showCartLink = true,
  onBack,
}: ShippingStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ShippingFormValues>({
    defaultValues: { ...defaultShippingValues, ...defaultValues },
    mode: 'onBlur',
  });

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit(onContinue)}
      noValidate
      aria-labelledby="shipping-step-heading"
    >
      <h2 id="shipping-step-heading" className={styles.stepTitle}>
        Shipping address
      </h2>
      <p className={styles.stepHint}>Where should we deliver your order?</p>

      <Input
        label="Full name"
        required
        autoComplete="name"
        error={errors.fullName?.message}
        {...register('fullName', {
          required: 'Full name is required',
          maxLength: { value: 120, message: 'Name is too long' },
        })}
      />
      <Input
        label="Address line 1"
        required
        autoComplete="address-line1"
        error={errors.line1?.message}
        {...register('line1', {
          required: 'Street address is required',
          maxLength: { value: 200, message: 'Address is too long' },
        })}
      />
      <Input
        label="Address line 2"
        autoComplete="address-line2"
        error={errors.line2?.message}
        {...register('line2', {
          maxLength: { value: 200, message: 'Address is too long' },
        })}
      />
      <div className={styles.row}>
        <Input
          label="City"
          required
          autoComplete="address-level2"
          error={errors.city?.message}
          {...register('city', {
            required: 'City is required',
            maxLength: { value: 100, message: 'City is too long' },
          })}
        />
        <Input
          label="State / Province"
          required
          autoComplete="address-level1"
          error={errors.state?.message}
          {...register('state', {
            required: 'State is required',
            maxLength: { value: 100, message: 'State is too long' },
          })}
        />
      </div>
      <div className={styles.row}>
        <Input
          label="Postal code"
          required
          autoComplete="postal-code"
          error={errors.postalCode?.message}
          {...register('postalCode', {
            required: 'Postal code is required',
            maxLength: { value: 20, message: 'Postal code is too long' },
            pattern: {
              value: /^[A-Za-z0-9\s-]{3,20}$/,
              message: 'Enter a valid postal code',
            },
          })}
        />
        <Input
          label="Country"
          required
          autoComplete="country"
          hint="2-letter ISO code (e.g. US)"
          error={errors.country?.message}
          {...register('country', {
            required: 'Country is required',
            pattern: {
              value: /^[A-Za-z]{2}$/,
              message: 'Use a 2-letter country code',
            },
          })}
        />
      </div>

      <div className={styles.actions}>
        {onBack ? (
          <Button type="button" variant="secondary" onClick={onBack}>
            Back
          </Button>
        ) : showCartLink ? (
          <Link to="/cart">
            <Button type="button" variant="secondary">
              Back to cart
            </Button>
          </Link>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          Continue to payment
        </Button>
      </div>
    </form>
  );
}
