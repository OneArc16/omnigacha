import { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
};

export function Button({ className = '', variant = 'primary', ...props }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-60';

  const variants = {
    primary:
      'bg-[var(--brand-600)] text-white shadow-sm hover:bg-[var(--brand-700)] focus-visible:ring-[var(--brand-400)]',
    ghost:
      'bg-transparent text-[var(--ink-700)] ring-1 ring-[var(--line-strong)] hover:bg-[var(--surface-2)] focus-visible:ring-[var(--ink-500)]',
  };

  return <button className={`${base} ${variants[variant]} ${className}`.trim()} {...props} />;
}
