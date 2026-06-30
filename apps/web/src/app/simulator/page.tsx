"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { ButtonLink } from "../../components/ui/button-link";
import { Combobox } from "../../components/ui/combobox";
import { Input } from "../../components/ui/input";
import { SegmentedTabs } from "../../components/ui/segmented-tabs";
import { Skeleton } from "../../components/ui/skeleton";
import { WindowPanel } from "../../components/ui/window-panel";
import { DamageComparisonChart } from "../../components/charts/damage-comparison-chart";
import { ScoreBreakdownChart } from "../../components/charts/score-breakdown-chart";
import { TeamMemberContributionChart } from "../../components/charts/team-member-contribution-chart";
import {
  getAppBackdropClassName,
  getAppShellClassName,
  SIMULATOR_HERO_GRID_CLASSNAME,
  SIMULATOR_HISTORY_GRID_CLASSNAME,
  SIMULATOR_RECOMMEND_GRID_CLASSNAME,
  SIMULATOR_SCENARIO_GRID_CLASSNAME,
} from "../../components/layout/page-shell";
import {
  clearAuthTokens,
  useAuthTokens,
  useHydratedValue,
} from "../../lib/auth-storage";
import {
  apiRequest,
  Character,
  CharacterStatKey,
  CharacterStatsMap,
  CursorPage,
  DamageScenarioResponse,
  RecommendationRecord,
  RecommendationResponse,
  SimulationHistoryItem,
  UserCharacter,
} from "../../lib/api";
import {
  buildCharacterStatsFormValues,
  buildEmptyCharacterStatsFormValues,
  CHARACTER_STAT_UI,
  CharacterStatsFormValues,
  formatCharacterStatChip,
  fromStatInputValue,
  getVisibleCharacterStatKeys,
} from "../../lib/character-stats";
import { toast } from "sonner";

const PAGE_SIZE = 5;
type SimulatorView = "recommend" | "scenario" | "history";

const SELECT_CLASSNAME =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--surface-3)] px-3 py-2.5 text-sm text-[var(--ink-900)] transition focus:border-[var(--brand-500)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-200)]";

const SIMULATOR_VIEW_OPTIONS = [
  {
    value: "recommend",
    label: "Recomendación",
    description: "Define objetivo, stats y resultado sugerido.",
  },
  {
    value: "scenario",
    label: "Escenarios",
    description: "Simula cambios reales con equipo manual o auto.",
  },
  {
    value: "history",
    label: "Historial",
    description: "Consulta recomendaciones y simulaciones guardadas.",
  },
] satisfies {
  value: SimulatorView;
  label: string;
  description: string;
}[];

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatSigned(value: number, digits = 2) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;
}

function levelBadgeVariant(level: RecommendationRecord["level"]) {
  switch (level) {
    case "NO_RECOMENDADO":
      return "danger";
    case "SITUACIONAL":
      return "warning";
    case "RECOMENDADO":
      return "brand";
    case "MUY_RECOMENDADO":
      return "success";
    default:
      return "neutral";
  }
}

function recommendationTargetStatsSourceLabel(
  source: NonNullable<
    RecommendationResponse["context"]["appliedTargetStats"]
  >["source"],
) {
  switch (source) {
    case "manual":
      return "manual";
    case "roster":
      return "tu roster";
    case "catalog_base":
      return "base de catálogo";
    default:
      return "desconocida";
  }
}

function resolveErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function buildStatsPayload(
  statKeys: CharacterStatKey[],
  formValues: CharacterStatsFormValues,
) {
  const stats: CharacterStatsMap = {};

  for (const statKey of statKeys) {
    const rawValue = formValues[statKey];
    const parsedValue = fromStatInputValue(statKey, rawValue);

    if (parsedValue === null) {
      throw new Error(
        `Completa el campo ${CHARACTER_STAT_UI[statKey].label} con un valor válido.`,
      );
    }

    if (
      (statKey === "hp" ||
        statKey === "atk" ||
        statKey === "def" ||
        statKey === "speed") &&
      parsedValue < 1
    ) {
      throw new Error(
        `${CHARACTER_STAT_UI[statKey].label} debe ser mayor o igual a 1.`,
      );
    }

    if (parsedValue < 0) {
      throw new Error(
        `${CHARACTER_STAT_UI[statKey].label} no puede ser negativo.`,
      );
    }

    stats[statKey] = parsedValue;
  }

  return stats;
}

function formatStatSummary(statKeys: CharacterStatKey[], stats: CharacterStatsMap) {
  return statKeys.map((statKey) => formatCharacterStatChip(statKey, stats[statKey]));
}

function buildCharacterOptionLabel(character: Character) {
  return `${character.name} - ${character.element} / ${character.path}`;
}

function buildCharacterSearchText(character: Character) {
  return [character.name, ...character.aliases.map((alias) => alias.alias)].join(
    " ",
  );
}

