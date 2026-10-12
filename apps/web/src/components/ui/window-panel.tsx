import { ReactNode } from "react";
import { Diamond } from "./diamond";
import { Frame } from "./frame";

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
    <Frame className={className}>
      <section className="flex h-full flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-line-soft px-[22px] pb-3.5 pt-4">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2.5 text-base font-bold tracking-[0.02em] text-ink">
              <Diamond />
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-[3px] text-xs text-muted">{subtitle}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>

        <div className="flex-1 px-[22px] py-[18px]">{children}</div>
      </section>
    </Frame>
  );
}
