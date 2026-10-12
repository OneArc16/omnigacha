export function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function matchesQuery(source: string[], query: string) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return true;
  }

  return source.some((value) => normalizeText(value).includes(normalizedQuery));
}

export function upsertById<T extends { id: number }>(items: T[], item: T) {
  const next = items.filter((current) => current.id !== item.id);
  next.push(item);
  next.sort((left, right) => left.id - right.id);
  return next;
}

export function formatDateTime(value?: string) {
  if (!value) return 'sin fecha';

  return new Date(value).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
