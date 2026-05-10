import { ReactNode } from 'react';

type AlertProps = {
  tone: 'error' | 'success';
  children: ReactNode;
};

export function Alert({ tone, children }: AlertProps) {
  const palette =
    tone === 'error'
      ? 'border-red-300/70 bg-red-50 text-red-800'
      : 'border-emerald-300/70 bg-emerald-50 text-emerald-800';

  return <p className={`rounded-xl border px-4 py-3 text-sm ${palette}`}>{children}</p>;
}
