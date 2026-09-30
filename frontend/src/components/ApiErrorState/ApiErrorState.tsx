import { Link } from 'react-router-dom';
import { Button } from '../Button';
import styles from './ApiErrorState.module.css';

export interface ApiErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

/**
 * Accessible error panel for failed API loads on account screens.
 */
export function ApiErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: ApiErrorStateProps) {
  return (
    <div className={styles.wrap} role="alert">
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        {onRetry ? (
          <Button type="button" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
        <Link className={styles.link} to="/products">
          Return to catalog
        </Link>
      </div>
    </div>
  );
}
