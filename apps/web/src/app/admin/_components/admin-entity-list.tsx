import { ReactNode } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

type EntityListProps<T extends { id: number }> = {
  items: T[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  search: string;
  onSearch: (value: string) => void;
  searchPlaceholder: string;
  emptyText: string;
  renderItem: (item: T) => ReactNode;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
};

export function EntityList<T extends { id: number }>({
  items,
  selectedId,
  onSelect,
  search,
  onSearch,
  searchPlaceholder,
  emptyText,
  renderItem,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: EntityListProps<T>) {
  return (
    <div className="space-y-4">
      <Input
        type="search"
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        placeholder={searchPlaceholder}
      />

      <div className="max-h-[36rem] space-y-2 overflow-y-auto pr-1">
        {items.length > 0 ? (
          items.map((item) => {
            const selected = selectedId === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                aria-pressed={selected}
                className={[
                  'flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-400)]',
                  selected
                    ? 'border-[var(--brand-400)] bg-[color-mix(in_oklab,var(--brand-500)_10%,var(--surface))] shadow-[0_0_0_1px_color-mix(in_oklab,var(--brand-400)_38%,transparent)]'
                    : 'border-[var(--line)] bg-[var(--surface-2)]/75 hover:border-[var(--line-strong)] hover:bg-[var(--surface)]',
                ].join(' ')}
              >
                {renderItem(item)}
              </button>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface-2)]/60 px-4 py-8 text-sm text-[var(--ink-500)]">
            {emptyText}
          </div>
        )}
      </div>

      {hasMore && onLoadMore ? (
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={onLoadMore}
          disabled={isLoadingMore}
        >
          {isLoadingMore ? 'Cargando...' : 'Cargar más'}
        </Button>
      ) : null}
    </div>
  );
}
