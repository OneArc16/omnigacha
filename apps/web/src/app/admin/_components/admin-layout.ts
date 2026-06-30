export type AdminShellVariant = 'wide' | 'compact';
export type AdminBackdropVariant = 'hero' | 'compact';

const ADMIN_SHELL_BASE_CLASSNAME =
  'relative flex min-h-screen w-full flex-col gap-6 px-4 pb-10 pt-6 sm:px-6 xl:px-10 2xl:px-12';

const ADMIN_COMPACT_SHELL_CLASSNAME = 'max-w-[76rem]';

const ADMIN_HERO_BACKDROP_CLASSNAME =
  'pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem] bg-[radial-gradient(circle_at_15%_20%,rgba(34,193,238,0.22),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(245,158,11,0.18),transparent_34%),linear-gradient(180deg,rgba(6,10,21,0.42),transparent)]';

const ADMIN_COMPACT_BACKDROP_CLASSNAME =
  'pointer-events-none absolute inset-x-0 top-0 -z-10 h-[24rem] bg-[radial-gradient(circle_at_20%_10%,rgba(34,193,238,0.18),transparent_42%),linear-gradient(180deg,rgba(6,10,21,0.38),transparent)]';

export const ADMIN_PANEL_HERO_GRID_CLASSNAME =
  'grid items-start gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(24rem,0.82fr)] 2xl:grid-cols-[minmax(0,1.32fr)_minmax(28rem,0.68fr)]';

export const ADMIN_EDITOR_GRID_CLASSNAME =
  'grid gap-6 2xl:grid-cols-[minmax(24rem,0.82fr)_minmax(0,1.18fr)]';

export const ADMIN_SUMMARY_METRICS_GRID_CLASSNAME =
  'grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5';

export const ADMIN_SUMMARY_FOOTER_GRID_CLASSNAME =
  'grid gap-4 2xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]';

export function getAdminShellClassName(
  variant: AdminShellVariant = 'wide',
) {
  return [
    ADMIN_SHELL_BASE_CLASSNAME,
    variant === 'compact' ? ADMIN_COMPACT_SHELL_CLASSNAME : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function getAdminBackdropClassName(
  variant: AdminBackdropVariant = 'hero',
) {
  return variant === 'compact'
    ? ADMIN_COMPACT_BACKDROP_CLASSNAME
    : ADMIN_HERO_BACKDROP_CLASSNAME;
}
