import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ChangeEvent,
} from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ApiErrorState } from '../components/ApiErrorState';
import { ApiError } from '../api/client';
import {
  fetchProfile,
  updateProfile,
  type PublicUser,
} from '../api/user';
import { AccountLayout } from './AccountLayout';
import styles from './ProfilePage.module.css';

interface ProfileFormState {
  firstName: string;
  lastName: string;
  email: string;
}

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(values: ProfileFormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.firstName.trim()) {
    errors.firstName = 'First name is required';
  } else if (values.firstName.trim().length > 100) {
    errors.firstName = 'First name must be at most 100 characters';
  }
  if (!values.lastName.trim()) {
    errors.lastName = 'Last name is required';
  } else if (values.lastName.trim().length > 100) {
    errors.lastName = 'Last name must be at most 100 characters';
  }
  if (!values.email.trim()) {
    errors.email = 'Email is required';
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Enter a valid email address';
  } else if (values.email.trim().length > 255) {
    errors.email = 'Email must be at most 255 characters';
  }
  return errors;
}

/**
 * Authenticated profile page with editable fields and PATCH /api/me save.
 */
export function ProfilePage() {
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [form, setForm] = useState<ProfileFormState>({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const user = await fetchProfile();
      setProfile(user);
      setForm({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Unable to load your profile.';
      setLoadError(message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    setSaveSuccess(null);
    setSaveError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveSuccess(null);
    setSaveError(null);

    const errors = validateForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setSaving(true);
    try {
      const result = await updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
      });
      setProfile(result.user);
      setForm({
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        email: result.user.email,
      });
      setSaveSuccess('Profile saved successfully.');
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Unable to save your profile.';
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AccountLayout>
      <header className={styles.header}>
        <h1 className={styles.title}>Your profile</h1>
        <p className={styles.lead}>
          Update your name and email. Changes are saved to your account.
        </p>
      </header>

      {loading ? (
        <p role="status" aria-live="polite">
          Loading profile…
        </p>
      ) : null}

      {loadError && !loading ? (
        <ApiErrorState
          title="Could not load profile"
          message={loadError}
          onRetry={() => {
            void loadProfile();
          }}
        />
      ) : null}

      {!loading && !loadError && profile ? (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <Input
            label="First name"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            required
            autoComplete="given-name"
            error={fieldErrors.firstName}
            disabled={saving}
          />
          <Input
            label="Last name"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            required
            autoComplete="family-name"
            error={fieldErrors.lastName}
            disabled={saving}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
            error={fieldErrors.email}
            disabled={saving}
          />

          {saveError ? (
            <p className={styles.error} role="alert">
              {saveError}
            </p>
          ) : null}
          {saveSuccess ? (
            <p className={styles.success} role="status" aria-live="polite">
              {saveSuccess}
            </p>
          ) : null}

          <div className={styles.actions}>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save profile'}
            </Button>
          </div>
        </form>
      ) : null}
    </AccountLayout>
  );
}
