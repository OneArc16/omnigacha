import { ReactNode } from "react";

type BoxProps = {
  children: ReactNode;
  className?: string;
};

/** Caja interior de panel: borde tenue sobre fondo hundido. */
export function Inset({ children, className = "" }: BoxProps) {
  return (
    <div className={`border border-line-soft surface-inset p-4 ${className}`.trim()}>
      {children}
    </div>
  );
}

export function EmptyState({ children, className = "" }: BoxProps) {
  return (
    <div
      className={`border border-dashed border-[var(--line-strong)] surface-inset p-5 text-sm text-muted ${className}`.trim()}
    >
      {children}
    </div>
  );
}

/** Rótulo en mayúsculas espaciadas que encabeza cajas y métricas. */
export function Eyebrow({ children, className = "" }: BoxProps) {
  return (
    <p
      className={`text-[10px] font-semibold uppercase tracking-[0.24em] text-muted ${className}`.trim()}
    >
      {children}
    </p>
  );
}
