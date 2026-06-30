import { forwardRef, TextareaHTMLAttributes } from 'react';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className = '', ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={[
        'min-h-28 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-3)] px-3 py-2.5 text-sm text-[var(--ink-900)] placeholder:text-[var(--ink-400)]',
        'transition focus:border-[var(--brand-500)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-200)]',
        className,
      ].join(' ')}
      {...props}
    />
  );
});
