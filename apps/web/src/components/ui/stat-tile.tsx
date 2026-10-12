import { CSSProperties, ReactNode } from "react";
import { Skeleton } from "./skeleton";

type StatTileProps = {
  label: string;
  /** `null` muestra el estado de carga. */
  value: ReactNode | null;
  caption: string;
  /** Color de la escuadra superior izquierda. */
  accent?: string;
};

export function StatTile({
  label,
  value,
  caption,
  accent = "var(--gold)",
}: StatTileProps) {
  return (
    <div
      style={{ "--acc": accent } as CSSProperties}
      className="relative border border-line-soft surface-inset px-4 py-3.5 before:absolute before:left-0 before:top-0 before:size-[18px] before:border-l-2 before:border-t-2 before:border-[var(--acc)]"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted">
        {label}
      </p>
      {value === null ? (
        <Skeleton className="mt-2.5 h-[38px] w-16" />
      ) : (
        <p className="mt-1.5 text-[38px] font-extrabold leading-[1.2] tracking-[-0.02em] text-ink">
          {value}
        </p>
      )}
      <p className="mt-0.5 text-[11px] text-muted">{caption}</p>
    </div>
  );
}
