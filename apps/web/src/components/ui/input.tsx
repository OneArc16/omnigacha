import { forwardRef, InputHTMLAttributes } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = '', ...props }, ref) {
    return (
      <input
        ref={ref}
        className={[
          'w-full border border-[var(--line)] bg-[var(--surface-3)] px-3 py-2.5 text-sm text-ink placeholder:text-dim',
          'transition focus:border-gold-deep focus:outline-none focus:ring-1 focus:ring-[var(--brand-200)] disabled:cursor-not-allowed disabled:opacity-60',
          className,
        ].join(' ')}
        {...props}
      />
    );
  },
);
