export type CursorPage<T> = {
  items: T[];
  nextCursor: number | null;
};

export function paginateByCursor<T extends { id: number }>(
  rows: T[],
  limit: number,
): CursorPage<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  return {
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}
