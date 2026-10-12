import { forwardRef, TextareaHTMLAttributes } from 'react';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className = '', ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={[
        'min-h-28 w-full border border-[var(--line)] bg-[var(--surface-3)] px-3 py-2.5 text-sm text-ink placeholder:text-dim',
        'transition focus:border-gold-deep focus:outline-none focus:ring-1 focus:ring-[var(--brand-200)]',
        className,
      ].join(' ')}
      {...props}
    />
  );
});
