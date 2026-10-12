'use client';

import { useEffect, useState } from 'react';
import { DamageComparisonChart } from '../../../components/charts/damage-comparison-chart';
import {
  HeaderStrip,
  HeaderStripSkeleton,
} from '../../../components/layout/header-strip';
import { getAppShellClassName } from '../../../components/layout/page-shell';
import { SignInRequired } from '../../../components/layout/sign-in-required';
import { RecommendationSummaryCard } from '../../../components/recommendations/recommendation-summary-card';
import { Alert } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { ButtonLink } from '../../../components/ui/button-link';
import { Eyebrow, Inset } from '../../../components/ui/inset';
import { Note } from '../../../components/ui/note';
import { Skeleton } from '../../../components/ui/skeleton';
import { StatTile } from '../../../components/ui/stat-tile';
import { WindowPanel } from '../../../components/ui/window-panel';
import {
  apiRequest,
  RecommendationDetailResponse,
  SimulationDetailResponse,
} from '../../../lib/api';
import { useAuthTokens, useHydratedValue } from '../../../lib/auth-storage';
import { SCENARIO_CHART_HELP } from './scenario-result';
import {
  formatDamage,
  formatDate,
  formatOptional,
  formatSigned,
  formatStatSummary,
  resolveSimulationType,
  SIMULATION_TYPE_LABEL,
} from './simulator-format';

type HistoryKind = 'recommendation' | 'simulation';

type HistoryDetailClientProps = {
  kind: HistoryKind;
  id: number;
};

const KIND_UI: Record<HistoryKind, { title: string; path: string }> = {
  recommendation: {
    title: 'Detalle de recomendación',
    path: '/simulations/recommendations',
  },
  simulation: {
    title: 'Detalle de simulación',
    path: '/simulations/history',
  },
};

function RecommendationDetail({ detail }: { detail: RecommendationDetailResponse }) {
  return (
    <WindowPanel
      title={detail.targetCharacter}
      subtitle={`Creado: ${formatDate(detail.createdAt)}`}
    >
      <RecommendationSummaryCard
        eyebrow="Veredicto"
        name={detail.targetCharacter}
        character={null}
        level={detail.level}
        score={detail.score}
      />

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <StatTile
          label="Delta estimado"
          value={`${formatSigned(detail.estimatedDeltaDmg, 1)}%`}
          caption="cambio de daño del equipo"
        />
        <StatTile
          label="Equipos compatibles"
          value={detail.compatibleTeams}
          caption="composiciones que habilita"
          accent="var(--purple)"
        />
      </div>

      <Note className="mt-3">{detail.explanation}</Note>
    </WindowPanel>
  );
}

function DamageScenarioDetail({ detail }: { detail: SimulationDetailResponse }) {
  const { payload } = detail;
  const statKeys = payload.statKeys ?? [];
  const hasDamageTotals =
    typeof payload.baseTeamDamage === 'number' &&
    typeof payload.simulatedTeamDamage === 'number';

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Cambio estimado"
          value={formatOptional(
            payload.deltaPercent,
            (value) => `${formatSigned(value)}%`,
          )}
          caption="daño del equipo"
        />
        <StatTile
          label="Daño base"
          value={formatOptional(payload.baseTeamDamage, formatDamage)}
          caption="antes del ajuste"
          accent="var(--purple)"
        />
        <StatTile
          label="Daño simulado"
          value={formatOptional(payload.simulatedTeamDamage, formatDamage)}
          caption="con los stats objetivo"
          accent="var(--cyan)"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Inset>
          <Eyebrow>Stats base</Eyebrow>
          <p className="mt-2 text-sm text-[var(--ink-700)]">
            {formatStatSummary(statKeys, payload.baseStats)}
          </p>
        </Inset>
        <Inset>
          <Eyebrow>Stats simuladas</Eyebrow>
          <p className="mt-2 text-sm text-[var(--ink-700)]">
            {formatStatSummary(statKeys, payload.simulatedStats)}
          </p>
        </Inset>
      </div>

      {hasDamageTotals ? (
        <DamageComparisonChart
          currentTotal={payload.baseTeamDamage ?? 0}
          proposedTotal={payload.simulatedTeamDamage ?? 0}
          currentLabel="Base"
          proposedLabel="Simulado"
          seriesName="Daño de escenario"
          helpTextByLabel={SCENARIO_CHART_HELP}
        />
      ) : null}
    </>
  );
}

function SimulationDetail({ detail }: { detail: SimulationDetailResponse }) {
  const type = resolveSimulationType(detail);

  return (
    <WindowPanel
      title={detail.label}
      subtitle={`Creado: ${formatDate(detail.createdAt)}`}
      action={
        <Badge variant={type === 'damage_scenario' ? 'brand' : 'neutral'}>
          {SIMULATION_TYPE_LABEL[type]}
        </Badge>
      }
    >
      <div className="space-y-3">
        {detail.payload.characterName ? (
          <Inset>
            <Eyebrow>Personaje</Eyebrow>
            <p className="mt-2 text-base font-semibold text-ink">
              {detail.payload.characterName}
            </p>
          </Inset>
        ) : null}

        {type === 'damage_scenario' ? <DamageScenarioDetail detail={detail} /> : null}

        <Inset>
          <Eyebrow>Payload técnico</Eyebrow>
          <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-[var(--ink-700)]">
            {JSON.stringify(detail.payload, null, 2)}
          </pre>
        </Inset>
      </div>
    </WindowPanel>
  );
}

type DetailState =
  | { kind: 'recommendation'; detail: RecommendationDetailResponse }
  | { kind: 'simulation'; detail: SimulationDetailResponse };

function HistoryDetail({
  kind,
  id,
  accessToken,
}: HistoryDetailClientProps & { accessToken: string }) {
  const ui = KIND_UI[kind];
  const [state, setState] = useState<DetailState | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    apiRequest<RecommendationDetailResponse | SimulationDetailResponse>(
      `${ui.path}/${id}`,
      { token: accessToken },
    )
      .then((detail) => {
        if (active) setState({ kind, detail } as DetailState);
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      });

    return () => {
      active = false;
    };
  }, [accessToken, id, kind, ui.path]);

  return (
    <>
      <HeaderStrip
        glyph="✦"
        eyebrow="Laboratorio · Historial"
        title={ui.title}
        description={`Registro #${id}`}
      >
        <div className="xl:ml-auto">
          <ButtonLink href="/simulator#history" variant="ghost">
            ← Volver al historial
          </ButtonLink>
        </div>
      </HeaderStrip>

      {error ? <Alert tone="error">{error}</Alert> : null}

      {!error && !state ? <Skeleton className="h-72 w-full bevel-14" /> : null}

      {state?.kind === 'recommendation' ? (
        <RecommendationDetail detail={state.detail} />
      ) : null}
      {state?.kind === 'simulation' ? (
        <SimulationDetail detail={state.detail} />
      ) : null}
    </>
  );
}

export function HistoryDetailClient({ kind, id }: HistoryDetailClientProps) {
  const { accessToken } = useAuthTokens();
  const isAuthHydrated = useHydratedValue();

  return (
    <main className={getAppShellClassName('compact')}>
      {!isAuthHydrated ? (
        <HeaderStripSkeleton />
      ) : accessToken ? (
        <HistoryDetail
          key={`${kind}-${id}`}
          kind={kind}
          id={id}
          accessToken={accessToken}
        />
      ) : (
        <SignInRequired
          title={KIND_UI[kind].title}
          description="Necesitas iniciar sesión para ver este registro."
        />
      )}
    </main>
  );
}
