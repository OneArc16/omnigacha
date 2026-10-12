"use client";

import {
  formatTabIndex,
  getTabClassName,
  getTabIndexClassName,
  TAB_HINT_CLASSNAME,
  TAB_LIST_CLASSNAME,
} from "./tab-styles";

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
  const activeOption = options.find((option) => option.value === value);

  return (
    <div role="tablist" className={`${TAB_LIST_CLASSNAME} ${className}`.trim()}>
      {options.map((option, index) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onValueChange(option.value)}
            className={getTabClassName(isActive)}
          >
            <span className={getTabIndexClassName(isActive)}>
              {formatTabIndex(index)}
            </span>
            {option.label}
          </button>
        );
      })}

      {activeOption?.description ? (
        <p className={TAB_HINT_CLASSNAME}>
          {activeOption.label} · {activeOption.description}
        </p>
      ) : null}
    </div>
  );
}
