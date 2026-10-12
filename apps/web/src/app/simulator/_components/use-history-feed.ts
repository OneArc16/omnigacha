'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiRequest, CursorPage } from '../../../lib/api';
import { resolveErrorMessage } from '../../../lib/errors';

const PAGE_SIZE = 5;

type HistoryFeedOptions = {
  /** Endpoint paginado por cursor, sin query string. */
  path: string;
  accessToken: string;
  loadMoreErrorMessage: string;
};

/** Lista paginada por cursor: carga inicial, recarga completa y "cargar más". */
export function useHistoryFeed<T>({
  path,
  accessToken,
  loadMoreErrorMessage,
}: HistoryFeedOptions) {
  const [items, setItems] = useState<T[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchPage = useCallback(
    (cursor: number | null) =>
      apiRequest<CursorPage<T>>(
        `${path}?limit=${PAGE_SIZE}${cursor ? `&cursor=${cursor}` : ''}`,
        { token: accessToken },
      ),
    [path, accessToken],
  );

  const reload = useCallback(async () => {
    const page = await fetchPage(null);
    setItems(page.items);
    setNextCursor(page.nextCursor);
  }, [fetchPage]);

  useEffect(() => {
    let active = true;

    fetchPage(null)
      .then((page) => {
        if (!active) return;
        setItems(page.items);
        setNextCursor(page.nextCursor);
      })
      .catch((err: Error) => {
        if (active) toast.error(err.message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fetchPage]);

  async function loadMore() {
    if (!nextCursor) return;

    setIsLoadingMore(true);
    try {
      const page = await fetchPage(nextCursor);
      setItems((current) => [...current, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch (err) {
      toast.error(resolveErrorMessage(err, loadMoreErrorMessage));
    } finally {
      setIsLoadingMore(false);
    }
  }

  return {
    items,
    hasMore: nextCursor !== null,
    isLoading,
    isLoadingMore,
    reload,
    loadMore,
  };
}

export type HistoryFeed<T> = ReturnType<typeof useHistoryFeed<T>>;
