"use client";

import { ReactNode, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Alert } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { ButtonLink } from '../../../components/ui/button-link';
import { SegmentedTabs } from '../../../components/ui/segmented-tabs';
import { Skeleton } from '../../../components/ui/skeleton';
import { WindowPanel } from '../../../components/ui/window-panel';
import {
  clearAuthTokens,
  useAuthTokens,
  useHydratedValue,
} from '../../../lib/auth-storage';
import {
  apiRequest,
  AdminDashboardSummaryResponse,
  MeResponse,
} from '../../../lib/api';
import {
  ADMIN_PANEL_HERO_GRID_CLASSNAME,
  ADMIN_SUMMARY_FOOTER_GRID_CLASSNAME,
  ADMIN_SUMMARY_METRICS_GRID_CLASSNAME,
  getAdminBackdropClassName,
  getAdminShellClassName,
} from './admin-layout';

type MainSection = 'summary' | 'catalog';
type CatalogSection = 'characters' | 'light-cones' | 'artifacts' | 'ornaments';

const SECTION_OPTIONS = [
  {
    value: 'summary',
    label: 'Resumen',
    description: 'Métricas y estado general del panel.',
  },
  {
    value: 'catalog',
    label: 'Catálogo',
    description: 'Personajes, conos y sets editoriales.',
  },
] satisfies {
  value: MainSection;
  label: string;
  description: string;
}[];

const CATALOG_OPTIONS = [
  {
    value: 'characters',
    label: 'Personajes',
    description: 'Gestión de personajes y splash art.',
  },
  {
    value: 'light-cones',
    label: 'Conos',
    description: 'Gestión de conos de luz.',
  },
  {
    value: 'artifacts',
    label: 'Artefactos',
    description: 'Sets de piezas de artefacto.',
  },
  {
    value: 'ornaments',
    label: 'Ornamentos',
    description: 'Sets de ornamento planar.',
  },
] satisfies {
  value: CatalogSection;
  label: string;
  description: string;
}[];

function getMainSectionLabel(section: MainSection) {
  switch (section) {
    case 'catalog':
      return 'Catalogo';
    case 'summary':
    default:
      return 'Resumen';
  }
}

function getCatalogSectionLabel(section: CatalogSection) {
  switch (section) {
    case 'light-cones':
      return 'Conos';
    case 'artifacts':
      return 'Artefactos';
    case 'ornaments':
      return 'Ornamentos';
    case 'characters':
    default:
      return 'Personajes';
  }
}

type MetricCardProps = {
  label: string;
  value: number | string;
  caption: string;
  tone?: 'brand' | 'neutral' | 'success' | 'warning';
};

function MetricCard({
  label,
  value,
  caption,
  tone = 'neutral',
}: MetricCardProps) {
  const toneBackground = {
    brand:
      'linear-gradient(135deg, color-mix(in oklab, var(--brand-500) 18%, transparent), transparent)',
    neutral:
      'linear-gradient(135deg, color-mix(in oklab, var(--ink-500) 10%, transparent), transparent)',
    success:
      'linear-gradient(135deg, color-mix(in oklab, var(--positive-500) 18%, transparent), transparent)',
    warning:
      'linear-gradient(135deg, color-mix(in oklab, var(--warning-500) 18%, transparent), transparent)',
  }[tone];

  return (
    <div
      className={[
        'rounded-3xl border border-[var(--line)] bg-[var(--surface-2)] p-4 shadow-[0_12px_28px_-24px_rgba(2,8,23,.9)]',
      ].join(' ')}
      style={{
        backgroundImage:
          'linear-gradient(180deg, color-mix(in oklab, var(--surface-elevated) 35%, transparent), var(--surface-2)), ' +
          toneBackground,
      }}
    >
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-500)]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight text-[var(--ink-900)]">
        {value}
      </p>
      <p className="mt-1 text-sm text-[var(--ink-600)]">{caption}</p>
    </div>
  );
}

