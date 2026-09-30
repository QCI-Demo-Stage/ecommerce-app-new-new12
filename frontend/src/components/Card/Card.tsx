import type {
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
} from 'react';
import styles from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** Card heading */
  title?: string;
  /** Supporting text under the title */
  subtitle?: string;
  /** Main body content */
  children?: ReactNode;
  /** Actions / metadata row */
  footer?: ReactNode;
  /** When true, card is focusable and styled as interactive */
  interactive?: boolean;
  /** Heading level for the title (defaults to 2) */
  headingLevel?: 2 | 3 | 4;
}

/**
 * Content card for catalog tiles and interactive groupings.
 * Cards are reserved for interactive / structured content containers.
 */
export function Card({
  title,
  subtitle,
  children,
  footer,
  interactive = false,
  headingLevel = 2,
  className,
  onClick,
  ...rest
}: CardProps) {
  const classNames = [
    styles.card,
    interactive ? styles.interactive : undefined,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const HeadingTag = `h${headingLevel}` as const;
  const hasHeader = Boolean(title || subtitle);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!interactive || !onClick) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(event as unknown as MouseEvent<HTMLElement>);
    }
  };

  return (
    <article
      className={classNames}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? onClick : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      {...rest}
    >
      {hasHeader ? (
        <header className={styles.header}>
          {title ? <HeadingTag className={styles.title}>{title}</HeadingTag> : null}
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </header>
      ) : null}
      {children ? <div className={styles.body}>{children}</div> : null}
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </article>
  );
}
