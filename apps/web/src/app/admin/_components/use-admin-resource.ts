'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { apiRequest, CursorPage } from '../../../lib/api';
import { resolveErrorMessage } from '../../../lib/errors';
import { matchesQuery, upsertById } from './admin-utils';

const PAGE_SIZE = 25;

export type AdminResourceLabels = {
  loadError: string;
  loadMoreError: string;
  created: string;
  updated: string;
  saveError: string;
  archived?: string;
  archiveError?: string;
};

type AdminResourceOptions<T> = {
  accessToken: string;
  /** Colección REST, p. ej. `/admin/characters`. */
  path: string;
  /** Filtro fijo de la colección, p. ej. `type=ARTIFACT`. */
  query?: string;
  /** Textos de un registro contra los que se compara la búsqueda. Debe ser estable. */
  searchFields: (item: T) => string[];
  labels: AdminResourceLabels;
};

/**
 * Colección administrable paginada por cursor: carga, búsqueda local,
 * selección y las mutaciones de guardar (crear o editar) y archivar.
 */
export function useAdminResource<T extends { id: number; name: string }>({
  accessToken,
  path,
  query = '',
  searchFields,
  labels,
}: AdminResourceOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const collectionUrl = `${path}?${query ? `${query}&` : ''}limit=${PAGE_SIZE}`;
  const { loadError } = labels;

  useEffect(() => {
    let active = true;

    apiRequest<CursorPage<T>>(collectionUrl, { token: accessToken })
      .then((page) => {
        if (!active) return;
        setItems(page.items);
        setNextCursor(page.nextCursor);
      })
      .catch((err: unknown) => {
        if (active) setError(resolveErrorMessage(err, loadError));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken, collectionUrl, loadError]);

  const visibleItems = useMemo(
    () => items.filter((item) => matchesQuery(searchFields(item), search)),
    [items, search, searchFields],
  );

  const selected = items.find((item) => item.id === selectedId) ?? null;

  /** Inserta o reemplaza un registro devuelto por la API y lo deja seleccionado. */
  function upsert(item: T) {
    setItems((current) => upsertById(current, item));
    setSelectedId(item.id);
  }

  async function loadMore() {
    if (nextCursor === null) return;

    setIsLoadingMore(true);
    try {
      const page = await apiRequest<CursorPage<T>>(
        `${collectionUrl}&cursor=${nextCursor}`,
        { token: accessToken },
      );
      setItems((current) => [...current, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch (err) {
      toast.error(resolveErrorMessage(err, labels.loadMoreError));
    } finally {
      setIsLoadingMore(false);
    }
  }

  /**
   * Crea o edita según haya selección. `buildPayload` se evalúa aquí dentro
   * para que sus errores de validación se muestren igual que los de la API.
   */
  async function save(buildPayload: () => Record<string, unknown>) {
    setIsSaving(true);

    try {
      const saved = await apiRequest<T>(selected ? `${path}/${selected.id}` : path, {
        method: selected ? 'PATCH' : 'POST',
        token: accessToken,
        body: buildPayload(),
      });

      upsert(saved);
      toast.success(selected ? labels.updated : labels.created);
      return saved;
    } catch (err) {
      toast.error(resolveErrorMessage(err, labels.saveError));
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function archive() {
    if (!selected || !window.confirm(`¿Archivar a ${selected.name}?`)) return;

    setIsSaving(true);

    try {
      const archived = await apiRequest<T>(`${path}/${selected.id}`, {
        method: 'DELETE',
        token: accessToken,
      });

      upsert(archived);
      toast.success(labels.archived ?? 'Registro archivado.');
    } catch (err) {
      toast.error(
        resolveErrorMessage(err, labels.archiveError ?? 'No fue posible archivar.'),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return {
    accessToken,
    path,
    items,
    visibleItems,
    isLoading,
    error,
    hasMore: nextCursor !== null,
    isLoadingMore,
    loadMore,
    search,
    setSearch,
    selected,
    selectedId,
    select: setSelectedId,
    clearSelection: () => setSelectedId(null),
    upsert,
    isSaving,
    save,
    archive,
  };
}

export type AdminResource<T extends { id: number; name: string }> = ReturnType<
  typeof useAdminResource<T>
>;
