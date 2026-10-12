import { ReactNode } from 'react';

export type BadgeVariant =
  | 'neutral'
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'outline';

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  /** Antepone el rombo de estado del color de la variante. */
  dot?: boolean;
  className?: string;
};

const variantClass: Record<BadgeVariant, string> = {
  neutral: 'bg-[var(--surface-elevated)] text-[var(--ink-800)] border-[var(--line)]',
  brand: 'bg-gold/10 text-gold border-gold/40',
  success: 'bg-success/10 text-success border-success/40',
  warning: 'bg-warning/10 text-warning border-warning/40',
  danger: 'bg-danger/10 text-danger border-danger/40',
  outline: 'bg-transparent text-[var(--ink-700)] border-[var(--line-strong)]',
};

export function Badge({
  children,
  variant = 'neutral',
  dot = false,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex min-w-0 max-w-full items-center gap-1.5 truncate border px-2.5 py-[5px] text-[11px] font-bold uppercase tracking-[0.08em]',
        variantClass[variant],
        className,
      ].join(' ')}
    >
      {dot ? (
        <span aria-hidden className="size-1.5 shrink-0 rotate-45 bg-current" />
      ) : null}
      {children}
    </span>
  );
}

type TagProps = {
  children: ReactNode;
  className?: string;
};

/** Etiqueta dorada de cabecera de panel (p. ej. "En vivo"). */
export function Tag({ children, className = '' }: TagProps) {
  return (
    <span
      className={`inline-flex border border-gold/35 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold ${className}`.trim()}
    >
      {children}
    </span>
  );
}
