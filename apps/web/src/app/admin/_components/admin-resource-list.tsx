import { ReactNode } from 'react';
import { Alert } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { EmptyState } from '../../../components/ui/inset';
import { Skeleton } from '../../../components/ui/skeleton';
import { WindowPanel } from '../../../components/ui/window-panel';
import type { AdminResource } from './use-admin-resource';

type ResourceListPanelProps<T extends { id: number; name: string }> = {
  title: string;
  subtitle: string;
  resource: AdminResource<T>;
  searchPlaceholder: string;
  emptyText: string;
  renderItem: (item: T) => ReactNode;
  /** Aviso opcional sobre la lista (p. ej. riesgos operativos). */
  notice?: ReactNode;
};

const ITEM_CLASSNAME =
  'flex w-full items-start gap-3 border px-4 py-3 text-left transition focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-gold';

/** Panel izquierdo de un editor: búsqueda, lista seleccionable y paginación. */
export function ResourceListPanel<T extends { id: number; name: string }>({
  title,
  subtitle,
  resource,
  searchPlaceholder,
  emptyText,
  renderItem,
  notice,
}: ResourceListPanelProps<T>) {
  const { visibleItems, selectedId } = resource;

  return (
    <WindowPanel
      title={title}
      subtitle={subtitle}
      action={
        <div className="flex items-center gap-2">
          <Badge variant="neutral">{visibleItems.length} visibles</Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resource.clearSelection}
          >
            + Nuevo
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {resource.error ? <Alert tone="error">{resource.error}</Alert> : null}
        {notice}

        <Input
          type="search"
          value={resource.search}
          onChange={(event) => resource.setSearch(event.target.value)}
          placeholder={searchPlaceholder}
        />

        {resource.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : visibleItems.length === 0 ? (
          <EmptyState>{emptyText}</EmptyState>
        ) : (
          <div className="max-h-[36rem] space-y-2 overflow-y-auto pr-1">
            {visibleItems.map((item) => {
              const isSelected = selectedId === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => resource.select(item.id)}
                  aria-pressed={isSelected}
                  className={`${ITEM_CLASSNAME} ${
                    isSelected
                      ? 'border-gold/60 bg-gold/[0.05]'
                      : 'border-line-soft surface-inset hover:border-[var(--line-strong)]'
                  }`}
                >
                  {renderItem(item)}
                </button>
              );
            })}
          </div>
        )}

        {resource.hasMore ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={resource.loadMore}
            disabled={resource.isLoadingMore}
          >
            {resource.isLoadingMore ? 'Cargando...' : 'Cargar más'}
          </Button>
        ) : null}
      </div>
    </WindowPanel>
  );
}
