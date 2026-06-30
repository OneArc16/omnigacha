export type AppShellVariant = 'wide' | 'compact';
export type AppBackdropVariant = 'workspace' | 'simulator' | 'compact';

const APP_SHELL_BASE_CLASSNAME =
  'relative flex min-h-screen w-full flex-col gap-6 px-4 pb-10 pt-6 sm:px-6 xl:px-10 2xl:px-12';

const APP_COMPACT_SHELL_CLASSNAME = 'max-w-[76rem]';

const WORKSPACE_BACKDROP_CLASSNAME =
  'pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem] bg-[radial-gradient(circle_at_15%_20%,rgba(34,193,238,0.22),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(245,158,11,0.18),transparent_34%),linear-gradient(180deg,rgba(6,10,21,0.4),transparent)]';

const SIMULATOR_BACKDROP_CLASSNAME =
  'pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem] bg-[radial-gradient(circle_at_14%_18%,rgba(34,193,238,0.24),transparent_42%),radial-gradient(circle_at_84%_2%,rgba(14,165,233,0.15),transparent_34%),radial-gradient(circle_at_50%_0%,rgba(2,132,199,0.08),transparent_38%),linear-gradient(180deg,rgba(6,10,21,0.46),transparent)]';

const COMPACT_BACKDROP_CLASSNAME =
  'pointer-events-none absolute inset-x-0 top-0 -z-10 h-[24rem] bg-[radial-gradient(circle_at_20%_10%,rgba(34,193,238,0.18),transparent_42%),linear-gradient(180deg,rgba(6,10,21,0.38),transparent)]';

export const WORKSPACE_HERO_GRID_CLASSNAME =
  'grid items-start gap-6 xl:grid-cols-[minmax(0,1.16fr)_minmax(24rem,0.84fr)] 2xl:grid-cols-[minmax(0,1.3fr)_minmax(26rem,0.7fr)]';

export const WORKSPACE_OVERVIEW_GRID_CLASSNAME =
  'grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] 2xl:grid-cols-[minmax(24rem,0.78fr)_minmax(0,1.22fr)]';

export const WORKSPACE_ROSTER_GRID_CLASSNAME =
  'grid items-start gap-6 xl:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)] 2xl:grid-cols-[minmax(28rem,0.86fr)_minmax(0,1.14fr)]';

export const WORKSPACE_ACCOUNT_GRID_CLASSNAME =
  'grid items-start gap-6 xl:grid-cols-[minmax(0,0.84fr)_minmax(0,1.16fr)] 2xl:grid-cols-[minmax(24rem,0.76fr)_minmax(0,1.24fr)]';

export const SIMULATOR_HERO_GRID_CLASSNAME =
  'grid items-start gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(22rem,0.88fr)] 2xl:grid-cols-[minmax(0,1.26fr)_minmax(26rem,0.74fr)]';

export const SIMULATOR_RECOMMEND_GRID_CLASSNAME =
  'grid items-start gap-6 xl:grid-cols-[minmax(24rem,0.82fr)_minmax(0,1.18fr)] 2xl:grid-cols-[minmax(28rem,0.76fr)_minmax(0,1.24fr)]';

export const SIMULATOR_SCENARIO_GRID_CLASSNAME =
  'grid items-start gap-6 xl:grid-cols-[minmax(24rem,0.84fr)_minmax(0,1.16fr)] 2xl:grid-cols-[minmax(28rem,0.78fr)_minmax(0,1.22fr)]';

export const SIMULATOR_HISTORY_GRID_CLASSNAME =
  'grid items-start gap-6 xl:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]';

export function getAppShellClassName(variant: AppShellVariant = 'wide') {
  return [APP_SHELL_BASE_CLASSNAME, variant === 'compact' ? APP_COMPACT_SHELL_CLASSNAME : '']
    .filter(Boolean)
    .join(' ');
}

export function getAppBackdropClassName(
  variant: AppBackdropVariant = 'workspace',
) {
  switch (variant) {
    case 'simulator':
      return SIMULATOR_BACKDROP_CLASSNAME;
    case 'compact':
      return COMPACT_BACKDROP_CLASSNAME;
    case 'workspace':
    default:
      return WORKSPACE_BACKDROP_CLASSNAME;
  }
}
