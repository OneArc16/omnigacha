import { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'ghost';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function getButtonClassName({
  className = '',
  variant = 'primary',
}: {
  className?: string;
  variant?: ButtonVariant;
}) {
  const base =
    'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 will-change-transform active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-60';

  const variants = {
    primary:
      'bg-gradient-to-r from-[var(--brand-600)] to-[var(--brand-500)] text-white shadow-[0_10px_24px_-14px_rgba(3,105,161,.95)] hover:brightness-110 focus-visible:ring-[var(--brand-400)]',
    ghost:
      'bg-[var(--surface)] text-[var(--ink-700)] ring-1 ring-[var(--line-strong)] hover:bg-[var(--surface-2)] hover:text-[var(--ink-900)] focus-visible:ring-[var(--ink-500)]',
  };

  return `${base} ${variants[variant]} ${className}`.trim();
}

export function Button({
  className = '',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={getButtonClassName({ className, variant })}
      {...props}
    />
  );
}
