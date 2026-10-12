import type { BadgeVariant } from '../../../components/ui/badge';
import type { Character } from '../../../lib/api';
import { readNumber, readOptionalText, readRequiredText, readText } from './admin-form-utils';

/** Personajes, conos y relic sets comparten el mismo ciclo editorial. */
export type CatalogStatus = Character['status'];

export const CATALOG_STATUSES: CatalogStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

export function catalogStatusVariant(status: CatalogStatus): BadgeVariant {
  switch (status) {
    case 'PUBLISHED':
      return 'success';
    case 'ARCHIVED':
      return 'danger';
    case 'DRAFT':
    default:
      return 'warning';
  }
}

export function getStatusBadgeText(status: CatalogStatus) {
  switch (status) {
    case 'PUBLISHED':
      return 'Publicado';
    case 'ARCHIVED':
      return 'Archivado';
    case 'DRAFT':
    default:
      return 'Borrador';
  }
}

export function getRarityLabel(rarity: number) {
  return `${rarity}★`;
}

/** Lee los campos que comparten todos los formularios del catálogo. */
export function readCatalogBasePayload(formData: FormData) {
  const slug = readOptionalText(formData, 'slug');

  return {
    name: readRequiredText(formData, 'name', 'Nombre'),
    rarity: readNumber(formData, 'rarity', 'Rareza', { integer: true, min: 1, max: 5 }),
    status: readText(formData, 'status') || 'DRAFT',
    ...(slug ? { slug } : {}),
  };
}

/** Devuelve `{ [field]: valor }` solo si el campo opcional trae texto. */
export function readOptionalField(formData: FormData, field: string) {
  const value = readOptionalText(formData, field);
  return value ? { [field]: value } : {};
}
