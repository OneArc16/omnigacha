'use client';

import { KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Input } from './input';

export type ComboboxOption = {
  value: string;
  label: string;
  searchText?: string;
  disabled?: boolean;
};

type ComboboxProps = {
  options: ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  allowClear?: boolean;
};

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
}

function matchesSearch(searchSource: string, query: string) {
  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) {
    return true;
  }

  const sourceTokens = tokenize(searchSource);

  return queryTokens.every((queryToken) =>
    sourceTokens.some((sourceToken) => sourceToken.startsWith(queryToken)),
  );
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder = 'Buscar...',
  emptyText = 'No hay resultados.',
  disabled = false,
  className = '',
  allowClear = true,
}: ComboboxProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    if (!query.trim()) {
      return options;
    }

    return options.filter((option) => {
      if (!option.searchText) {
        return false;
      }

      return matchesSearch(option.searchText, query);
    });
  }, [options, query]);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const nextOption = optionRefs.current[highlightedIndex];
    if (!nextOption) return;

    nextOption.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex, isOpen]);

  function open() {
    if (disabled) return;
    setIsOpen(true);
    setQuery('');
    setHighlightedIndex(0);
  }

  function close() {
    setIsOpen(false);
    setQuery('');
    setHighlightedIndex(0);
  }

  function selectOption(nextValue: string) {
    onValueChange(nextValue);
    close();
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!isOpen && (event.key === 'ArrowDown' || event.key === 'Enter')) {
      event.preventDefault();
      open();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    if (event.key === 'Tab') {
      close();
      return;
    }

    if (!filteredOptions.length) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((current) =>
        current >= filteredOptions.length - 1 ? 0 : current + 1,
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((current) =>
        current <= 0 ? filteredOptions.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const highlightedOption = filteredOptions[highlightedIndex];
      if (highlightedOption) {
        selectOption(highlightedOption.value);
      }
    }
  }

  const inputValue = isOpen ? query : selectedOption?.label ?? '';
  const inputPlaceholder = isOpen
    ? selectedOption?.label ?? searchPlaceholder
    : placeholder;

  return (
    <div ref={rootRef} className={`relative ${className}`.trim()}>
      <Input
        ref={inputRef}
        value={inputValue}
        placeholder={inputPlaceholder}
        className="pr-16"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-autocomplete="list"
        role="combobox"
        onFocus={() => {
          if (!isOpen) {
            open();
          }
        }}
        onClick={() => {
          if (!isOpen) {
            open();
          }
        }}
        onChange={(event) => {
          if (!isOpen) {
            open();
          }

          setQuery(event.target.value);
          setHighlightedIndex(0);
        }}
        onKeyDown={handleSearchKeyDown}
        disabled={disabled}
      />

      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center gap-2">
        {allowClear && value && !disabled ? (
          <button
            type="button"
            className="pointer-events-auto inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-[var(--ink-500)] transition hover:bg-[var(--surface)] hover:text-[var(--ink-900)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-200)]"
            aria-label="Limpiar selección"
            onClick={(event) => {
              event.stopPropagation();
              onValueChange('');
              close();
            }}
          >
            x
          </button>
        ) : null}
        <span
          className="text-xs font-semibold text-[var(--ink-500)]"
          aria-hidden="true"
        >
          v
        </span>
      </div>

      {isOpen ? (
        <div
          className="absolute z-40 mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[0_24px_60px_-28px_rgba(2,6,23,0.9)]"
          role="dialog"
          aria-label="Selector con autocompletado"
        >
          <div
            id={listboxId}
            role="listbox"
            className="max-h-72 overflow-y-auto p-2"
          >
            {filteredOptions.length ? (
              filteredOptions.map((option, index) => {
                const isSelected = option.value === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={option.value}
                    ref={(node) => {
                      optionRefs.current[index] = node;
                    }}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    className={[
                      'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition',
                      isHighlighted
                        ? 'bg-[var(--surface-2)] text-[var(--ink-900)]'
                        : 'text-[var(--ink-700)] hover:bg-[var(--surface-2)] hover:text-[var(--ink-900)]',
                      isSelected
                        ? 'ring-1 ring-[var(--brand-400)]'
                        : 'ring-1 ring-transparent',
                      option.disabled ? 'cursor-not-allowed opacity-50' : '',
                    ].join(' ')}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => selectOption(option.value)}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected ? (
                      <span className="ml-3 text-[10px] font-semibold uppercase tracking-wide text-[var(--brand-500)]">
                        Activo
                      </span>
                    ) : null}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-4 text-sm text-[var(--ink-500)]">
                {emptyText}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
