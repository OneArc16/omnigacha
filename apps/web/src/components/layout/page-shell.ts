export type AppShellVariant = 'wide' | 'compact';

const APP_SHELL_BASE_CLASSNAME =
  'relative flex w-full flex-col gap-4 px-4 pb-10 pt-4 sm:px-6 xl:px-10';

const APP_COMPACT_SHELL_CLASSNAME = 'max-w-[76rem]';

// Medidas del mockup: columna fija de 400px + tablero fluido, 20px de separación.
export const WORKSPACE_OVERVIEW_GRID_CLASSNAME =
  'grid gap-5 xl:grid-cols-[400px_minmax(0,1fr)]';

export const WORKSPACE_ROSTER_GRID_CLASSNAME =
  'grid items-start gap-5 xl:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)] 2xl:grid-cols-[minmax(28rem,0.86fr)_minmax(0,1.14fr)]';

export const WORKSPACE_ACCOUNT_GRID_CLASSNAME =
  'grid items-start gap-5 xl:grid-cols-[400px_minmax(0,1fr)]';

export const SIMULATOR_RECOMMEND_GRID_CLASSNAME =
  'grid items-start gap-5 xl:grid-cols-[minmax(24rem,0.82fr)_minmax(0,1.18fr)] 2xl:grid-cols-[minmax(28rem,0.76fr)_minmax(0,1.24fr)]';

export const SIMULATOR_SCENARIO_GRID_CLASSNAME =
  'grid items-start gap-5 xl:grid-cols-[minmax(24rem,0.84fr)_minmax(0,1.16fr)] 2xl:grid-cols-[minmax(28rem,0.78fr)_minmax(0,1.22fr)]';

export const SIMULATOR_HISTORY_GRID_CLASSNAME =
  'grid items-start gap-5 xl:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]';

export function getAppShellClassName(variant: AppShellVariant = 'wide') {
  return [APP_SHELL_BASE_CLASSNAME, variant === 'compact' ? APP_COMPACT_SHELL_CLASSNAME : '']
    .filter(Boolean)
    .join(' ');
}
