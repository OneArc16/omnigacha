import { ReactNode } from 'react';

export const SELECT_CLASSNAME =
  'w-full rounded-xl border border-[var(--line)] bg-[var(--surface-3)] px-3 py-2.5 text-sm text-[var(--ink-900)] placeholder:text-[var(--ink-400)] transition focus:border-[var(--brand-500)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-200)]';

type FieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
};

export function Field({ label, hint, children, className = '' }: FieldProps) {
  return (
    <label className={['block space-y-2', className].join(' ')}>
      <span className="text-sm font-semibold text-[var(--ink-900)]">
        {label}
      </span>
      {children}
      {hint ? <span className="block text-xs text-[var(--ink-500)]">{hint}</span> : null}
    </label>
  );
}

type CheckboxFieldProps = {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
};

export function CheckboxField({
  name,
  label,
  hint,
  defaultChecked = false,
}: CheckboxFieldProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)]/70 p-4 transition hover:border-[var(--line-strong)]">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-1 h-4 w-4 rounded border-[var(--line)] bg-[var(--surface-3)] text-[var(--brand-500)] focus:ring-[var(--brand-200)]"
      />
      <span className="space-y-1">
        <span className="block text-sm font-semibold text-[var(--ink-900)]">
          {label}
        </span>
        {hint ? <span className="block text-xs text-[var(--ink-500)]">{hint}</span> : null}
      </span>
    </label>
  );
}
