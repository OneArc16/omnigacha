'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Alert } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { DamageComparisonChart } from '../../components/charts/damage-comparison-chart';
import { ScoreBreakdownChart } from '../../components/charts/score-breakdown-chart';
import { TeamMemberContributionChart } from '../../components/charts/team-member-contribution-chart';
import { clearAuthTokens, loadAuthTokens } from '../../lib/auth-storage';
import {
  apiRequest,
  Character,
  CursorPage,
  RecommendationRecord,
  RecommendationResponse,
  SimulationHistoryItem,
  UserCharacter,
} from '../../lib/api';

const PAGE_SIZE = 5;

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function SimulatorPage() {
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [catalog, setCatalog] = useState<Character[]>([]);
  const [owned, setOwned] = useState<UserCharacter[]>([]);
  const [targetCharacterId, setTargetCharacterId] = useState<number | null>(null);
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [recommendationHistory, setRecommendationHistory] = useState<RecommendationRecord[]>([]);
  const [recommendationNextCursor, setRecommendationNextCursor] = useState<number | null>(null);
  const [simulationHistory, setSimulationHistory] = useState<SimulationHistoryItem[]>([]);
  const [simulationNextCursor, setSimulationNextCursor] = useState<number | null>(null);
  const [loadingMoreRecommendations, setLoadingMoreRecommendations] = useState(false);
  const [loadingMoreSimulations, setLoadingMoreSimulations] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const tokens = loadAuthTokens();
    setAccessToken(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    Promise.all([
      apiRequest<CursorPage<Character>>('/characters?limit=100'),
      apiRequest<CursorPage<UserCharacter>>('/user-characters?limit=100', {
        token: accessToken,
      }),
      apiRequest<CursorPage<RecommendationRecord>>(
        `/simulations/recommendations?limit=${PAGE_SIZE}`,
        { token: accessToken },
      ),
      apiRequest<CursorPage<SimulationHistoryItem>>(
        `/simulations/history?limit=${PAGE_SIZE}`,
        { token: accessToken },
      ),
    ])
      .then(([characters, ownedCharacters, recommendations, simulations]) => {
        setCatalog(characters.items);
        setOwned(ownedCharacters.items);
        setRecommendationHistory(recommendations.items);
        setRecommendationNextCursor(recommendations.nextCursor);
        setSimulationHistory(simulations.items);
        setSimulationNextCursor(simulations.nextCursor);
      })
      .catch((err: Error) => setError(err.message));
  }, [accessToken]);

  const targetCharacter = useMemo(
    () => catalog.find((character) => character.id === targetCharacterId),
    [catalog, targetCharacterId],
  );

  async function loadRecommendationHistory(cursor: number | null, append: boolean) {
    if (!accessToken) return;

    const query = cursor
      ? `/simulations/recommendations?limit=${PAGE_SIZE}&cursor=${cursor}`
      : `/simulations/recommendations?limit=${PAGE_SIZE}`;

    const page = await apiRequest<CursorPage<RecommendationRecord>>(query, {
      token: accessToken,
    });

    setRecommendationHistory((prev) =>
      append ? [...prev, ...page.items] : page.items,
    );
    setRecommendationNextCursor(page.nextCursor);
  }

  async function loadSimulationHistory(cursor: number | null, append: boolean) {
    if (!accessToken) return;

    const query = cursor
      ? `/simulations/history?limit=${PAGE_SIZE}&cursor=${cursor}`
      : `/simulations/history?limit=${PAGE_SIZE}`;

    const page = await apiRequest<CursorPage<SimulationHistoryItem>>(query, {
      token: accessToken,
    });

    setSimulationHistory((prev) => (append ? [...prev, ...page.items] : page.items));
    setSimulationNextCursor(page.nextCursor);
  }

  async function handleRecommend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !targetCharacterId) return;

    setError('');
    setStatus('');

    try {
      const response = await apiRequest<RecommendationResponse>(
        '/simulations/recommend',
        {
          method: 'POST',
          token: accessToken,
          body: { targetCharacterId },
        },
      );

      setResult(response);
      setStatus('Recomendacion generada con el motor ligero.');

      await Promise.all([
        loadRecommendationHistory(null, false),
        loadSimulationHistory(null, false),
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No fue posible simular la recomendacion',
      );
    }
  }

  async function handleLoadMoreRecommendations() {
    if (!recommendationNextCursor || !accessToken) return;

    setLoadingMoreRecommendations(true);
    try {
      await loadRecommendationHistory(recommendationNextCursor, true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No fue posible cargar mas recomendaciones',
      );
    } finally {
      setLoadingMoreRecommendations(false);
    }
  }

  async function handleLoadMoreSimulations() {
    if (!simulationNextCursor || !accessToken) return;

    setLoadingMoreSimulations(true);
    try {
      await loadSimulationHistory(simulationNextCursor, true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No fue posible cargar mas simulaciones',
      );
    } finally {
      setLoadingMoreSimulations(false);
    }
  }

  async function handleLogout() {
    try {
      if (refreshToken) {
        await apiRequest('/auth/logout', {
          method: 'POST',
          body: { refreshToken },
        });
      }
    } finally {
      clearAuthTokens();
      setAccessToken('');
      setRefreshToken('');
    }
  }

  if (!accessToken) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6">
        <Card title="Simulador OmniGacha" subtitle="Necesitas iniciar sesion para usar la recomendacion.">
          <Link className="text-sm font-semibold text-[var(--brand-700)] hover:underline" href="/">
            Volver al inicio y autenticarme
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
      <Card title="Simulador de Recomendacion" subtitle="Base del motor de IA ligera para conveniencia de pull.">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <Link className="font-semibold text-[var(--brand-700)] hover:underline" href="/">
            Volver al panel principal
          </Link>
          <Button variant="ghost" onClick={handleLogout}>
            Cerrar sesion
          </Button>
        </div>
      </Card>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {status ? <Alert tone="success">{status}</Alert> : null}

      <Card title="1. Elegir objetivo" subtitle="Selecciona el personaje que quieres analizar.">
        <form className="flex flex-col gap-3 md:flex-row" onSubmit={handleRecommend}>
          <select
            className="w-full rounded-xl border border-[var(--line)] bg-white/90 px-3 py-2.5 text-sm text-[var(--ink-900)] transition focus:border-[var(--brand-500)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-200)]"
            value={targetCharacterId ?? ''}
            onChange={(event) =>
              setTargetCharacterId(
                event.target.value ? Number(event.target.value) : null,
              )
            }
            required
          >
            <option value="">Selecciona un personaje</option>
            {catalog.map((character) => (
              <option key={character.id} value={character.id}>
                {character.name} - {character.element} / {character.path}
              </option>
            ))}
          </select>
          <Button type="submit">Simular recomendacion</Button>
        </form>
      </Card>

      <Card title="2. Tu roster actual" subtitle={`Personajes registrados: ${owned.length}`}>
        {owned.length === 0 ? (
          <p className="text-sm text-[var(--ink-500)]">No tienes personajes registrados aun.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {owned.map((entry) => (
              <li key={entry.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3 text-sm">
                <p className="font-semibold text-[var(--ink-900)]">{entry.character.name}</p>
                <p className="text-[var(--ink-500)]">
                  {entry.character.element} / {entry.character.path}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {result ? (
        <Card
          title="3. Resultado de la recomendacion"
          subtitle={targetCharacter ? `Objetivo: ${targetCharacter.name}` : 'Resultado generado'}
        >
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">Score</p>
              <p className="mt-1 text-2xl font-bold text-[var(--ink-900)]">
                {result.recommendation.score}/100
              </p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">Nivel</p>
              <p className="mt-1 text-sm font-semibold text-[var(--ink-900)]">
                {result.recommendation.level}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">Delta estimado</p>
              <p className="mt-1 text-sm font-semibold text-[var(--ink-900)]">
                {result.recommendation.estimatedDeltaDmg}%
              </p>
            </div>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">Dano equipo actual</p>
              <p className="mt-1 text-sm font-semibold text-[var(--ink-900)]">
                {result.context.damageComparison.currentTeam.totalDamage.toFixed(2)}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">Dano equipo propuesto</p>
              <p className="mt-1 text-sm font-semibold text-[var(--ink-900)]">
                {result.context.damageComparison.proposedTeam.totalDamage.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <DamageComparisonChart
              currentTotal={result.context.damageComparison.currentTeam.totalDamage}
              proposedTotal={result.context.damageComparison.proposedTeam.totalDamage}
            />
            <ScoreBreakdownChart breakdown={result.context.scoringBreakdown} />
          </div>

          <div className="mt-3">
            <TeamMemberContributionChart
              currentMembers={result.context.damageComparison.currentTeam.members}
              proposedMembers={result.context.damageComparison.proposedTeam.members}
            />
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">
                Eje inferior - Grafica de dano
              </p>
              <p className="mt-1 text-sm text-[var(--ink-700)]">
                <span className="font-semibold">Actual:</span> dano estimado de tu mejor equipo actual.
              </p>
              <p className="text-sm text-[var(--ink-700)]">
                <span className="font-semibold">Propuesto:</span> dano estimado del equipo al incluir el personaje objetivo.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">
                Eje inferior - Grafica de score
              </p>
              <p className="mt-1 text-sm text-[var(--ink-700)]">
                <span className="font-semibold">Base:</span> puntaje inicial.
                {' '}<span className="font-semibold">Sinergia:</span> impacto de compatibilidades.
                {' '}<span className="font-semibold">Dano:</span> impacto del delta de dano.
              </p>
              <p className="text-sm text-[var(--ink-700)]">
                <span className="font-semibold">Rol:</span> bonus por necesidad de rol.
                {' '}<span className="font-semibold">Perfil:</span> balance ST/AoE/DoT/Burst.
                {' '}<span className="font-semibold">Penalizacion:</span> descuento si ya lo tienes.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">
                Eje inferior - Contribucion por miembro
              </p>
              <p className="mt-1 text-sm text-[var(--ink-700)]">
                Cada etiqueta representa un personaje del equipo propuesto final (maximo 4).
              </p>
              <p className="text-sm text-[var(--ink-700)]">
                Se comparan dos barras por personaje:{' '}
                <span className="font-semibold">Equipo actual</span> vs{' '}
                <span className="font-semibold">Equipo propuesto</span>.
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm text-[var(--ink-700)]">{result.recommendation.explanation}</p>

          <div className="mt-4">
            <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">Top sinergias detectadas</p>
            {result.context.topSynergies.length === 0 ? (
              <p className="mt-1 text-sm text-[var(--ink-500)]">Sin sinergias directas detectadas.</p>
            ) : (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--ink-700)]">
                {result.context.topSynergies.map((synergy) => (
                  <li key={synergy}>{synergy}</li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      ) : null}

      <Card title="4. Historial de recomendaciones" subtitle="Recomendaciones recientes generadas en tu cuenta.">
        {recommendationHistory.length === 0 ? (
          <p className="text-sm text-[var(--ink-500)]">Aun no hay recomendaciones guardadas.</p>
        ) : (
          <>
            <ul className="space-y-2">
              {recommendationHistory.map((entry) => (
                <li key={entry.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--ink-900)]">
                      {entry.targetCharacter} · {entry.level} · {entry.score}/100
                    </p>
                    <p className="text-xs text-[var(--ink-500)]">{formatDate(entry.createdAt)}</p>
                  </div>
                  <p className="mt-1 text-sm text-[var(--ink-600)]">{entry.explanation}</p>
                </li>
              ))}
            </ul>

            {recommendationNextCursor ? (
              <div className="mt-3">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={handleLoadMoreRecommendations}
                  disabled={loadingMoreRecommendations}
                >
                  {loadingMoreRecommendations ? 'Cargando...' : 'Cargar mas recomendaciones'}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </Card>

      <Card title="5. Historial de simulaciones" subtitle="Ejecuciones guardadas del motor ligero.">
        {simulationHistory.length === 0 ? (
          <p className="text-sm text-[var(--ink-500)]">Aun no hay simulaciones guardadas.</p>
        ) : (
          <>
            <ul className="space-y-2">
              {simulationHistory.map((entry) => (
                <li key={entry.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--ink-900)]">{entry.label}</p>
                    <p className="text-xs text-[var(--ink-500)]">{formatDate(entry.createdAt)}</p>
                  </div>
                  <p className="mt-1 text-xs text-[var(--ink-600)]">
                    Score: {entry.payload?.score ?? 'N/A'} · Nivel: {entry.payload?.level ?? 'N/A'} · Sinergias: {entry.payload?.synergyCount ?? 0}
                  </p>
                </li>
              ))}
            </ul>

            {simulationNextCursor ? (
              <div className="mt-3">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={handleLoadMoreSimulations}
                  disabled={loadingMoreSimulations}
                >
                  {loadingMoreSimulations ? 'Cargando...' : 'Cargar mas simulaciones'}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </Card>
    </main>
  );
}
