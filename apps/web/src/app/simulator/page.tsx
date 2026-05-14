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
  DamageScenarioResponse,
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

function asNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatSigned(value: number, digits = 2) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(digits)}`;
}

function formatPercentInput(value: number) {
  return String(Number((value * 100).toFixed(2)));
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
  const [simulatingDamage, setSimulatingDamage] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [scenarioCharacterId, setScenarioCharacterId] = useState<number | null>(null);
  const [atkInput, setAtkInput] = useState('0');
  const [critRateInput, setCritRateInput] = useState('0');
  const [critDamageInput, setCritDamageInput] = useState('0');
  const [speedInput, setSpeedInput] = useState('0');
  const [damageScenario, setDamageScenario] = useState<DamageScenarioResponse | null>(null);
  const [recommendationSearch, setRecommendationSearch] = useState('');
  const [recommendationLevelFilter, setRecommendationLevelFilter] = useState<
    'ALL' | RecommendationRecord['level']
  >('ALL');
  const [simulationSearch, setSimulationSearch] = useState('');
  const [simulationTypeFilter, setSimulationTypeFilter] = useState<
    'ALL' | 'recommendation' | 'damage_scenario'
  >('ALL');

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

  const scenarioCharacterEntry = useMemo(
    () =>
      owned.find((entry) => entry.character.id === scenarioCharacterId) ?? null,
    [owned, scenarioCharacterId],
  );

  useEffect(() => {
    if (owned.length === 0) {
      setScenarioCharacterId(null);
      setAtkInput('0');
      setCritRateInput('0');
      setCritDamageInput('0');
      setSpeedInput('0');
      return;
    }

    const hasSelected = owned.some(
      (entry) => entry.character.id === scenarioCharacterId,
    );

    if (!hasSelected) {
      const nextEntry = owned[0];
      setScenarioCharacterId(nextEntry.character.id);
      setAtkInput(String(nextEntry.atk));
      setCritRateInput(formatPercentInput(nextEntry.critRate));
      setCritDamageInput(formatPercentInput(nextEntry.critDamage));
      setSpeedInput(String(nextEntry.speed));
    }
  }, [owned, scenarioCharacterId]);

  const filteredRecommendationHistory = useMemo(() => {
    const search = recommendationSearch.trim().toLowerCase();

    return recommendationHistory.filter((entry) => {
      const matchesLevel =
        recommendationLevelFilter === 'ALL' ||
        entry.level === recommendationLevelFilter;

      const matchesSearch =
        search.length === 0 ||
        entry.targetCharacter.toLowerCase().includes(search) ||
        entry.explanation.toLowerCase().includes(search);

      return matchesLevel && matchesSearch;
    });
  }, [recommendationHistory, recommendationLevelFilter, recommendationSearch]);

  const filteredSimulationHistory = useMemo(() => {
    const search = simulationSearch.trim().toLowerCase();

    return simulationHistory.filter((entry) => {
      const resolvedType =
        entry.payload?.type ??
        (entry.label.startsWith('damage-sim-')
          ? 'damage_scenario'
          : 'recommendation');

      const matchesType =
        simulationTypeFilter === 'ALL' || resolvedType === simulationTypeFilter;

      const matchesSearch =
        search.length === 0 ||
        entry.label.toLowerCase().includes(search) ||
        (entry.payload?.characterName?.toLowerCase().includes(search) ?? false);

      return matchesType && matchesSearch;
    });
  }, [simulationHistory, simulationSearch, simulationTypeFilter]);

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

  async function handleSimulateDamage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !scenarioCharacterId || !scenarioCharacterEntry) return;

    setError('');
    setStatus('');
    setSimulatingDamage(true);

    try {
      const targetAtk = asNumber(atkInput);
      const targetCritRatePercent = asNumber(critRateInput);
      const targetCritDamagePercent = asNumber(critDamageInput);
      const targetSpeed = asNumber(speedInput);

      if (
        targetAtk < 1 ||
        targetCritRatePercent < 0 ||
        targetCritDamagePercent < 0 ||
        targetSpeed < 1
      ) {
        throw new Error('Ingresa stats simulados validos (ATK/SPD >= 1, CR/CD >= 0).');
      }

      const critRateBasePercent = scenarioCharacterEntry.critRate * 100;
      const critDamageBasePercent = scenarioCharacterEntry.critDamage * 100;

      const response = await apiRequest<DamageScenarioResponse>(
        '/simulations/damage',
        {
          method: 'POST',
          token: accessToken,
          body: {
            characterId: scenarioCharacterId,
            atkDelta: Math.round(targetAtk - scenarioCharacterEntry.atk),
            critRateDelta: targetCritRatePercent - critRateBasePercent,
            critDamageDelta: targetCritDamagePercent - critDamageBasePercent,
            speedDelta: Math.round(targetSpeed - scenarioCharacterEntry.speed),
          },
        },
      );

      setDamageScenario(response);
      setStatus('Escenario hipotetico simulado correctamente.');
      await loadSimulationHistory(null, false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No fue posible simular el escenario',
      );
    } finally {
      setSimulatingDamage(false);
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

      <Card title="3. Simulacion de escenarios" subtitle="Ajusta stats para evaluar un caso hipotetico en tu cuenta.">
        {owned.length === 0 ? (
          <p className="text-sm text-[var(--ink-500)]">
            Agrega personajes a tu cuenta para habilitar simulaciones de stats.
          </p>
        ) : (
          <form className="space-y-3" onSubmit={handleSimulateDamage}>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">
                  Personaje a simular
                </p>
                <select
                  className="w-full rounded-xl border border-[var(--line)] bg-white/90 px-3 py-2.5 text-sm text-[var(--ink-900)] transition focus:border-[var(--brand-500)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-200)]"
                  value={scenarioCharacterId ?? ''}
                  onChange={(event) => {
                    const selectedId = event.target.value
                      ? Number(event.target.value)
                      : null;
                    setScenarioCharacterId(selectedId);

                    const selectedEntry =
                      selectedId === null
                        ? null
                        : owned.find((entry) => entry.character.id === selectedId) ?? null;

                    if (!selectedEntry) {
                      setAtkInput('0');
                      setCritRateInput('0');
                      setCritDamageInput('0');
                      setSpeedInput('0');
                      return;
                    }

                    setAtkInput(String(selectedEntry.atk));
                    setCritRateInput(formatPercentInput(selectedEntry.critRate));
                    setCritDamageInput(formatPercentInput(selectedEntry.critDamage));
                    setSpeedInput(String(selectedEntry.speed));
                  }}
                  required
                >
                  <option value="">Selecciona un personaje</option>
                  {owned.map((entry) => (
                    <option key={entry.id} value={entry.character.id}>
                      {entry.character.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3 text-xs text-[var(--ink-700)]">
                <p className="font-semibold text-[var(--ink-900)]">Como funciona la simulacion</p>
                <p className="mt-1">
                  Ingresa los stats finales objetivo (no incrementos).
                </p>
                <p>
                  El sistema convierte internamente esos valores a cambios y recalcula el dano con formula multiplicativa (Base DMG, DMG%, DEF, RES, DMG Taken y Toughness).
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">ATK simulado</p>
                <input
                  className="w-full rounded-xl border border-[var(--line)] bg-white/90 px-3 py-2.5 text-sm text-[var(--ink-900)] transition focus:border-[var(--brand-500)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-200)]"
                  type="number"
                  step={1}
                  min={1}
                  max={99999}
                  value={atkInput}
                  onChange={(event) => setAtkInput(event.target.value)}
                />
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">CRIT Rate simulado (%)</p>
                <input
                  className="w-full rounded-xl border border-[var(--line)] bg-white/90 px-3 py-2.5 text-sm text-[var(--ink-900)] transition focus:border-[var(--brand-500)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-200)]"
                  type="number"
                  step={0.1}
                  min={0}
                  max={100}
                  value={critRateInput}
                  onChange={(event) => setCritRateInput(event.target.value)}
                />
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">CRIT DMG simulado (%)</p>
                <input
                  className="w-full rounded-xl border border-[var(--line)] bg-white/90 px-3 py-2.5 text-sm text-[var(--ink-900)] transition focus:border-[var(--brand-500)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-200)]"
                  type="number"
                  step={0.1}
                  min={0}
                  max={999}
                  value={critDamageInput}
                  onChange={(event) => setCritDamageInput(event.target.value)}
                />
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">SPD simulado</p>
                <input
                  className="w-full rounded-xl border border-[var(--line)] bg-white/90 px-3 py-2.5 text-sm text-[var(--ink-900)] transition focus:border-[var(--brand-500)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-200)]"
                  type="number"
                  step={1}
                  min={1}
                  max={999}
                  value={speedInput}
                  onChange={(event) => setSpeedInput(event.target.value)}
                />
              </div>
            </div>

            <Button type="submit" disabled={simulatingDamage || !scenarioCharacterId || !scenarioCharacterEntry}>
              {simulatingDamage ? 'Simulando...' : 'Simular escenario'}
            </Button>
          </form>
        )}

        {damageScenario ? (
          <div className="mt-4 space-y-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
            <p className="text-sm font-semibold text-[var(--ink-900)]">{damageScenario.summary}</p>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-[var(--line)] bg-white/80 p-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">Stats base</p>
                <p className="mt-1 text-[var(--ink-700)]">
                  ATK {damageScenario.baseStats.atk} · CR{' '}
                  {Math.round(damageScenario.baseStats.critRate * 100)}% · CD{' '}
                  {Math.round(damageScenario.baseStats.critDamage * 100)}% · SPD{' '}
                  {damageScenario.baseStats.speed}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-white/80 p-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">Stats simuladas</p>
                <p className="mt-1 text-[var(--ink-700)]">
                  ATK {damageScenario.simulatedStats.atk} · CR{' '}
                  {Math.round(damageScenario.simulatedStats.critRate * 100)}% · CD{' '}
                  {Math.round(damageScenario.simulatedStats.critDamage * 100)}% · SPD{' '}
                  {damageScenario.simulatedStats.speed}
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-[var(--line)] bg-white/80 p-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">Dano base</p>
                <p className="mt-1 font-semibold text-[var(--ink-900)]">
                  {damageScenario.baseTeamDamage.toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-white/80 p-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">Dano simulado</p>
                <p className="mt-1 font-semibold text-[var(--ink-900)]">
                  {damageScenario.simulatedTeamDamage.toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-white/80 p-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">Delta</p>
                <p className={`mt-1 font-semibold ${damageScenario.deltaPercent >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatSigned(damageScenario.deltaPercent)}%
                </p>
              </div>
            </div>

            <DamageComparisonChart
              currentTotal={damageScenario.baseTeamDamage}
              proposedTotal={damageScenario.simulatedTeamDamage}
              currentLabel="Base"
              proposedLabel="Simulado"
              seriesName="Dano de escenario"
              helpTextByLabel={{
                Base: 'Base: dano estimado del equipo antes de aplicar tus cambios de stats.',
                Simulado: 'Simulado: dano estimado luego de aplicar los deltas del escenario.',
              }}
            />
          </div>
        ) : null}
      </Card>

      {result ? (
        <Card
          title="4. Resultado de la recomendacion"
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

      <Card title="5. Historial de recomendaciones" subtitle="Recomendaciones recientes generadas en tu cuenta.">
        <div className="mb-3 grid gap-3 md:grid-cols-2">
          <input
            className="w-full rounded-xl border border-[var(--line)] bg-white/90 px-3 py-2.5 text-sm text-[var(--ink-900)] transition focus:border-[var(--brand-500)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-200)]"
            placeholder="Buscar por personaje o explicacion"
            value={recommendationSearch}
            onChange={(event) => setRecommendationSearch(event.target.value)}
          />
          <select
            className="w-full rounded-xl border border-[var(--line)] bg-white/90 px-3 py-2.5 text-sm text-[var(--ink-900)] transition focus:border-[var(--brand-500)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-200)]"
            value={recommendationLevelFilter}
            onChange={(event) =>
              setRecommendationLevelFilter(
                event.target.value as
                  | 'ALL'
                  | 'NO_RECOMENDADO'
                  | 'SITUACIONAL'
                  | 'RECOMENDADO'
                  | 'MUY_RECOMENDADO',
              )
            }
          >
            <option value="ALL">Todos los niveles</option>
            <option value="NO_RECOMENDADO">NO_RECOMENDADO</option>
            <option value="SITUACIONAL">SITUACIONAL</option>
            <option value="RECOMENDADO">RECOMENDADO</option>
            <option value="MUY_RECOMENDADO">MUY_RECOMENDADO</option>
          </select>
        </div>

        {recommendationHistory.length === 0 ? (
          <p className="text-sm text-[var(--ink-500)]">Aun no hay recomendaciones guardadas.</p>
        ) : (
          <>
            {filteredRecommendationHistory.length === 0 ? (
              <p className="text-sm text-[var(--ink-500)]">
                No hay resultados con los filtros actuales.
              </p>
            ) : (
              <ul className="space-y-2">
                {filteredRecommendationHistory.map((entry) => (
                <li key={entry.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--ink-900)]">
                      {entry.targetCharacter} · {entry.level} · {entry.score}/100
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-[var(--ink-500)]">{formatDate(entry.createdAt)}</p>
                      <Link
                        className="inline-flex items-center rounded-xl bg-[var(--surface)] px-2 py-1 text-xs font-semibold text-[var(--brand-700)] ring-1 ring-[var(--line)] hover:bg-[var(--surface-2)]"
                        href={`/simulator/recommendations/${entry.id}`}
                      >
                        Ver detalle
                      </Link>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-[var(--ink-600)]">{entry.explanation}</p>
                </li>
                ))}
              </ul>
            )}

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

      <Card title="6. Historial de simulaciones" subtitle="Ejecuciones guardadas del motor ligero.">
        <div className="mb-3 grid gap-3 md:grid-cols-2">
          <input
            className="w-full rounded-xl border border-[var(--line)] bg-white/90 px-3 py-2.5 text-sm text-[var(--ink-900)] transition focus:border-[var(--brand-500)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-200)]"
            placeholder="Buscar por etiqueta o personaje"
            value={simulationSearch}
            onChange={(event) => setSimulationSearch(event.target.value)}
          />
          <select
            className="w-full rounded-xl border border-[var(--line)] bg-white/90 px-3 py-2.5 text-sm text-[var(--ink-900)] transition focus:border-[var(--brand-500)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-200)]"
            value={simulationTypeFilter}
            onChange={(event) =>
              setSimulationTypeFilter(
                event.target.value as 'ALL' | 'recommendation' | 'damage_scenario',
              )
            }
          >
            <option value="ALL">Todos los tipos</option>
            <option value="recommendation">recommendation</option>
            <option value="damage_scenario">damage_scenario</option>
          </select>
        </div>

        {simulationHistory.length === 0 ? (
          <p className="text-sm text-[var(--ink-500)]">Aun no hay simulaciones guardadas.</p>
        ) : (
          <>
            {filteredSimulationHistory.length === 0 ? (
              <p className="text-sm text-[var(--ink-500)]">
                No hay simulaciones que coincidan con los filtros.
              </p>
            ) : (
              <ul className="space-y-2">
                {filteredSimulationHistory.map((entry) => (
                <li key={entry.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--ink-900)]">{entry.label}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-[var(--ink-500)]">{formatDate(entry.createdAt)}</p>
                      <Link
                        className="inline-flex items-center rounded-xl bg-[var(--surface)] px-2 py-1 text-xs font-semibold text-[var(--brand-700)] ring-1 ring-[var(--line)] hover:bg-[var(--surface-2)]"
                        href={`/simulator/history/${entry.id}`}
                      >
                        Ver detalle
                      </Link>
                    </div>
                  </div>
                  {entry.payload?.type === 'damage_scenario' || entry.label.startsWith('damage-sim-') ? (
                    <p className="mt-1 text-xs text-[var(--ink-600)]">
                      Personaje: {entry.payload?.characterName ?? 'N/A'} · Dano base:{' '}
                      {typeof entry.payload?.baseTeamDamage === 'number'
                        ? entry.payload.baseTeamDamage.toFixed(2)
                        : 'N/A'}{' '}
                      · Dano simulado:{' '}
                      {typeof entry.payload?.simulatedTeamDamage === 'number'
                        ? entry.payload.simulatedTeamDamage.toFixed(2)
                        : 'N/A'}{' '}
                      · Delta:{' '}
                      {typeof entry.payload?.deltaPercent === 'number'
                        ? formatSigned(entry.payload.deltaPercent)
                        : 'N/A'}
                      %
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-[var(--ink-600)]">
                      Score: {entry.payload?.score ?? 'N/A'} · Nivel: {entry.payload?.level ?? 'N/A'} · Sinergias: {entry.payload?.synergyCount ?? 0}
                    </p>
                  )}
                </li>
                ))}
              </ul>
            )}

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
