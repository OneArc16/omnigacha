import { InputHTMLAttributes } from 'react';

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={[
        'w-full rounded-xl border border-[var(--line)] bg-[var(--surface-3)] px-3 py-2.5 text-sm text-[var(--ink-900)] placeholder:text-[var(--ink-400)]',
        'transition focus:border-[var(--brand-500)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-200)]',
        className,
      ].join(' ')}
      {...props}
    />
  );
}
