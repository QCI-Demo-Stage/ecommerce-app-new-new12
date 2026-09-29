import { Link } from 'react-router-dom';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  return (
    <div className={styles.wrap} role="alert">
      <h1 className={styles.title}>Page not found</h1>
      <p>The page you requested does not exist.</p>
      <Link className={styles.link} to="/products">
        Return to catalog
      </Link>
    </div>
  );
}
