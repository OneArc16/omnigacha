import { ReactNode } from 'react';

type BadgeVariant =
  | 'neutral'
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'outline';

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

const variantClass: Record<BadgeVariant, string> = {
  neutral:
    'bg-[var(--surface-elevated)] text-[var(--ink-800)] ring-[var(--line)]',
  brand:
    'bg-cyan-500/15 text-cyan-300 ring-cyan-500/35',
  success:
    'bg-emerald-500/15 text-emerald-300 ring-emerald-500/35',
  warning:
    'bg-amber-500/15 text-amber-300 ring-amber-500/35',
  danger:
    'bg-rose-500/15 text-rose-300 ring-rose-500/35',
  outline: 'bg-transparent text-[var(--ink-700)] ring-[var(--line-strong)]',
};

export function Badge({
  children,
  variant = 'neutral',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1',
        variantClass[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