type CompactMetricCardProps = {
  label: string;
  value: number | string;
  caption: string;
  tone?: 'brand' | 'neutral' | 'success' | 'warning';
};

function CompactMetricCard({
  label,
  value,
  caption,
  tone = 'neutral',
}: CompactMetricCardProps) {
  const toneRing = {
    brand: 'shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--brand-400)_28%,transparent)]',
    neutral:
      'shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--ink-500)_18%,transparent)]',
    success:
      'shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--positive-500)_26%,transparent)]',
    warning:
      'shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--warning-500)_26%,transparent)]',
  }[tone];

  return (
    <div
      className={[
        'rounded-2xl border border-[var(--line)] bg-[var(--surface-2)]/90 p-4',
        toneRing,
      ].join(' ')}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-500)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tracking-tight text-[var(--ink-900)]">
        {value}
      </p>
      <p className="mt-1 text-sm text-[var(--ink-600)]">{caption}</p>
    </div>
  );
}

type CatalogRedirectCardProps = {
  title: string;
  subtitle: string;
  description: ReactNode;
  href: string;
  ctaLabel: string;
  countBadge?: ReactNode;
};

function CatalogRedirectCard({
  title,
  subtitle,
  description,
  href,
  ctaLabel,
  countBadge,
}: CatalogRedirectCardProps) {
  return (
    <WindowPanel title={title} subtitle={subtitle} action={countBadge}>
      <div className="flex flex-col items-start gap-4 rounded-[28px] border border-[var(--line)] bg-[var(--surface)]/90 p-6">
        <p className="max-w-xl text-sm text-[var(--ink-600)]">{description}</p>
        <ButtonLink href={href}>{ctaLabel}</ButtonLink>
      </div>
    </WindowPanel>
  );
}

