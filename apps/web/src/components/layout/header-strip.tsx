import { ReactNode } from 'react';
import { Frame } from '../ui/frame';
import { Skeleton } from '../ui/skeleton';

const STRIP_INNER_CLASSNAME =
  'flex min-h-[82px] flex-wrap items-center gap-x-6 gap-y-4 py-4 pl-[26px] pr-[22px] xl:flex-nowrap xl:py-0';

type HeaderStripProps = {
  /** Inicial o símbolo que se muestra dentro del rombo. */
  glyph: string;
  eyebrow: string;
  title: string;
  description: string;
  /** Chips y acciones alineados a la derecha. */
  children?: ReactNode;
};

/** Franja de cabecera de página: identidad a la izquierda, chips y acciones a la derecha. */
export function HeaderStrip({
  glyph,
  eyebrow,
  title,
  description,
  children,
}: HeaderStripProps) {
  return (
    <Frame fill="strip" innerClassName={STRIP_INNER_CLASSNAME}>
      <div className="grid size-12 shrink-0 rotate-45 place-items-center border border-gold-deep bg-[radial-gradient(circle_at_50%_35%,#2c3a7a,#121a3a)]">
        <span className="-rotate-45 text-sm font-bold text-gold">{glyph}</span>
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold">
          {eyebrow}
        </p>
        <h1 className="mt-[3px] text-[19px] font-bold tracking-[0.01em] text-ink">
          {title}
        </h1>
        <p className="mt-0.5 text-xs text-muted">{description}</p>
      </div>

      {children}
    </Frame>
  );
}

export function HeaderStripChips({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2.5 xl:ml-auto">{children}</div>;
}

type HeaderStripChipProps = {
  label: string;
  value: ReactNode;
  highlight?: boolean;
};

export function HeaderStripChip({
  label,
  value,
  highlight = false,
}: HeaderStripChipProps) {
  return (
    <div className="flex min-w-[150px] flex-col gap-0.5 border border-line-soft surface-inset px-3.5 py-2 text-xs text-muted">
      {label}
      <b
        className={
          highlight
            ? 'text-[15px] font-semibold text-gold'
            : 'truncate text-[13px] font-semibold text-ink'
        }
      >
        {value}
      </b>
    </div>
  );
}

export function HeaderStripDivider() {
  return (
    <div
      aria-hidden
      className="hidden h-11 w-px bg-[linear-gradient(transparent,var(--line-gold),transparent)] xl:block"
    />
  );
}

export function HeaderStripActions({ children }: { children: ReactNode }) {
  return <div className="flex gap-2.5">{children}</div>;
}

export function HeaderStripSkeleton() {
  return (
    <Frame fill="strip" innerClassName={STRIP_INNER_CLASSNAME}>
      <Skeleton className="size-12 shrink-0 rotate-45" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-5 w-64" />
      </div>
    </Frame>
  );
}