export default function SimulatorPage() {
  const { accessToken, refreshToken } = useAuthTokens();
  const isAuthHydrated = useHydratedValue();
  const [catalog, setCatalog] = useState<Character[]>([]);
  const [owned, setOwned] = useState<UserCharacter[]>([]);
  const [targetCharacterId, setTargetCharacterId] = useState<number | null>(
    null,
  );
  const [useCustomRecommendationStats, setUseCustomRecommendationStats] =
    useState(false);
  const [recommendStatInputs, setRecommendStatInputs] =
    useState<CharacterStatsFormValues>(buildEmptyCharacterStatsFormValues());
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [recommendationHistory, setRecommendationHistory] = useState<
    RecommendationRecord[]
  >([]);
  const [recommendationNextCursor, setRecommendationNextCursor] = useState<
    number | null
  >(null);
  const [simulationHistory, setSimulationHistory] = useState<
    SimulationHistoryItem[]
  >([]);
  const [simulationNextCursor, setSimulationNextCursor] = useState<
    number | null
  >(null);
  const [loadingMoreRecommendations, setLoadingMoreRecommendations] =
    useState(false);
  const [loadingMoreSimulations, setLoadingMoreSimulations] = useState(false);
  const [hasBootstrapped, setHasBootstrapped] = useState(false);
  const [simulatingDamage, setSimulatingDamage] = useState(false);
  const [pageError, setPageError] = useState("");
  const [activeView, setActiveView] = useState<SimulatorView>("recommend");
  const [scenarioCharacterId, setScenarioCharacterId] = useState<number | null>(
    null,
  );
  const [useCustomTeam, setUseCustomTeam] = useState(false);
  const [teammateSlots, setTeammateSlots] = useState<string[]>(["", "", ""]);
  const [scenarioStatInputs, setScenarioStatInputs] =
    useState<CharacterStatsFormValues>(buildEmptyCharacterStatsFormValues());
  const [damageScenario, setDamageScenario] =
    useState<DamageScenarioResponse | null>(null);
  const [recommendationSearch, setRecommendationSearch] = useState("");
  const [recommendationLevelFilter, setRecommendationLevelFilter] = useState<
    "ALL" | RecommendationRecord["level"]
  >("ALL");
  const [simulationSearch, setSimulationSearch] = useState("");
  const [simulationTypeFilter, setSimulationTypeFilter] = useState<
    "ALL" | "recommendation" | "damage_scenario"
  >("ALL");

  useEffect(() => {
    if (!accessToken) return;

    Promise.all([
      apiRequest<CursorPage<Character>>("/characters?limit=100"),
      apiRequest<CursorPage<UserCharacter>>("/user-characters?limit=100", {
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
        setPageError("");
        const firstEntry = ownedCharacters.items[0] ?? null;
        setScenarioCharacterId(firstEntry?.character.id ?? null);
        setTeammateSlots(["", "", ""]);
        setScenarioStatInputs(
          firstEntry
            ? buildCharacterStatsFormValues(firstEntry.stats)
            : buildEmptyCharacterStatsFormValues(),
        );
        setRecommendationHistory(recommendations.items);
        setRecommendationNextCursor(recommendations.nextCursor);
        setSimulationHistory(simulations.items);
        setSimulationNextCursor(simulations.nextCursor);
      })
      .catch((err: Error) => {
        setPageError(err.message);
        toast.error(err.message);
      })
      .finally(() => setHasBootstrapped(true));
  }, [accessToken]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncViewFromHash = () => {
      switch (window.location.hash) {
        case "#scenario-simulation":
          setActiveView("scenario");
          break;
        case "#recommendation-history":
        case "#simulation-history":
        case "#history":
          setActiveView("history");
          break;
        case "#recommend-target":
        case "#recommendation-result":
          setActiveView("recommend");
          break;
        default:
          break;
      }
    };

    syncViewFromHash();
    window.addEventListener("hashchange", syncViewFromHash);

    return () => {
      window.removeEventListener("hashchange", syncViewFromHash);
    };
  }, []);

  const isBootstrapping = Boolean(accessToken) && !hasBootstrapped;

  const targetCharacter = useMemo(
    () => catalog.find((character) => character.id === targetCharacterId),
    [catalog, targetCharacterId],
  );

  const scenarioCharacterEntry = useMemo(
    () =>
      owned.find((entry) => entry.character.id === scenarioCharacterId) ?? null,
    [owned, scenarioCharacterId],
  );

  const recommendationStatKeys = useMemo(
    () => getVisibleCharacterStatKeys(targetCharacter ?? null),
    [targetCharacter],
  );

  const scenarioStatKeys = useMemo(
    () => getVisibleCharacterStatKeys(scenarioCharacterEntry?.character ?? null),
    [scenarioCharacterEntry],
  );

  const filteredRecommendationHistory = useMemo(() => {
    const search = recommendationSearch.trim().toLowerCase();

    return recommendationHistory.filter((entry) => {
      const matchesLevel =
        recommendationLevelFilter === "ALL" ||
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
        (entry.label.startsWith("damage-sim-")
          ? "damage_scenario"
          : "recommendation");

      const matchesType =
        simulationTypeFilter === "ALL" || resolvedType === simulationTypeFilter;

      const matchesSearch =
        search.length === 0 ||
        entry.label.toLowerCase().includes(search) ||
        (entry.payload?.characterName?.toLowerCase().includes(search) ?? false);

      return matchesType && matchesSearch;
    });
  }, [simulationHistory, simulationSearch, simulationTypeFilter]);

  const availableTeammates = useMemo(
    () =>
      owned.filter(
        (entry) =>
          scenarioCharacterId === null ||
          entry.character.id !== scenarioCharacterId,
      ),
    [owned, scenarioCharacterId],
  );

  const selectedTeammateIds = useMemo(
    () =>
      teammateSlots
        .filter((value): value is string => value.length > 0)
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value)),
    [teammateSlots],
  );

  const targetCharacterOptions = useMemo(
    () =>
      catalog.map((character) => ({
        value: String(character.id),
        label: buildCharacterOptionLabel(character),
        searchText: buildCharacterSearchText(character),
      })),
    [catalog],
  );

  const scenarioCharacterOptions = useMemo(
    () =>
      owned.map((entry) => ({
        value: String(entry.character.id),
        label: buildCharacterOptionLabel(entry.character),
        searchText: buildCharacterSearchText(entry.character),
      })),
    [owned],
  );

  async function loadRecommendationHistory(
    cursor: number | null,
    append: boolean,
  ) {
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

    setSimulationHistory((prev) =>
      append ? [...prev, ...page.items] : page.items,
    );
    setSimulationNextCursor(page.nextCursor);
  }

  async function handleRecommend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !targetCharacterId) return;

    setPageError("");

    try {
      const body: {
        targetCharacterId: number;
        targetStats?: CharacterStatsMap;
      } = { targetCharacterId };

      if (useCustomRecommendationStats) {
        body.targetStats = buildStatsPayload(
          recommendationStatKeys,
          recommendStatInputs,
        );
      }

      const response = await apiRequest<RecommendationResponse>(
        "/simulations/recommend",
        {
          method: "POST",
          token: accessToken,
          body,
        },
      );

      setResult(response);
      setActiveView("recommend");
      toast.success("Recomendación generada con el motor ligero.");

      await Promise.all([
        loadRecommendationHistory(null, false),
        loadSimulationHistory(null, false),
      ]);
    } catch (err) {
      toast.error(
        resolveErrorMessage(err, "No fue posible simular la recomendación"),
      );
    }
  }

  async function handleSimulateDamage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !scenarioCharacterId || !scenarioCharacterEntry) return;

    setPageError("");
    setSimulatingDamage(true);

    try {
      const teammateCharacterIds = useCustomTeam ? selectedTeammateIds : [];
      const stats = buildStatsPayload(scenarioStatKeys, scenarioStatInputs);

      if (useCustomTeam && teammateCharacterIds.length === 0) {
        throw new Error(
          "Selecciona al menos 1 compañero para activar el equipo personalizado.",
        );
      }

      const response = await apiRequest<DamageScenarioResponse>(
        "/simulations/damage",
        {
          method: "POST",
          token: accessToken,
          body: {
            characterId: scenarioCharacterId,
            stats,
            teammateCharacterIds: teammateCharacterIds.length
              ? teammateCharacterIds
              : undefined,
          },
        },
      );

      setDamageScenario(response);
      setActiveView("scenario");
      toast.success("Escenario hipotético simulado correctamente.");
      await loadSimulationHistory(null, false);
    } catch (err) {
      toast.error(
        resolveErrorMessage(err, "No fue posible simular el escenario"),
      );
    } finally {
      setSimulatingDamage(false);
    }
  }

  function applyRecommendationTargetDefaults(
    selectedId: number | null,
    ownedList = owned,
    catalogList = catalog,
  ) {
    if (!selectedId) {
      setRecommendStatInputs(buildEmptyCharacterStatsFormValues());
      return;
    }

    const ownedEntry =
      ownedList.find((entry) => entry.character.id === selectedId) ?? null;
    if (ownedEntry) {
      setRecommendStatInputs(buildCharacterStatsFormValues(ownedEntry.stats));
      return;
    }

    const catalogEntry =
      catalogList.find((character) => character.id === selectedId) ?? null;
    if (catalogEntry) {
      setRecommendStatInputs(
        buildCharacterStatsFormValues(catalogEntry.defaultStats),
      );
      return;
    }

    setRecommendStatInputs(buildEmptyCharacterStatsFormValues());
  }

  function applyScenarioCharacterDefaults(selectedEntry: UserCharacter | null) {
    setScenarioStatInputs(
      selectedEntry
        ? buildCharacterStatsFormValues(selectedEntry.stats)
        : buildEmptyCharacterStatsFormValues(),
    );
  }

  function handleRecommendationStatChange(
    statKey: CharacterStatKey,
    value: string,
  ) {
    setRecommendStatInputs((current) => ({
      ...current,
      [statKey]: value,
    }));
  }

  function handleScenarioStatChange(statKey: CharacterStatKey, value: string) {
    setScenarioStatInputs((current) => ({
      ...current,
      [statKey]: value,
    }));
  }

  function handleTeammateSlotChange(slotIndex: number, value: string) {
    setPageError("");

    if (
      value &&
      teammateSlots.some(
        (slotValue, index) => index !== slotIndex && slotValue === value,
      )
    ) {
      toast.error("No repitas compañeros dentro del mismo equipo.");
      return;
    }

    setTeammateSlots((current) =>
      current.map((slotValue, index) =>
        index === slotIndex ? value : slotValue,
      ),
    );
  }

  async function handleLoadMoreRecommendations() {
    if (!recommendationNextCursor || !accessToken) return;

    setLoadingMoreRecommendations(true);
    try {
      await loadRecommendationHistory(recommendationNextCursor, true);
    } catch (err) {
      toast.error(
        resolveErrorMessage(
          err,
          "No fue posible cargar más recomendaciones",
        ),
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
      toast.error(
        resolveErrorMessage(err, "No fue posible cargar más simulaciones"),
      );
    } finally {
      setLoadingMoreSimulations(false);
    }
  }

  async function handleLogout() {
    try {
      if (refreshToken) {
        await apiRequest("/auth/logout", {
          method: "POST",
          body: { refreshToken },
        });
      }
      toast.success("Sesión cerrada.");
    } finally {
      clearAuthTokens();
    }
  }
  const simulatorShellClassName = getAppShellClassName("wide");
  const compactShellClassName = getAppShellClassName("compact");
  const simulatorBackdropClassName = getAppBackdropClassName("simulator");
  const compactBackdropClassName = getAppBackdropClassName("compact");

  if (!isAuthHydrated) {
    return (
      <main className={simulatorShellClassName}>
        <div className={simulatorBackdropClassName} />

        <WindowPanel
          title="Laboratorio de simulación"
          subtitle="Preparando el entorno de simulación."
          action={<Badge variant="neutral">Inicializando</Badge>}
        >
          <div className={SIMULATOR_HERO_GRID_CLASSNAME}>
            <div className="space-y-3">
              <Skeleton className="h-6 w-32 rounded-full" />
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
          title="Laboratorio de simulación"
          subtitle="Necesitas iniciar sesión para acceder al motor de recomendación."
          action={<Badge variant="warning">Acceso requerido</Badge>}
        >
          <div className="space-y-4">
            <p className="max-w-2xl text-sm leading-7 text-[var(--ink-600)]">
              El simulador usa tu roster, tus historiales y tus stats
              persistidos. Por eso lo protegemos dentro de la sesión.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/">Volver al espacio de trabajo</ButtonLink>
              <ButtonLink href="/" variant="ghost">
                Ir al inicio de sesión
              </ButtonLink>
            </div>
          </div>
        </WindowPanel>
      </main>
    );
  }

  if (isBootstrapping) {
    return (
      <main className={simulatorShellClassName}>
        <div className={simulatorBackdropClassName} />

        <WindowPanel
          title="Laboratorio de simulación"
          subtitle="Cargando catálogo, roster, recomendaciones e historial."
          action={<Badge variant="brand">Sincronizando</Badge>}
        >
          <div className={SIMULATOR_HERO_GRID_CLASSNAME}>
            <div className="space-y-3">
              <Skeleton className="h-9 w-40 rounded-full" />
              <Skeleton className="h-12 w-full rounded-2xl" />
              <Skeleton className="h-12 w-full rounded-2xl" />
              <Skeleton className="h-40 w-full rounded-[28px]" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-3xl" />
              <Skeleton className="h-[34rem] w-full rounded-[28px]" />
            </div>
          </div>
        </WindowPanel>
      </main>
    );
  }

  return (
    <main className={simulatorShellClassName}>
      <div className={simulatorBackdropClassName} />

      <WindowPanel
        title="Laboratorio de simulación"
        subtitle="Motor ligero para recomendación de pulls y simulación de daño con contexto de equipo."
        action={
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/" variant="ghost">
              Espacio de trabajo
            </ButtonLink>
            <Button variant="ghost" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </div>
        }
      >
        <div className={SIMULATOR_HERO_GRID_CLASSNAME}>
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-500)]">
              Panel de análisis
            </div>
            <h1 className="max-w-4xl text-4xl font-black tracking-tight text-[var(--ink-900)] sm:text-5xl">
              Recomendaciones y escenarios en ventanas activas, no en una
              página interminable.
            </h1>
            <p className="max-w-3xl text-base leading-7 text-[var(--ink-600)]">
              Compactamos el simulador para que puedas fijar objetivo, ajustar
              stats, comparar resultados y revisar historiales sin perder el
              contexto cada vez que cambias de tarea.
            </p>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Sinergias filtradas</Badge>
              <Badge variant="outline">Stats manuales</Badge>
              <Badge variant="outline">Equipo personalizado</Badge>
              <Badge variant="outline">Toasts en tiempo real</Badge>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)]/85 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-500)]">
                Roster
              </p>
              <p className="mt-2 text-3xl font-black text-[var(--ink-900)]">
                {owned.length}
              </p>
              <p className="mt-1 text-sm text-[var(--ink-600)]">
                personajes disponibles para simulación.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)]/85 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-500)]">
                Historial
              </p>
              <p className="mt-2 text-3xl font-black text-[var(--ink-900)]">
                {recommendationHistory.length + simulationHistory.length}
              </p>
              <p className="mt-1 text-sm text-[var(--ink-600)]">
                registros cargados en la sesión actual.
              </p>
            </div>
          </div>
        </div>
      </WindowPanel>

      {pageError ? (
        <div className="rounded-2xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {pageError}
        </div>
      ) : null}

      <SegmentedTabs
        value={activeView}
        onValueChange={setActiveView}
        options={SIMULATOR_VIEW_OPTIONS}
      />

      {activeView === "recommend" ? (
        <section
          id="recommend-target"
          className={SIMULATOR_RECOMMEND_GRID_CLASSNAME}
        >
          <div className="space-y-6">
            <WindowPanel
              title="Objetivo de recomendación"
              subtitle="Selecciona el personaje y decide si quieres fijar stats manuales para evitar recomendaciones sesgadas."
              action={
                targetCharacter ? (
                  <Badge variant="brand">{targetCharacter.name}</Badge>
                ) : (
                  <Badge variant="neutral">Sin objetivo</Badge>
                )
              }
            >
              <form className="space-y-4" onSubmit={handleRecommend}>
                <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                  <Combobox
                    className="w-full"
                    options={targetCharacterOptions}
                    value={targetCharacterId ? String(targetCharacterId) : ""}
                    onValueChange={(nextValue) => {
                      const nextTargetId = nextValue ? Number(nextValue) : null;
                      setTargetCharacterId(nextTargetId);
                      applyRecommendationTargetDefaults(nextTargetId);
                    }}
                    placeholder="Selecciona un personaje"
                    searchPlaceholder="Busca por nombre o alias"
                    emptyText="No hay personajes que coincidan."
                  />
                  <Button
                    type="submit"
                    disabled={!targetCharacterId || catalog.length === 0}
                  >
                    Simular recomendación
                  </Button>
                </div>

                {targetCharacter ? (
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="brand">{targetCharacter.element}</Badge>
                      <Badge variant="outline">{targetCharacter.path}</Badge>
                      <Badge variant="neutral">{targetCharacter.role}</Badge>
                      {targetCharacter.tagBuckets.archetypes.map((archetype) => (
                        <Badge key={archetype} variant="success">
                          {archetype}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-3 text-sm text-[var(--ink-600)]">
                      Base actual del catálogo:{" "}
                      {formatStatSummary(
                        recommendationStatKeys,
                        targetCharacter.defaultStats,
                      ).join(" · ")}
                    </p>
                  </div>
                ) : null}

                {catalog.length === 0 ? (
                  <p className="text-sm text-[var(--ink-500)]">
                    No hay personajes disponibles en catálogo. Verifica la
                    carga del API o el seed.
                  </p>
                ) : null}

                <label className="flex items-center gap-2 text-sm text-[var(--ink-700)]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--brand-500)]"
                    checked={useCustomRecommendationStats}
                    onChange={(event) =>
                      setUseCustomRecommendationStats(
                        event.currentTarget.checked,
                      )
                    }
                  />
                  Usar stats personalizados para esta recomendación
                </label>

                {useCustomRecommendationStats ? (
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {recommendationStatKeys.map((statKey) => (
                        <div key={`recommend-${statKey}`}>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">
                            {CHARACTER_STAT_UI[statKey].label}
                          </label>
                          <Input
                            type="number"
                            min={CHARACTER_STAT_UI[statKey].min}
                            step={CHARACTER_STAT_UI[statKey].step}
                            value={recommendStatInputs[statKey]}
                            onChange={(event) =>
                              handleRecommendationStatChange(
                                statKey,
                                event.target.value,
                              )
                            }
                            required
                          />
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-[var(--ink-500)]">
                      Si el personaje ya existe en tu roster, estos valores
                      sobreescriben solo esta simulación. No se guardan.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--surface-2)]/70 p-4 text-sm text-[var(--ink-500)]">
                    Si no activas stats manuales, el motor prioriza los stats
                    del roster y, si no existen, cae al catálogo base.
                  </div>
                )}
              </form>
            </WindowPanel>

            <WindowPanel
              title="Roster detectado"
              subtitle="El objetivo y la sinergia se calculan sobre estos personajes registrados."
              action={
                <Badge variant="neutral">
                  {owned.length} disponible{owned.length === 1 ? "" : "s"}
                </Badge>
              }
            >
              {owned.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--surface-2)] p-5 text-sm text-[var(--ink-500)]">
                  No tienes personajes registrados aún en tu cuenta principal.
                </div>
              ) : (
                <div className="max-h-[36rem] space-y-3 overflow-y-auto pr-1">
                  {owned.map((entry) => (
                    <article
                      key={entry.id}
                      className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--ink-900)]">
                            {entry.character.name}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <Badge variant="brand">
                              {entry.character.element}
                            </Badge>
                            <Badge variant="outline">
                              {entry.character.path}
                            </Badge>
                          </div>
                        </div>
                        {targetCharacterId === entry.character.id ? (
                          <Badge variant="success">Objetivo actual</Badge>
                        ) : null}
                      </div>
                      <p className="mt-3 text-xs text-[var(--ink-500)]">
                        LVL {entry.level} · E{entry.eidolon} ·{" "}
                        {formatStatSummary(
                          getVisibleCharacterStatKeys(entry.character),
                          entry.stats,
                        )
                          .slice(0, 4)
                          .join(" · ")}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </WindowPanel>
          </div>

          <WindowPanel
            title="Resultado de recomendación"
            subtitle={
              targetCharacter
                ? `Análisis activo sobre ${targetCharacter.name}.`
                : "Genera una recomendación para abrir el tablero analítico."
            }
            action={
              result ? (
                <Badge variant={levelBadgeVariant(result.recommendation.level)}>
                  {result.recommendation.level}
                </Badge>
              ) : (
                <Badge variant="neutral">Esperando simulación</Badge>
              )
            }
          >
            {!result ? (
              <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-5">
                  <p className="text-sm font-semibold text-[var(--ink-900)]">
                    Aún no hay recomendación generada
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--ink-600)]">
                    Elige un objetivo, decide si usar stats manuales y ejecuta
                    la simulación. El sistema comparará sinergia, daño,
                    necesidad de rol y balance del equipo.
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-500)]">
                      1. Objetivo
                    </p>
                    <p className="mt-2 text-sm text-[var(--ink-700)]">
                      Selecciona el personaje que quieres evaluar.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-500)]">
                      2. Contexto
                    </p>
                    <p className="mt-2 text-sm text-[var(--ink-700)]">
                      Ajusta stats manuales si buscas un build objetivo real.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-500)]">
                      3. Resultado
                    </p>
                    <p className="mt-2 text-sm text-[var(--ink-700)]">
                      Obtendrás puntaje, delta de daño, gráficas y principales sinergias.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-h-[78vh] space-y-4 overflow-y-auto pr-1">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                    <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">
                      Puntaje
                    </p>
                    <p className="mt-2 text-3xl font-black text-[var(--ink-900)]">
                      {result.recommendation.score}/100
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                    <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">
                      Nivel
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[var(--ink-900)]">
                      {result.recommendation.level}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                    <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">
                      Delta estimado
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[var(--ink-900)]">
                      {result.recommendation.estimatedDeltaDmg}%
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                    <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">
                      Daño equipo actual
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[var(--ink-900)]">
                      {result.context.damageComparison.currentTeam.totalDamage.toFixed(
                        2,
                      )}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                    <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">
                      Daño equipo propuesto
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[var(--ink-900)]">
                      {result.context.damageComparison.proposedTeam.totalDamage.toFixed(
                        2,
                      )}
                    </p>
                  </div>
                </div>

                {result.context.appliedTargetStats ? (
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4 text-sm text-[var(--ink-700)]">
                    <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">
                      Stats objetivo usados en la simulación
                    </p>
                    <p className="mt-2">
                      {formatStatSummary(
                        result.context.appliedTargetStats.statKeys,
                        result.context.appliedTargetStats.stats,
                      ).join(" · ")}
                    </p>
                    <p className="mt-1 text-xs text-[var(--ink-500)]">
                      Fuente:{" "}
                      {recommendationTargetStatsSourceLabel(
                        result.context.appliedTargetStats.source,
                      )}
                      .
                    </p>
                  </div>
                ) : null}

                <div className="grid gap-4 xl:grid-cols-2">
                  <DamageComparisonChart
                    currentTotal={
                      result.context.damageComparison.currentTeam.totalDamage
                    }
                    proposedTotal={
                      result.context.damageComparison.proposedTeam.totalDamage
                    }
                  />
                  <ScoreBreakdownChart
                    breakdown={result.context.scoringBreakdown}
                  />
                </div>

                <TeamMemberContributionChart
                  currentMembers={result.context.damageComparison.currentTeam.members}
                  proposedMembers={
                    result.context.damageComparison.proposedTeam.members
                  }
                />

                <div className="grid gap-3 xl:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">
                      Eje inferior - gráfica de daño
                    </p>
                    <p className="mt-2 text-sm text-[var(--ink-700)]">
                      <span className="font-semibold">Actual:</span> daño
                      estimado de tu mejor equipo actual.
                    </p>
                    <p className="text-sm text-[var(--ink-700)]">
                      <span className="font-semibold">Propuesto:</span> daño
                      estimado al incluir el personaje objetivo.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">
                      Eje inferior - gráfica de puntaje
                    </p>
                    <p className="mt-2 text-sm text-[var(--ink-700)]">
                      <span className="font-semibold">Daño:</span> impacto
                      ponderado de la mejora o caída estimada.{" "}
                      <span className="font-semibold">Sinergia:</span>{" "}
                      compatibilidades con tu roster.{" "}
                      <span className="font-semibold">Equipos:</span> cantidad
                      de equipos compatibles.
                    </p>
                    <p className="text-sm text-[var(--ink-700)]">
                      <span className="font-semibold">Rol:</span> necesidad del
                      equipo. <span className="font-semibold">Inversión:</span>{" "}
                      qué tan armado estás para que funcione.{" "}
                      <span className="font-semibold">Cuenta:</span> valor
                      general que aporta el personaje.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">
                      Eje inferior - contribución por miembro
                    </p>
                    <p className="mt-2 text-sm text-[var(--ink-700)]">
                      Cada etiqueta representa un personaje del equipo final
                      considerado por el motor.
                    </p>
                    <p className="text-sm text-[var(--ink-700)]">
                      Se comparan barras de{" "}
                      <span className="font-semibold">equipo actual</span> vs{" "}
                      <span className="font-semibold">equipo propuesto</span>.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                  <p className="text-sm leading-7 text-[var(--ink-700)]">
                    {result.recommendation.explanation}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                  <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">
                    Top sinergias detectadas
                  </p>
                  {result.context.topSynergies.length === 0 ? (
                    <p className="mt-2 text-sm text-[var(--ink-500)]">
                      Sin sinergias directas detectadas.
                    </p>
                  ) : (
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--ink-700)]">
                      {result.context.topSynergies.map((synergy) => (
                        <li key={synergy}>{synergy}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </WindowPanel>
        </section>
      ) : null}

      {activeView === "scenario" ? (
        <section
          id="scenario-simulation"
          className={SIMULATOR_SCENARIO_GRID_CLASSNAME}
        >
          <WindowPanel
            title="Escenario controlado"
            subtitle="Simula stats finales y deja que el backend los convierta a deltas reales con contexto de equipo."
            action={
              scenarioCharacterEntry ? (
                <Badge variant="brand">
                  {scenarioCharacterEntry.character.name}
                </Badge>
              ) : (
                <Badge variant="neutral">Sin personaje</Badge>
              )
            }
          >
            {owned.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--surface-2)] p-5 text-sm text-[var(--ink-500)]">
                Agrega personajes a tu cuenta para habilitar simulaciones de
                stats.
              </div>
            ) : (
              <form
                className="max-h-[78vh] space-y-4 overflow-y-auto pr-1"
                onSubmit={handleSimulateDamage}
              >
                <div className="grid gap-4 xl:grid-cols-[1fr_0.96fr]">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">
                      Personaje a simular
                    </p>
                    <Combobox
                      className="w-full"
                      options={scenarioCharacterOptions}
                      value={
                        scenarioCharacterId ? String(scenarioCharacterId) : ""
                      }
                      onValueChange={(nextValue) => {
                        const selectedId = nextValue ? Number(nextValue) : null;
                        setScenarioCharacterId(selectedId);
                        setTeammateSlots((current) =>
                          current.map((slotValue) =>
                            selectedId !== null &&
                            slotValue === String(selectedId)
                              ? ""
                              : slotValue,
                          ),
                        );

                        const selectedEntry =
                          selectedId === null
                            ? null
                            : (owned.find(
                                (entry) => entry.character.id === selectedId,
                              ) ?? null);

                        if (!selectedEntry) {
                          applyScenarioCharacterDefaults(null);
                          return;
                        }

                        applyScenarioCharacterDefaults(selectedEntry);
                      }}
                      placeholder="Selecciona un personaje"
                      searchPlaceholder="Busca en tu roster por nombre o alias"
                      emptyText="No hay personajes de tu roster que coincidan."
                    />
                  </div>

                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4 text-xs text-[var(--ink-700)]">
                    <p className="font-semibold text-[var(--ink-900)]">
                      Cómo funciona la simulación
                    </p>
                    <p className="mt-2">
                      Ingresa los stats finales objetivo, no incrementos.
                    </p>
                    <p>
                      El sistema convierte esos valores a cambios y recalcula el
                      daño con fórmula multiplicativa: Base DMG, DMG%, DEF, RES,
                      DMG Taken y Toughness.
                    </p>
                    <p className="mt-2">
                      Puedes usar equipo automático o forzar compañeros para
                      reflejar buffs y debuffs reales.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-[var(--ink-800)]">
                    <input
                      className="h-4 w-4 accent-[var(--brand-600)]"
                      type="checkbox"
                      checked={useCustomTeam}
                      onChange={(event) =>
                        setUseCustomTeam(event.target.checked)
                      }
                    />
                    Usar equipo personalizado para la simulación
                  </label>
                  <p className="mt-2 text-xs text-[var(--ink-500)]">
                    Si no lo activas, se usa selección automática del equipo.
                  </p>
                  <p className="text-xs text-[var(--ink-500)]">
                    Si eliges solo 1-2 compañeros, el backend autocompleta hasta
                    4 miembros priorizando sinergia.
                  </p>

                  {useCustomTeam ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      {teammateSlots.map((slotValue, index) => (
                        <div key={`teammate-slot-${index}`}>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">
                            Compañero {index + 1}
                          </p>
                          <Combobox
                            className="w-full"
                            value={slotValue}
                            onValueChange={(nextValue) =>
                              handleTeammateSlotChange(index, nextValue)
                            }
                            placeholder="Sin seleccionar"
                            searchPlaceholder="Busca un compañero por nombre o alias"
                            emptyText="No hay compañeros disponibles."
                            options={availableTeammates
                              .filter((entry) => {
                                if (!slotValue) {
                                  return !teammateSlots.includes(
                                    String(entry.character.id),
                                  );
                                }

                                return (
                                  entry.character.id === Number(slotValue) ||
                                  !teammateSlots.includes(
                                    String(entry.character.id),
                                  )
                                );
                              })
                              .map((entry) => ({
                                value: String(entry.character.id),
                                label: buildCharacterOptionLabel(entry.character),
                                searchText: buildCharacterSearchText(
                                  entry.character,
                                ),
                              }))}
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {scenarioStatKeys.map((statKey) => (
                    <div key={`scenario-${statKey}`}>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">
                        {CHARACTER_STAT_UI[statKey].label}
                      </p>
                      <Input
                        type="number"
                        step={CHARACTER_STAT_UI[statKey].step}
                        min={CHARACTER_STAT_UI[statKey].min}
                        value={scenarioStatInputs[statKey]}
                        onChange={(event) =>
                          handleScenarioStatChange(statKey, event.target.value)
                        }
                      />
                    </div>
                  ))}
                </div>

                <Button
                  type="submit"
                  disabled={
                    simulatingDamage ||
                    !scenarioCharacterId ||
                    !scenarioCharacterEntry
                  }
                >
                  {simulatingDamage ? "Simulando..." : "Simular escenario"}
                </Button>
              </form>
            )}
          </WindowPanel>

          <WindowPanel
            title="Salida del simulador"
            subtitle={
              damageScenario
                ? damageScenario.summary
                : "Ejecuta una simulación para ver daño base, daño ajustado y contribución por miembro."
            }
            action={
              damageScenario ? (
                <Badge
                  variant={
                    damageScenario.deltaPercent >= 0 ? "success" : "danger"
                  }
                >
                  {formatSigned(damageScenario.deltaPercent)}%
                </Badge>
              ) : (
                <Badge variant="neutral">Sin resultado</Badge>
              )
            }
          >
            {!damageScenario ? (
              <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-5">
                  <p className="text-sm font-semibold text-[var(--ink-900)]">
                    El panel espera un escenario
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--ink-600)]">
                    Selecciona un personaje, fija el equipo si lo necesitas y
                    define los stats finales para medir el impacto real sobre tu
                    composición.
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-500)]">
                      Fórmula real
                    </p>
                    <p className="mt-2 text-sm text-[var(--ink-700)]">
                      El backend recalcula el daño con factores
                      multiplicativos, no con suma lineal.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-500)]">
                      Equipo
                    </p>
                    <p className="mt-2 text-sm text-[var(--ink-700)]">
                      Puedes mantener equipo automático o fijar compañeros concretos.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-h-[78vh] space-y-4 overflow-y-auto pr-1">
                {damageScenario.teamContext ? (
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4 text-sm text-[var(--ink-600)]">
                    Equipo{" "}
                    {damageScenario.teamContext.mode === "custom"
                      ? "personalizado"
                      : "automático"}
                    :{" "}
                    {damageScenario.teamContext.members
                      .map((member) =>
                        member.isTarget
                          ? `${member.name} (objetivo)`
                          : member.name,
                      )
                      .join(", ")}
                  </div>
                ) : null}

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4 text-sm">
                    <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">
                      Stats base
                    </p>
                    <p className="mt-2 text-[var(--ink-700)]">
                      {formatStatSummary(
                        damageScenario.statKeys,
                        damageScenario.baseStats,
                      ).join(" · ")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4 text-sm">
                    <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">
                      Stats simuladas
                    </p>
                    <p className="mt-2 text-[var(--ink-700)]">
                      {formatStatSummary(
                        damageScenario.statKeys,
                        damageScenario.simulatedStats,
                      ).join(" · ")}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4 text-sm">
                    <p className="text-xs uppercase tracking-wide text-[var(--ink-500)]">
                      Cambio estimado de daño
                    </p>
                    <p
                      className={`mt-2 text-lg font-semibold ${
                        damageScenario.deltaPercent >= 0
                          ? "text-emerald-300"
                          : "text-rose-300"
                      }`}
                    >
                      {formatSigned(damageScenario.deltaPercent)}%
                    </p>
                  </div>
                </div>

                <DamageComparisonChart
                  currentTotal={damageScenario.baseTeamDamage}
                  proposedTotal={damageScenario.simulatedTeamDamage}
                  currentLabel="Base"
                  proposedLabel="Simulado"
                  seriesName="Daño de escenario"
                  helpTextByLabel={{
                    Base: "Base: daño estimado del equipo antes de aplicar tus cambios de stats.",
                    Simulado:
                      "Simulado: daño estimado luego de aplicar los deltas del escenario.",
                  }}
                />

                <TeamMemberContributionChart
                  currentMembers={
                    damageScenario.damageComparison.currentTeam.members
                  }
                  proposedMembers={
                    damageScenario.damageComparison.proposedTeam.members
                  }
                />
              </div>
            )}
          </WindowPanel>
        </section>
      ) : null}

      {activeView === "history" ? (
        <section
          id="history"
          className={SIMULATOR_HISTORY_GRID_CLASSNAME}
        >
          <WindowPanel
            title="Historial de recomendaciones"
            subtitle="Resultado reciente de decisiones de pull guardadas en tu cuenta."
            action={
              <Badge variant="neutral">
                {filteredRecommendationHistory.length}/{recommendationHistory.length}
              </Badge>
            }
          >
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                placeholder="Buscar por personaje o explicación"
                value={recommendationSearch}
                onChange={(event) =>
                  setRecommendationSearch(event.target.value)
                }
              />
              <select
                className={SELECT_CLASSNAME}
                value={recommendationLevelFilter}
                onChange={(event) =>
                  setRecommendationLevelFilter(
                    event.target.value as
                      | "ALL"
                      | "NO_RECOMENDADO"
                      | "SITUACIONAL"
                      | "RECOMENDADO"
                      | "MUY_RECOMENDADO",
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
              <div className="mt-4 rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--surface-2)] p-5 text-sm text-[var(--ink-500)]">
                Aún no hay recomendaciones guardadas.
              </div>
            ) : filteredRecommendationHistory.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--surface-2)] p-5 text-sm text-[var(--ink-500)]">
                No hay resultados con los filtros actuales.
              </div>
            ) : (
              <div className="mt-4 max-h-[70vh] space-y-3 overflow-y-auto pr-1">
                {filteredRecommendationHistory.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-[var(--ink-900)]">
                          {entry.targetCharacter} · {entry.score}/100
                        </p>
                        <Badge variant={levelBadgeVariant(entry.level)}>
                          {entry.level}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-[var(--ink-500)]">
                          {formatDate(entry.createdAt)}
                        </p>
                        <Link
                          className="inline-flex items-center rounded-xl bg-[var(--surface)] px-2 py-1 text-xs font-semibold text-[var(--brand-700)] ring-1 ring-[var(--line)] hover:bg-[var(--surface-2)]"
                          href={`/simulator/recommendations/${entry.id}`}
                        >
                          Ver detalle
                        </Link>
                      </div>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-600)]">
                      {entry.explanation}
                    </p>
                  </article>
                ))}
              </div>
            )}

            {recommendationNextCursor ? (
              <div className="mt-4">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={handleLoadMoreRecommendations}
                  disabled={loadingMoreRecommendations}
                >
                  {loadingMoreRecommendations
                    ? "Cargando..."
                    : "Cargar más recomendaciones"}
                </Button>
              </div>
            ) : null}
          </WindowPanel>

          <WindowPanel
            title="Historial de simulaciones"
            subtitle="Ejecuciones guardadas del motor ligero con filtros por tipo."
            action={
              <Badge variant="neutral">
                {filteredSimulationHistory.length}/{simulationHistory.length}
              </Badge>
            }
          >
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                placeholder="Buscar por etiqueta o personaje"
                value={simulationSearch}
                onChange={(event) => setSimulationSearch(event.target.value)}
              />
              <select
                className={SELECT_CLASSNAME}
                value={simulationTypeFilter}
                onChange={(event) =>
                  setSimulationTypeFilter(
                    event.target.value as
                      | "ALL"
                      | "recommendation"
                      | "damage_scenario",
                  )
                }
              >
                <option value="ALL">Todos los tipos</option>
                <option value="recommendation">recommendation</option>
                <option value="damage_scenario">damage_scenario</option>
              </select>
            </div>

            {simulationHistory.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--surface-2)] p-5 text-sm text-[var(--ink-500)]">
                Aún no hay simulaciones guardadas.
              </div>
            ) : filteredSimulationHistory.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--surface-2)] p-5 text-sm text-[var(--ink-500)]">
                No hay simulaciones que coincidan con los filtros.
              </div>
            ) : (
              <div className="mt-4 max-h-[70vh] space-y-3 overflow-y-auto pr-1">
                {filteredSimulationHistory.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-[var(--ink-900)]">
                          {entry.label}
                        </p>
                        <Badge
                          variant={
                            entry.payload?.type === "damage_scenario"
                              ? "brand"
                              : "neutral"
                          }
                        >
                          {entry.payload?.type ?? "recommendation"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-[var(--ink-500)]">
                          {formatDate(entry.createdAt)}
                        </p>
                        <Link
                          className="inline-flex items-center rounded-xl bg-[var(--surface)] px-2 py-1 text-xs font-semibold text-[var(--brand-700)] ring-1 ring-[var(--line)] hover:bg-[var(--surface-2)]"
                          href={`/simulator/history/${entry.id}`}
                        >
                          Ver detalle
                        </Link>
                      </div>
                    </div>
                    {entry.payload?.type === "damage_scenario" ||
                    entry.label.startsWith("damage-sim-") ? (
                      <p className="mt-2 text-xs leading-6 text-[var(--ink-600)]">
                        Personaje: {entry.payload?.characterName ?? "N/A"} ·
                        Daño base:{" "}
                        {typeof entry.payload?.baseTeamDamage === "number"
                          ? entry.payload.baseTeamDamage.toFixed(2)
                          : "N/A"}{" "}
                        · Daño simulado:{" "}
                        {typeof entry.payload?.simulatedTeamDamage === "number"
                          ? entry.payload.simulatedTeamDamage.toFixed(2)
                          : "N/A"}{" "}
                        · Delta:{" "}
                        {typeof entry.payload?.deltaPercent === "number"
                          ? formatSigned(entry.payload.deltaPercent)
                          : "N/A"}
                        %
                      </p>
                    ) : (
                      <p className="mt-2 text-xs leading-6 text-[var(--ink-600)]">
                        Puntaje: {entry.payload?.score ?? "N/A"} · Nivel:{" "}
                        {entry.payload?.level ?? "N/A"} · Sinergias:{" "}
                        {entry.payload?.synergyCount ?? 0}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}

            {simulationNextCursor ? (
              <div className="mt-4">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={handleLoadMoreSimulations}
                  disabled={loadingMoreSimulations}
                >
                  {loadingMoreSimulations
                    ? "Cargando..."
                    : "Cargar más simulaciones"}
                </Button>
              </div>
            ) : null}
          </WindowPanel>
        </section>
      ) : null}
    </main>
  );
}
