import { ReactNode } from 'react';

type CardProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

export function Card({ title, subtitle, children, className = '' }: CardProps) {
  return (
    <section
      className={[
        'rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_8px_28px_-20px_rgba(0,0,0,.45)] backdrop-blur-sm',
        className,
      ].join(' ')}
    >
      {title ? <h2 className="text-lg font-semibold tracking-tight text-[var(--ink-900)]">{title}</h2> : null}
      {subtitle ? <p className="mt-1 text-sm text-[var(--ink-500)]">{subtitle}</p> : null}
      <div className={title || subtitle ? 'mt-4' : ''}>{children}</div>
    </section>
  );
}
