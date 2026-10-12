import { ReactNode } from "react";

type FieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
};

/** Etiqueta + control + ayuda opcional para formularios de edición. */
export function Field({ label, hint, children, className = "" }: FieldProps) {
  return (
    <label className={`block space-y-1.5 ${className}`.trim()}>
      <span className="text-xs font-medium text-[var(--ink-700)]">{label}</span>
      {children}
      {hint ? <span className="block text-[11px] text-muted">{hint}</span> : null}
    </label>
  );
}
