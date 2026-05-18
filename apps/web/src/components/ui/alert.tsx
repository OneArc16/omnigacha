import { ReactNode } from 'react';

type AlertProps = {
  tone: 'error' | 'success';
  children: ReactNode;
};

export function Alert({ tone, children }: AlertProps) {
  const palette =
    tone === 'error'
      ? 'border-rose-500/40 bg-rose-500/10 text-rose-200'
      : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200';
  const accent = tone === 'error' ? 'bg-rose-400' : 'bg-emerald-400';
  const icon = tone === 'error' ? '!' : 'ok';

  return (
    <p
      role="status"
      aria-live="polite"
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-[0_8px_24px_-18px_rgba(0,0,0,.65)] ${palette}`}
    >
      <span
        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold uppercase text-slate-950 ${accent}`}
      >
        {icon}
      </span>
      <span>{children}</span>
    </p>
  );
}