export function AdminDashboardClient() {
  const { accessToken, refreshToken } = useAuthTokens();
  const isHydrated = useHydratedValue();

  const [me, setMe] = useState<MeResponse | null>(null);
  const [summary, setSummary] = useState<AdminDashboardSummaryResponse | null>(
    null,
  );

  const [panelState, setPanelState] = useState<
    'idle' | 'loading' | 'ready' | 'forbidden' | 'error'
  >('idle');
  const [loadError, setLoadError] = useState('');
  const [bootstrapNonce, setBootstrapNonce] = useState(0);
  const [activeSection, setActiveSection] = useState<MainSection>('summary');
  const [activeCatalogSection, setActiveCatalogSection] =
    useState<CatalogSection>('characters');

  const resetWorkspace = useCallback(() => {
    setMe(null);
    setSummary(null);
    setPanelState('idle');
    setLoadError('');
    setActiveSection('summary');
    setActiveCatalogSection('characters');
  }, []);

  function handleLocalLogout() {
    resetWorkspace();
    clearAuthTokens();
  }

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!accessToken) {
      return;
    }

    let active = true;

    async function bootstrap() {
      setPanelState('loading');
      setLoadError('');

      try {
        const profile = await apiRequest<MeResponse>('/auth/me', {
          token: accessToken,
        });

        if (!active) {
          return;
        }

        setMe(profile);

        if (profile.role !== 'ADMIN') {
          setPanelState('forbidden');
          return;
        }

        const summaryResponse = await apiRequest<AdminDashboardSummaryResponse>(
          '/admin/dashboard/summary',
          { token: accessToken },
        );

        if (!active) {
          return;
        }

        setSummary(summaryResponse);
        setPanelState('ready');
      } catch (error) {
        if (!active) {
          return;
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : 'No fue posible cargar el panel administrativo.',
        );
        setPanelState('error');
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, [accessToken, bootstrapNonce, isHydrated, resetWorkspace]);

  async function handleLogout() {
    try {
      if (refreshToken) {
        await apiRequest('/auth/logout', {
          method: 'POST',
          body: { refreshToken },
        });
      }
    } catch {
      // Logout should still clear the local session state if the network fails.
    } finally {
      handleLocalLogout();
      toast.success('Sesión cerrada.');
    }
  }

  const activeSectionLabel = getMainSectionLabel(activeSection);
  const activeCatalogSectionLabel = getCatalogSectionLabel(activeCatalogSection);
  const totalCatalogItems =
    (summary?.totalCharacters ?? 0) +
    (summary?.totalLightCones ?? 0) +
    (summary?.totalRelicSets ?? 0);
  const totalDraftItems =
    (summary?.draftCharacters ?? 0) +
    (summary?.draftLightCones ?? 0) +
    (summary?.draftRelicSets ?? 0);
  const wideShellClassName = getAdminShellClassName('wide');
  const compactShellClassName = getAdminShellClassName('compact');
  const heroBackdropClassName = getAdminBackdropClassName('hero');
  const compactBackdropClassName = getAdminBackdropClassName('compact');

  if (!isHydrated) {
    return (
      <main className={wideShellClassName}>
        <div className={heroBackdropClassName} />

        <WindowPanel
          title="Panel de administración OmniGacha"
          subtitle="Cargando la interfaz administrativa."
          action={<Badge variant="neutral">Inicializando</Badge>}
        >
          <div className={ADMIN_PANEL_HERO_GRID_CLASSNAME}>
            <div className="space-y-3">
              <Skeleton className="h-8 w-48 rounded-full" />
              <Skeleton className="h-14 w-full rounded-3xl" />
              <Skeleton className="h-24 w-full rounded-3xl" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-28 w-full rounded-3xl" />
              <Skeleton className="h-28 w-full rounded-3xl" />
              <Skeleton className="h-28 w-full rounded-3xl sm:col-span-2" />
            </div>
          </div>
        </WindowPanel>
      </main>
    );
  }

  if (!accessToken) {
    return (
      <main className={compactShellClassName}>
        <div className={compactBackdropClassName} />

        <WindowPanel
          title="Panel de administración OmniGacha"
          subtitle="Necesitas iniciar sesión como administrador para acceder al backoffice."
          action={<Badge variant="warning">Acceso requerido</Badge>}
        >
          <div className={ADMIN_PANEL_HERO_GRID_CLASSNAME}>
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-500)]">
                Backoffice nativo
              </p>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-[var(--ink-900)] sm:text-5xl">
                Gestiona usuarios y catálogo sin salir de OmniGacha.
              </h1>
              <p className="max-w-3xl text-base text-[var(--ink-600)]">
                El acceso administrativo está protegido por rol. En este
                espacio podrás crear usuarios, mantener el catálogo editorial y
                preparar splash art para el futuro front visual.
              </p>
            </div>

            <div className="rounded-[26px] border border-[var(--line)] bg-[var(--surface)]/90 p-5">
              <div className="space-y-4">
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-500)]">
                    Qué podrás hacer
                  </p>
                  <p className="mt-2 text-sm text-[var(--ink-600)]">
                    Crear y editar usuarios, personajes, conos de luz y sets de
                    artefactos/ornamentos.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <ButtonLink href="/" className="w-full">
                    Ir al espacio principal
                  </ButtonLink>
                  <ButtonLink href="/simulator" variant="ghost" className="w-full">
                    Abrir simulador
                  </ButtonLink>
                </div>
              </div>
            </div>
          </div>
        </WindowPanel>
      </main>
    );
  }

  if (panelState === 'loading' || panelState === 'idle') {
    return (
      <main className={wideShellClassName}>
        <div className={heroBackdropClassName} />

        <WindowPanel
          title="Panel de administración OmniGacha"
          subtitle="Recuperando datos del backoffice."
          action={<Badge variant="brand">Sincronizando</Badge>}
        >
          <div className={ADMIN_PANEL_HERO_GRID_CLASSNAME}>
            <div className="space-y-3">
              <Skeleton className="h-8 w-48 rounded-full" />
              <Skeleton className="h-14 w-full rounded-3xl" />
              <Skeleton className="h-24 w-full rounded-3xl" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-28 w-full rounded-3xl" />
              <Skeleton className="h-28 w-full rounded-3xl" />
              <Skeleton className="h-28 w-full rounded-3xl sm:col-span-2" />
            </div>
          </div>
        </WindowPanel>
      </main>
    );
  }

  if (panelState === 'error') {
    return (
      <main className={compactShellClassName}>
        <div className={compactBackdropClassName} />

        <WindowPanel
          title="Panel de administración OmniGacha"
          subtitle="No pudimos cargar el backoffice."
          action={<Badge variant="danger">Error</Badge>}
        >
          <div className="space-y-4">
            <Alert tone="error">{loadError}</Alert>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => setBootstrapNonce((current) => current + 1)}
              >
                Reintentar
              </Button>
              <ButtonLink href="/" variant="ghost">
                Ir al espacio principal
              </ButtonLink>
            </div>
          </div>
        </WindowPanel>
      </main>
    );
  }

  if (panelState === 'forbidden') {
    return (
      <main className={compactShellClassName}>
        <div className={compactBackdropClassName} />

        <WindowPanel
          title="Panel de administración OmniGacha"
          subtitle="Tu sesión está activa, pero no tiene permisos administrativos."
          action={<Badge variant="warning">Sin permisos</Badge>}
        >
          <div className="space-y-4">
            <Alert tone="error">
              Esta cuenta no tiene rol ADMIN. Si necesitas entrar al backoffice,
              usa una cuenta administrativa.
            </Alert>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-500)]">
                Sesión actual
              </p>
              <p className="mt-2 text-base font-semibold text-[var(--ink-900)]">
                {me?.name ?? 'Usuario autenticado'}
              </p>
              <p className="mt-1 text-sm text-[var(--ink-600)]">
                {me?.email ?? 'Correo no disponible'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ButtonLink href="/" className="w-full sm:w-auto">
                Volver al espacio principal
              </ButtonLink>
              <Button type="button" variant="ghost" onClick={handleLogout}>
                Cerrar sesión
              </Button>
            </div>
          </div>
        </WindowPanel>
      </main>
    );
  }

  const adminTabs = (
    <SegmentedTabs
      value={activeSection}
      onValueChange={setActiveSection}
      options={SECTION_OPTIONS}
    />
  );

  function renderSummaryView() {
    return (
      <WindowPanel
        title="Resumen administrativo"
        subtitle="Métricas vivas para tomar decisiones sin abrir el motor de datos."
        action={<Badge variant="brand">Vista global</Badge>}
      >
        <div className="space-y-6">
          <div className={ADMIN_SUMMARY_METRICS_GRID_CLASSNAME}>
            <MetricCard
              label="Usuarios"
              value={summary?.totalUsers ?? 0}
              caption={`Admins activos: ${summary?.totalActiveAdmins ?? 0}`}
              tone="brand"
            />
            <MetricCard
              label="Personajes"
              value={summary?.totalCharacters ?? 0}
              caption={`Borradores: ${summary?.draftCharacters ?? 0}`}
            />
            <MetricCard
              label="Conos de luz"
              value={summary?.totalLightCones ?? 0}
              caption={`Borradores: ${summary?.draftLightCones ?? 0}`}
            />
            <MetricCard
              label="Relic sets"
              value={summary?.totalRelicSets ?? 0}
              caption={`Borradores: ${summary?.draftRelicSets ?? 0}`}
            />
            <MetricCard
              label="Media assets"
              value={summary?.totalMediaAssets ?? 0}
              caption="Splash art preparado para el front."
              tone="success"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ButtonLink href="/admin/users" variant="ghost">
              Gestionar usuarios
            </ButtonLink>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setActiveSection('catalog')}
            >
              Abrir catálogo
            </Button>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4 text-sm text-[var(--ink-600)]">
            El catálogo se mantiene en estado editorial. Puedes preparar
            contenido en draft, publicar por etapas y cargar imágenes de splash
            art sin tocar el front público.
          </div>
        </div>
      </WindowPanel>
    );
  }

  return (
    <main className={wideShellClassName}>
      <div className={heroBackdropClassName} />

      <WindowPanel
        title="Panel de administración OmniGacha"
        subtitle="Backoffice nativo para usuarios, catálogo y media editorial."
        action={<Badge variant="brand">ADMIN</Badge>}
      >
        <div className={ADMIN_PANEL_HERO_GRID_CLASSNAME}>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="neutral">Seccion activa: {activeSectionLabel}</Badge>
              {activeSection === 'catalog' ? (
                <Badge variant="outline">
                  Foco: {activeCatalogSectionLabel}
                </Badge>
              ) : null}
              <Badge variant="success">
                Media: {summary?.totalMediaAssets ?? 0}
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <CompactMetricCard
                label="Usuarios"
                value={summary?.totalUsers ?? 0}
                caption={`Admins activos: ${summary?.totalActiveAdmins ?? 0}`}
                tone="brand"
              />
              <CompactMetricCard
                label="Catalogo"
                value={totalCatalogItems}
                caption="Personajes, conos y relic sets."
                tone="neutral"
              />
              <CompactMetricCard
                label="Drafts"
                value={totalDraftItems}
                caption="Contenido pendiente por publicar."
                tone="warning"
              />
              <CompactMetricCard
                label="Estado"
                value={me?.mustChangePassword ? 'Atencion' : 'Operativo'}
                caption={
                  me?.mustChangePassword
                    ? 'Conviene actualizar la clave.'
                    : 'Panel listo para gestionar.'
                }
                tone={me?.mustChangePassword ? 'warning' : 'success'}
              />
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)]/80 p-4 text-sm text-[var(--ink-600)]">
              Trabaja por secciones para no mezclar usuarios, catalogo y media.
              Los assets siguen en flujo editorial y se publican cuando la ficha
              este lista.
            </div>
          </div>

          <div className="w-full xl:max-w-[34rem] rounded-[26px] border border-[var(--line)] bg-[var(--surface)]/90 p-5">
            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-500)]">
                  Sesión activa
                </p>
                <p className="mt-2 text-lg font-semibold text-[var(--ink-900)]">
                  {me?.name ?? 'Administrador'}
                </p>
                <p className="mt-1 text-sm text-[var(--ink-600)]">
                  {me?.email ?? 'Correo no disponible'}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <ButtonLink href="/admin/users" className="w-full">
                  Gestionar usuarios
                </ButtonLink>
                <ButtonLink href="/" variant="ghost" className="w-full">
                  Ir al espacio principal
                </ButtonLink>
                <Button
                  variant="ghost"
                  className="w-full sm:col-span-2"
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </Button>
              </div>

              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4 text-sm text-[var(--ink-600)]">
                El panel usa uploads locales en `apps/api/uploads` y guarda solo
                metadatos de media en la base de datos.
              </div>
            </div>
          </div>
        </div>
      </WindowPanel>

      {me?.mustChangePassword ? (
        <Alert tone="error">
          Tu cuenta requiere cambio de contraseña. El acceso al panel sigue
          habilitado, pero conviene resolverlo cuanto antes.
        </Alert>
      ) : null}

      {adminTabs}

      {activeSection === 'summary' ? renderSummaryView() : null}

      {activeSection === 'catalog' ? (
        <>
          <SegmentedTabs
            value={activeCatalogSection}
            onValueChange={setActiveCatalogSection}
            options={CATALOG_OPTIONS}
          />

          {activeCatalogSection === 'characters' ? (
            <CatalogRedirectCard
              title="Gestión de personajes"
              subtitle="La edición de personajes vive ahora en su propia pantalla."
              countBadge={
                <Badge variant="neutral">
                  {summary?.totalCharacters ?? 0} en catálogo
                </Badge>
              }
              description={
                <>
                  Crear, editar, archivar y subir splash art o retrato de
                  personajes se maneja en{' '}
                  <span className="font-semibold text-[var(--ink-900)]">
                    /admin/catalog/characters
                  </span>{' '}
                  para no mezclar esa media con el resto del catálogo.
                </>
              }
              href="/admin/catalog/characters"
              ctaLabel="Gestionar personajes"
            />
          ) : null}

          {activeCatalogSection === 'light-cones' ? (
            <CatalogRedirectCard
              title="Gestión de conos de luz"
              subtitle="La edición de conos de luz vive ahora en su propia pantalla."
              countBadge={
                <Badge variant="neutral">
                  {summary?.totalLightCones ?? 0} en catálogo
                </Badge>
              }
              description={
                <>
                  Crear, editar, archivar y subir splash art de conos de luz
                  se maneja en{' '}
                  <span className="font-semibold text-[var(--ink-900)]">
                    /admin/catalog/light-cones
                  </span>
                  .
                </>
              }
              href="/admin/catalog/light-cones"
              ctaLabel="Gestionar conos de luz"
            />
          ) : null}

          {activeCatalogSection === 'artifacts' ? (
            <CatalogRedirectCard
              title="Gestión de artefactos"
              subtitle="La edición de artefactos vive ahora en su propia pantalla."
              countBadge={
                <Badge variant="neutral">
                  {summary?.totalRelicSets ?? 0} relic sets en catálogo
                </Badge>
              }
              description={
                <>
                  Crear, editar, archivar y subir splash art de sets de
                  artefacto se maneja en{' '}
                  <span className="font-semibold text-[var(--ink-900)]">
                    /admin/catalog/artifacts
                  </span>
                  .
                </>
              }
              href="/admin/catalog/artifacts"
              ctaLabel="Gestionar artefactos"
            />
          ) : null}

          {activeCatalogSection === 'ornaments' ? (
            <CatalogRedirectCard
              title="Gestión de ornamentos"
              subtitle="La edición de ornamentos vive ahora en su propia pantalla."
              countBadge={
                <Badge variant="neutral">
                  {summary?.totalRelicSets ?? 0} relic sets en catálogo
                </Badge>
              }
              description={
                <>
                  Crear, editar, archivar y subir splash art de sets de
                  ornamento planar se maneja en{' '}
                  <span className="font-semibold text-[var(--ink-900)]">
                    /admin/catalog/ornaments
                  </span>
                  .
                </>
              }
              href="/admin/catalog/ornaments"
              ctaLabel="Gestionar ornamentos"
            />
          ) : null}
        </>
      ) : null}

      {summary && activeSection === 'summary' ? (
        <section className={ADMIN_SUMMARY_FOOTER_GRID_CLASSNAME}>
          <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)]/90 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-500)]">
              Consejos de operación
            </p>
            <ul className="mt-3 space-y-2 text-sm text-[var(--ink-600)]">
              <li>Trabaja en draft y publica cuando la ficha esté lista.</li>
              <li>Sube splash art al final para mantener la revisión limpia.</li>
              <li>Un solo modelo de relic sets evita duplicar lógica entre artefactos y ornamentos.</li>
            </ul>
          </div>

          <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)]/90 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-500)]">
              Media preparada
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <MetricCard
                label="Assets"
                value={summary.totalMediaAssets}
                caption="Imágenes registradas en el sistema."
                tone="success"
              />
              <MetricCard
                label="Seguridad"
                value={summary.totalActiveAdmins}
                caption="Admins activos con acceso real."
                tone="warning"
              />
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
