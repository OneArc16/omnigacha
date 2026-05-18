import { ReactNode } from 'react';

type CardProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  id?: string;
};

export function Card({
  title,
  subtitle,
  children,
  className = '',
  id,
}: CardProps) {
  return (
    <section
      id={id}
      className={[
        'rounded-2xl border border-[var(--line)] bg-[var(--surface)]/95 p-5 shadow-[0_16px_42px_-28px_rgba(2,8,23,.85)] backdrop-blur-sm',
        'transition-colors duration-200 hover:border-[var(--line-strong)]',
        className,
      ].join(' ')}
    >
      {title ? <h2 className="text-lg font-semibold tracking-tight text-[var(--ink-900)]">{title}</h2> : null}
      {subtitle ? <p className="mt-1 text-sm text-[var(--ink-500)]">{subtitle}</p> : null}
      <div className={title || subtitle ? 'mt-4' : ''}>{children}</div>
    </section>
  );
}
