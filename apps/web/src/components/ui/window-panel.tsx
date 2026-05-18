import { ReactNode } from "react";

type WindowPanelProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
};

export function WindowPanel({
  title,
  subtitle,
  children,
  className = "",
  action,
}: WindowPanelProps) {
  return (
    <section
      className={[
        "overflow-hidden rounded-[28px] border border-[var(--line)] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--surface-elevated)_50%,transparent),color-mix(in_oklab,var(--surface)_88%,transparent))] shadow-[0_20px_50px_-30px_rgba(2,8,23,.85)]",
        className,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] bg-[var(--surface)]/80 px-5 py-4">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <h2 className="text-base font-semibold tracking-tight text-[var(--ink-900)]">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-[var(--ink-500)]">{subtitle}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="px-5 py-5">{children}</div>
    </section>
  );
}
