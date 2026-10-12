'use client';

import { useEffect, useState } from 'react';
import { WORKSPACE_OVERVIEW_GRID_CLASSNAME } from '../../../components/layout/page-shell';
import { Alert } from '../../../components/ui/alert';
import { Tag } from '../../../components/ui/badge';
import { ButtonLink } from '../../../components/ui/button-link';
import { HeroStat } from '../../../components/ui/hero-stat';
import { Eyebrow, Inset } from '../../../components/ui/inset';
import { Note } from '../../../components/ui/note';
import { StatTile } from '../../../components/ui/stat-tile';
import { WindowPanel } from '../../../components/ui/window-panel';
import { AdminDashboardSummaryResponse, apiRequest } from '../../../lib/api';
import { resolveErrorMessage } from '../../../lib/errors';
import { AdminPage } from './admin-page';
import { ADMIN_CATALOG_SECTIONS, ADMIN_USERS_SECTION } from './admin-sections';

type Summary = AdminDashboardSummaryResponse;

type Metric = {
  label: string;
  value: (summary: Summary) => number;
  caption: (summary: Summary) => string;
  accent: string;
};

const METRICS: Metric[] = [
  {
    label: 'Usuarios',
    value: (summary) => summary.totalUsers,
    caption: (summary) =>
      summary.totalActiveAdmins === 1
        ? '1 admin activo'
        : `${summary.totalActiveAdmins} admins activos`,
    accent: 'var(--gold)',
  },
  {
    label: 'Personajes',
    value: (summary) => summary.totalCharacters,
    caption: (summary) => `${summary.draftCharacters} en borrador`,
    accent: 'var(--purple)',
  },
  {
    label: 'Conos de luz',
    value: (summary) => summary.totalLightCones,
    caption: (summary) => `${summary.draftLightCones} en borrador`,
    accent: 'var(--cyan)',
  },
  {
    label: 'Relic sets',
    value: (summary) => summary.totalRelicSets,
    caption: (summary) => `${summary.draftRelicSets} en borrador`,
    accent: 'var(--purple)',
  },
  {
    label: 'Media',
    value: (summary) => summary.totalMediaAssets,
    caption: () => 'imágenes registradas',
    accent: 'var(--green)',
  },
  {
    label: 'Admins activos',
    value: (summary) => summary.totalActiveAdmins,
    caption: () => 'con acceso real al panel',
    accent: 'var(--amber)',
  },
];

function EditorialStatus({ summary }: { summary: Summary | null }) {
  const drafts = summary
    ? summary.draftCharacters + summary.draftLightCones + summary.draftRelicSets
    : null;

  return (
    <WindowPanel
      title="Estado editorial"
      subtitle="Contenido pendiente antes de llegar al front público."
    >
      <HeroStat
        eyebrow="Borradores pendientes"
        value={drafts ?? '—'}
        unit={drafts === 1 ? 'registro' : 'registros'}
        caption="por revisar y publicar."
      >
        {summary ? (
          <p className="mt-3.5 text-[11px] text-muted">
            Personajes {summary.draftCharacters} · Conos {summary.draftLightCones} ·
            Relic sets {summary.draftRelicSets}
          </p>
        ) : null}
      </HeroStat>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <ButtonLink href={ADMIN_USERS_SECTION.href} className="w-full px-3 py-3">
          Gestionar usuarios
        </ButtonLink>
        <ButtonLink
          href={ADMIN_CATALOG_SECTIONS[0].href}
          variant="ghost"
          className="w-full px-3 py-3"
        >
          Abrir catálogo
        </ButtonLink>
      </div>

      <Note className="mt-3.5">
        Trabaja en borrador, publica cuando la ficha esté lista y sube el splash
        art al final para mantener la revisión limpia.
      </Note>
    </WindowPanel>
  );
}

function BackofficeBoard({ summary }: { summary: Summary | null }) {
  return (
    <WindowPanel
      title="Backoffice"
      subtitle="Métricas del sistema y accesos al catálogo."
      action={<Tag>En vivo</Tag>}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {METRICS.map((metric) => (
          <StatTile
            key={metric.label}
            label={metric.label}
            value={summary ? metric.value(summary) : null}
            caption={summary ? metric.caption(summary) : 'cargando'}
            accent={metric.accent}
          />
        ))}
      </div>

      <Eyebrow className="mt-5">Catálogo</Eyebrow>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        {ADMIN_CATALOG_SECTIONS.map((section) => (
          <Inset
            key={section.href}
            className="flex items-center justify-between gap-3 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{section.label}</p>
              <p className="truncate text-xs text-muted">
                {summary
                  ? `${section.count(summary)} ${section.countLabel} · ${section.description}`
                  : section.description}
              </p>
            </div>
            <ButtonLink href={section.href} variant="ghost" size="sm">
              Gestionar
            </ButtonLink>
          </Inset>
        ))}
      </div>
    </WindowPanel>
  );
}

function AdminOverview({ accessToken }: { accessToken: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    apiRequest<Summary>('/admin/dashboard/summary', { token: accessToken })
      .then((response) => {
        if (active) setSummary(response);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(resolveErrorMessage(err, 'No fue posible cargar el resumen.'));
        }
      });

    return () => {
      active = false;
    };
  }, [accessToken]);

  return (
    <>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <section className={`mt-1 ${WORKSPACE_OVERVIEW_GRID_CLASSNAME}`}>
        <EditorialStatus summary={summary} />
        <BackofficeBoard summary={summary} />
      </section>
    </>
  );
}

export function AdminDashboard() {
  return (
    <AdminPage
      title="Panel de administración"
      description="Backoffice para usuarios, catálogo y media editorial."
    >
      {({ accessToken }) => <AdminOverview accessToken={accessToken} />}
    </AdminPage>
  );
}
