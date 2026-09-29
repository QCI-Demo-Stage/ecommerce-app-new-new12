import { useForm } from 'react-hook-form';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import type { PaymentFormValues } from './types';
import { defaultPaymentValues } from './types';
import styles from './CheckoutSteps.module.css';

export interface PaymentStepProps {
  defaultValues?: Partial<PaymentFormValues>;
  onContinue: (values: PaymentFormValues) => void;
  onBack: () => void;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Checkout step 2 — payment details with React Hook Form validation.
 * Card numbers are validated client-side and tokenized before API submission.
 */
export function PaymentStep({
  defaultValues,
  onContinue,
  onBack,
}: PaymentStepProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormValues>({
    defaultValues: { ...defaultPaymentValues, ...defaultValues },
    mode: 'onBlur',
  });

  const method = watch('method');

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit(onContinue)}
      noValidate
      aria-labelledby="payment-step-heading"
    >
      <h2 id="payment-step-heading" className={styles.stepTitle}>
        Payment
      </h2>
      <p className={styles.stepHint}>
        Your card details are tokenized in the browser and never stored as a
        full card number.
      </p>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Payment method</legend>
        <label className={styles.radio}>
          <input
            type="radio"
            value="card"
            {...register('method', { required: true })}
          />
          Credit / debit card
        </label>
        <label className={styles.radio}>
          <input type="radio" value="paypal" {...register('method')} />
          PayPal
        </label>
      </fieldset>

      {method === 'card' ? (
        <>
          <Input
            label="Name on card"
            required
            autoComplete="cc-name"
            error={errors.nameOnCard?.message}
            {...register('nameOnCard', {
              required: 'Name on card is required',
              maxLength: { value: 120, message: 'Name is too long' },
            })}
          />
          <Input
            label="Card number"
            required
            inputMode="numeric"
            autoComplete="cc-number"
            hint="Digits only — never stored in full"
            error={errors.cardNumber?.message}
            {...register('cardNumber', {
              required: 'Card number is required',
              validate: (value) => {
                const digits = digitsOnly(value);
                if (digits.length < 13 || digits.length > 19) {
                  return 'Enter a valid card number (13–19 digits)';
                }
                return true;
              },
            })}
          />
          <div className={styles.row}>
            <Input
              label="Expiry (MM/YY)"
              required
              autoComplete="cc-exp"
              placeholder="MM/YY"
              error={errors.expiry?.message}
              {...register('expiry', {
                required: 'Expiry is required',
                pattern: {
                  value: /^(0[1-9]|1[0-2])\/\d{2}$/,
                  message: 'Use MM/YY format',
                },
              })}
            />
            <Input
              label="CVC"
              required
              inputMode="numeric"
              autoComplete="cc-csc"
              error={errors.cvc?.message}
              {...register('cvc', {
                required: 'CVC is required',
                pattern: {
                  value: /^\d{3,4}$/,
                  message: 'Enter a 3–4 digit CVC',
                },
              })}
            />
          </div>
        </>
      ) : (
        <p className={styles.paypalNote} role="status">
          You will confirm payment with PayPal on the review step. No card
          details are required.
        </p>
      )}

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Continue to review
        </Button>
      </div>
    </form>
  );
}
