import { SelectHTMLAttributes } from "react";

export function Select({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={[
        "w-full border border-[var(--line)] bg-[var(--surface-3)] px-3 py-2.5 text-sm text-ink",
        "transition focus:border-gold-deep focus:outline-none focus:ring-1 focus:ring-[var(--brand-200)] disabled:cursor-not-allowed disabled:opacity-60",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
