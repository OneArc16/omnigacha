import { Character, LightCone, RelicSet } from '../../../lib/api';

type CatalogStatus = Character['status'] | LightCone['status'] | RelicSet['status'];

export function catalogStatusVariant(status: CatalogStatus) {
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
