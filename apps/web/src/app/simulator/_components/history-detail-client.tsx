'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { DamageComparisonChart } from '../../../components/charts/damage-comparison-chart';
import { Alert } from '../../../components/ui/alert';
import { Card } from '../../../components/ui/card';
import { loadAuthTokens } from '../../../lib/auth-storage';
import {
  apiRequest,
  CharacterStatKey,
  RecommendationDetailResponse,
  SimulationDetailResponse,
} from '../../../lib/api';
import { formatCharacterStatChip } from '../../../lib/character-stats';

type HistoryDetailClientProps = {
  kind: 'recommendation' | 'simulation';
  id: number;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function formatSigned(value: number, digits = 2) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(digits)}`;
}

function formatStatsSummary(
  statKeys: CharacterStatKey[],
  stats: Record<string, number | undefined> | undefined,
) {
  if (!stats) {
    return 'N/A';
  }

  const resolvedKeys =
    statKeys.length > 0
      ? statKeys
      : (Object.keys(stats).filter(Boolean) as CharacterStatKey[]);

  return resolvedKeys
    .map((statKey) => formatCharacterStatChip(statKey, stats[statKey]))
    .join(' · ');
}

export function HistoryDetailClient({ kind, id }: HistoryDetailClientProps) {
  const [accessToken] = useState(() => loadAuthTokens().accessToken);
  const [error, setError] = useState('');
  const [recommendationDetail, setRecommendationDetail] =
    useState<RecommendationDetailResponse | null>(null);
  const [simulationDetail, setSimulationDetail] =
    useState<SimulationDetailResponse | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const path =
      kind === 'recommendation'
        ? `/simulations/recommendations/${id}`
        : `/simulations/history/${id}`;

    apiRequest<RecommendationDetailResponse | SimulationDetailResponse>(path, {
      token: accessToken,
    })
      .then((response) => {
        if (kind === 'recommendation') {
          setRecommendationDetail(response as RecommendationDetailResponse);
          setSimulationDetail(null);
        } else {
          setSimulationDetail(response as SimulationDetailResponse);
          setRecommendationDetail(null);
        }
      })
      .catch((err: Error) => setError(err.message));
  }, [accessToken, id, kind]);

  const simulationIsDamageScenario = useMemo(() => {
    if (!simulationDetail) return false;
    return (
      simulationDetail.payload?.type === 'damage_scenario' ||
      simulationDetail.label.startsWith('damage-sim-')
    );
  }, [simulationDetail]);

  if (!accessToken) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6">
        <Card
          title="Detalle de historial"
          subtitle="Necesitas iniciar sesión para ver este detalle."
        >
          <Link
            className="text-sm font-semibold text-[var(--brand-700)] hover:underline"
            href="/"
          >
            Volver al inicio
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">
      <Card
        title={kind === 'recommendation' ? 'Detalle de recomendación' : 'Detalle de simulación'}
        subtitle={`ID #${id}`}
      >
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Link className="font-semibold text-[var(--brand-700)] hover:underline" href="/simulator">
            Volver al simulador
          </Link>
        </div>
      </Card>

      {error ? <Alert tone="error">{error}</Alert> : null}

      {!error && !recommendationDetail && !simulationDetail ? (
        <Card title="Cargando detalle" subtitle="Estamos recuperando la información seleccionada.">
          <p className="text-sm text-[var(--ink-500)]">Un momento...</p>
        </Card>
      ) : null}

      {recommendationDetail ? (
        <Card
          title={recommendationDetail.targetCharacter}
          subtitle={`Creado: ${formatDate(recommendationDetail.createdAt)}`}
        >
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">Puntaje</p>
              <p className="mt-1 text-sm font-semibold text-[var(--ink-900)]">
                {recommendationDetail.score}/100
              </p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">Nivel</p>
              <p className="mt-1 text-sm font-semibold text-[var(--ink-900)]">
                {recommendationDetail.level}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">Delta estimado</p>
              <p className="mt-1 text-sm font-semibold text-[var(--ink-900)]">
                {recommendationDetail.estimatedDeltaDmg}%
              </p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">Equipos compatibles</p>
              <p className="mt-1 text-sm font-semibold text-[var(--ink-900)]">
                {recommendationDetail.compatibleTeams}
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
                  <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">Explicación</p>
            <p className="mt-1 text-sm text-[var(--ink-700)]">{recommendationDetail.explanation}</p>
          </div>
        </Card>
      ) : null}

      {simulationDetail ? (
        <Card
          title={simulationDetail.label}
          subtitle={`Creado: ${formatDate(simulationDetail.createdAt)}`}
        >
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">Tipo</p>
              <p className="mt-1 text-sm font-semibold text-[var(--ink-900)]">
                {simulationDetail.payload?.type ?? 'N/A'}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">Delta %</p>
              <p className="mt-1 text-sm font-semibold text-[var(--ink-900)]">
                {typeof simulationDetail.payload?.deltaPercent === 'number'
                  ? `${formatSigned(simulationDetail.payload.deltaPercent)}%`
                  : 'N/A'}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">Personaje</p>
              <p className="mt-1 text-sm font-semibold text-[var(--ink-900)]">
                {simulationDetail.payload?.characterName ?? 'N/A'}
              </p>
            </div>
          </div>

          {simulationIsDamageScenario ? (
            <div className="mt-3 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3 text-sm text-[var(--ink-700)]">
                  <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">Stats base</p>
                  <p className="mt-1">
                    {formatStatsSummary(
                      (simulationDetail.payload?.statKeys ?? []) as CharacterStatKey[],
                      simulationDetail.payload?.baseStats,
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3 text-sm text-[var(--ink-700)]">
                  <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">Stats simuladas</p>
                  <p className="mt-1">
                    {formatStatsSummary(
                      (simulationDetail.payload?.statKeys ?? []) as CharacterStatKey[],
                      simulationDetail.payload?.simulatedStats,
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3 text-sm text-[var(--ink-700)]">
                  <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">Daño base</p>
                  <p className="mt-1 font-semibold text-[var(--ink-900)]">
                    {typeof simulationDetail.payload?.baseTeamDamage === 'number'
                      ? simulationDetail.payload.baseTeamDamage.toFixed(2)
                      : 'N/A'}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3 text-sm text-[var(--ink-700)] md:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">Daño simulado</p>
                  <p className="mt-1 font-semibold text-[var(--ink-900)]">
                    {typeof simulationDetail.payload?.simulatedTeamDamage === 'number'
                      ? simulationDetail.payload.simulatedTeamDamage.toFixed(2)
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {typeof simulationDetail.payload?.baseTeamDamage === 'number' &&
              typeof simulationDetail.payload?.simulatedTeamDamage === 'number' ? (
                <DamageComparisonChart
                  currentTotal={simulationDetail.payload.baseTeamDamage}
                  proposedTotal={simulationDetail.payload.simulatedTeamDamage}
                  currentLabel="Base"
                  proposedLabel="Simulado"
                  seriesName="Daño de escenario"
                  helpTextByLabel={{
                    Base: 'Base: daño estimado antes del ajuste.',
                    Simulado: 'Simulado: daño estimado después del ajuste.',
                  }}
                />
              ) : null}
            </div>
          ) : null}

          <div className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
            <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">Payload técnico</p>
            <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words text-xs text-[var(--ink-700)]">
              {JSON.stringify(simulationDetail.payload, null, 2)}
            </pre>
          </div>
        </Card>
      ) : null}
    </main>
  );
}
