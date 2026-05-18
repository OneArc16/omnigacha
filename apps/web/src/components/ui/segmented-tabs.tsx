"use client";

type SegmentedTabOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

type SegmentedTabsProps<T extends string> = {
  value: T;
  onValueChange: (value: T) => void;
  options: SegmentedTabOption<T>[];
  className?: string;
};

export function SegmentedTabs<T extends string>({
  value,
  onValueChange,
  options,
  className = "",
}: SegmentedTabsProps<T>) {
  return (
    <div
      className={[
        "inline-flex w-full flex-wrap gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)]/90 p-2",
        className,
      ].join(" ")}
    >
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onValueChange(option.value)}
            className={[
              "min-w-0 flex-1 rounded-xl px-4 py-3 text-left transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-400)]",
              isActive
                ? "bg-[linear-gradient(135deg,color-mix(in_oklab,var(--brand-500)_22%,transparent),color-mix(in_oklab,var(--surface)_76%,transparent))] text-[var(--ink-900)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--brand-400)_45%,transparent)]"
                : "text-[var(--ink-600)] hover:bg-[var(--surface)] hover:text-[var(--ink-900)]",
            ].join(" ")}
            aria-pressed={isActive}
          >
            <span className="block text-sm font-semibold tracking-tight">
              {option.label}
            </span>
            {option.description ? (
              <span className="mt-1 block text-xs text-[var(--ink-500)]">
                {option.description}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
