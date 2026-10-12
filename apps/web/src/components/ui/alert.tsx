import { ReactNode } from 'react';

type AlertProps = {
  tone: 'error' | 'success';
  children: ReactNode;
};

export function Alert({ tone, children }: AlertProps) {
  const palette =
    tone === 'error'
      ? 'border-danger/40 bg-danger/10 text-danger'
      : 'border-success/40 bg-success/10 text-success';
  const accent = tone === 'error' ? 'bg-danger' : 'bg-success';
  const icon = tone === 'error' ? '!' : 'ok';

  return (
    <p
      role="status"
      aria-live="polite"
      className={`flex items-center gap-3 border px-4 py-3 text-sm ${palette}`}
    >
      <span
        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center text-[11px] font-bold uppercase text-[#0b0f20] ${accent}`}
      >
        {icon}
      </span>
      <span>{children}</span>
    </p>
  );
}
