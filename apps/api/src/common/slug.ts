export function slugify(value: string) {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return slug || 'item';
}

export async function generateUniqueSlug(
  value: string,
  isTaken: (slug: string) => Promise<boolean>,
  fallbackPrefix = 'item',
) {
  const baseSlug = slugify(value) || fallbackPrefix;

  if (!(await isTaken(baseSlug))) {
    return baseSlug;
  }

  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const nextSlug = `${baseSlug}-${suffix}`;
    if (!(await isTaken(nextSlug))) {
      return nextSlug;
    }
  }

  return `${baseSlug}-${Date.now()}`;
}
