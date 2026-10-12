import type { AdminDashboardSummaryResponse } from '../../../lib/api';

export type AdminSection = {
  href: string;
  label: string;
  description: string;
};

export const ADMIN_HOME_SECTION: AdminSection = {
  href: '/admin',
  label: 'Resumen',
  description: 'Métricas y estado general del backoffice',
};

export const ADMIN_USERS_SECTION: AdminSection = {
  href: '/admin/users',
  label: 'Usuarios',
  description: 'Altas, roles y control de acceso',
};

type CatalogSection = AdminSection & {
  /** Cuántos registros hay en el catálogo para esta sección. */
  count: (summary: AdminDashboardSummaryResponse) => number;
  countLabel: string;
};

export const ADMIN_CATALOG_SECTIONS: CatalogSection[] = [
  {
    href: '/admin/catalog/characters',
    label: 'Personajes',
    description: 'Fichas, splash art y retratos',
    count: (summary) => summary.totalCharacters,
    countLabel: 'personajes',
  },
  {
    href: '/admin/catalog/light-cones',
    label: 'Conos',
    description: 'Conos de luz y su splash art',
    count: (summary) => summary.totalLightCones,
    countLabel: 'conos de luz',
  },
  // La API cuenta artefactos y ornamentos juntos como relic sets.
  {
    href: '/admin/catalog/artifacts',
    label: 'Artefactos',
    description: 'Sets de piezas de artefacto',
    count: (summary) => summary.totalRelicSets,
    countLabel: 'relic sets',
  },
  {
    href: '/admin/catalog/ornaments',
    label: 'Ornamentos',
    description: 'Sets de ornamento planar',
    count: (summary) => summary.totalRelicSets,
    countLabel: 'relic sets',
  },
];

export const ADMIN_SECTIONS: AdminSection[] = [
  ADMIN_HOME_SECTION,
  ADMIN_USERS_SECTION,
  ...ADMIN_CATALOG_SECTIONS,
];

export function resolveActiveAdminHref(pathname: string) {
  const nested = ADMIN_SECTIONS.find(
    (section) =>
      section.href !== ADMIN_HOME_SECTION.href &&
      (pathname === section.href || pathname.startsWith(`${section.href}/`)),
  );

  if (nested) return nested.href;
  return pathname === ADMIN_HOME_SECTION.href ? ADMIN_HOME_SECTION.href : null;
}
