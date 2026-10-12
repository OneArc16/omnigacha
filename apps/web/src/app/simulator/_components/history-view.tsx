'use client';

import { ReactNode, useMemo, useState } from 'react';
import { SIMULATOR_HISTORY_GRID_CLASSNAME } from '../../../components/layout/page-shell';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { ButtonLink } from '../../../components/ui/button-link';
import { Input } from '../../../components/ui/input';
import { EmptyState, Inset } from '../../../components/ui/inset';
import { Select } from '../../../components/ui/select';
import { Skeleton } from '../../../components/ui/skeleton';
import { WindowPanel } from '../../../components/ui/window-panel';
import type { RecommendationRecord, SimulationHistoryItem } from '../../../lib/api';
import {
  RECOMMENDATION_LEVEL_UI,
  RECOMMENDATION_LEVELS,
  RecommendationLevel,
} from '../../../lib/recommendation-level';
import {
  formatDate,
  formatOptional,
  formatSigned,
  resolveSimulationType,
  SIMULATION_TYPE_LABEL,
  SimulationType,
} from './simulator-format';
import type { HistoryFeed } from './use-history-feed';

const ALL = 'ALL';
const SIMULATION_TYPES = Object.keys(SIMULATION_TYPE_LABEL) as SimulationType[];

type HistoryPanelProps<T> = {
  title: string;
  subtitle: string;
  feed: HistoryFeed<T>;
  /** Elementos del feed que pasan los filtros activos. */
  visibleItems: T[];
  filters: ReactNode;
  emptyText: string;
  noMatchText: string;
  loadMoreLabel: string;
  renderItem: (item: T) => ReactNode;
};

function HistoryPanel<T>({
  title,
  subtitle,
  feed,
  visibleItems,
  filters,
  emptyText,
  noMatchText,
  loadMoreLabel,
  renderItem,
}: HistoryPanelProps<T>) {
  return (
    <WindowPanel
      title={title}
      subtitle={subtitle}
      action={
        <Badge variant="neutral">
          {visibleItems.length}/{feed.items.length}
        </Badge>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">{filters}</div>

      <div className="mt-4">
        {feed.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : feed.items.length === 0 ? (
          <EmptyState>{emptyText}</EmptyState>
        ) : visibleItems.length === 0 ? (
          <EmptyState>{noMatchText}</EmptyState>
        ) : (
          <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
            {visibleItems.map(renderItem)}
          </div>
        )}
      </div>

      {feed.hasMore ? (
        <Button
          className="mt-4"
          variant="ghost"
          size="sm"
          type="button"
          onClick={feed.loadMore}
          disabled={feed.isLoadingMore}
        >
          {feed.isLoadingMore ? 'Cargando...' : loadMoreLabel}
        </Button>
      ) : null}
    </WindowPanel>
  );
}

type HistoryEntryProps = {
  title: string;
  badge: ReactNode;
  createdAt: string;
  detailHref: string;
  children: ReactNode;
};

function HistoryEntry({
  title,
  badge,
  createdAt,
  detailHref,
  children,
}: HistoryEntryProps) {
  return (
    <Inset>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink">{title}</p>
          {badge}
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted">{formatDate(createdAt)}</p>
          <ButtonLink href={detailHref} variant="ghost" size="sm">
            Ver detalle
          </ButtonLink>
        </div>
      </div>
      <p className="mt-2 text-xs leading-6 text-muted">{children}</p>
    </Inset>
  );
}

function RecommendationHistoryPanel({
  feed,
}: {
  feed: HistoryFeed<RecommendationRecord>;
}) {
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<RecommendationLevel | typeof ALL>(ALL);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return feed.items.filter(
      (entry) =>
        (level === ALL || entry.level === level) &&
        (entry.targetCharacter.toLowerCase().includes(query) ||
          entry.explanation.toLowerCase().includes(query)),
    );
  }, [feed.items, level, search]);

  return (
    <HistoryPanel
      title="Historial de recomendaciones"
      subtitle="Decisiones de pull guardadas en tu cuenta."
      feed={feed}
      visibleItems={visibleItems}
      emptyText="Aún no hay recomendaciones guardadas."
      noMatchText="No hay resultados con los filtros actuales."
      loadMoreLabel="Cargar más recomendaciones"
      filters={
        <>
          <Input
            placeholder="Buscar por personaje o explicación"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select
            value={level}
            onChange={(event) =>
              setLevel(event.target.value as RecommendationLevel | typeof ALL)
            }
          >
            <option value={ALL}>Todos los niveles</option>
            {RECOMMENDATION_LEVELS.map((option) => (
              <option key={option} value={option}>
                {RECOMMENDATION_LEVEL_UI[option].label}
              </option>
            ))}
          </Select>
        </>
      }
      renderItem={(entry) => {
        const levelUi = RECOMMENDATION_LEVEL_UI[entry.level];

        return (
          <HistoryEntry
            key={entry.id}
            title={`${entry.targetCharacter} · ${entry.score}/100`}
            badge={
              <Badge variant={levelUi.badge} dot>
                {levelUi.label}
              </Badge>
            }
            createdAt={entry.createdAt}
            detailHref={`/simulator/recommendations/${entry.id}`}
          >
            {entry.explanation}
          </HistoryEntry>
        );
      }}
    />
  );
}

function describeSimulation(entry: SimulationHistoryItem, type: SimulationType) {
  const { payload } = entry;

  if (type === 'damage_scenario') {
    return [
      `Personaje: ${payload?.characterName ?? 'N/A'}`,
      `Daño base: ${formatOptional(payload?.baseTeamDamage)}`,
      `Daño simulado: ${formatOptional(payload?.simulatedTeamDamage)}`,
      `Delta: ${formatOptional(payload?.deltaPercent, (value) => `${formatSigned(value)}%`)}`,
    ].join(' · ');
  }

  const levelLabel = payload?.level
    ? RECOMMENDATION_LEVEL_UI[payload.level].label
    : 'N/A';

  return [
    `Puntaje: ${payload?.score ?? 'N/A'}`,
    `Nivel: ${levelLabel}`,
    `Sinergias: ${payload?.synergyCount ?? 0}`,
  ].join(' · ');
}

function SimulationHistoryPanel({
  feed,
}: {
  feed: HistoryFeed<SimulationHistoryItem>;
}) {
  const [search, setSearch] = useState('');
  const [type, setType] = useState<SimulationType | typeof ALL>(ALL);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return feed.items.filter(
      (entry) =>
        (type === ALL || resolveSimulationType(entry) === type) &&
        (entry.label.toLowerCase().includes(query) ||
          (entry.payload?.characterName?.toLowerCase().includes(query) ?? false)),
    );
  }, [feed.items, search, type]);

  return (
    <HistoryPanel
      title="Historial de simulaciones"
      subtitle="Ejecuciones guardadas del motor, filtrables por tipo."
      feed={feed}
      visibleItems={visibleItems}
      emptyText="Aún no hay simulaciones guardadas."
      noMatchText="No hay simulaciones que coincidan con los filtros."
      loadMoreLabel="Cargar más simulaciones"
      filters={
        <>
          <Input
            placeholder="Buscar por etiqueta o personaje"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select
            value={type}
            onChange={(event) =>
              setType(event.target.value as SimulationType | typeof ALL)
            }
          >
            <option value={ALL}>Todos los tipos</option>
            {SIMULATION_TYPES.map((option) => (
              <option key={option} value={option}>
                {SIMULATION_TYPE_LABEL[option]}
              </option>
            ))}
          </Select>
        </>
      }
      renderItem={(entry) => {
        const entryType = resolveSimulationType(entry);

        return (
          <HistoryEntry
            key={entry.id}
            title={entry.label}
            badge={
              <Badge variant={entryType === 'damage_scenario' ? 'brand' : 'neutral'}>
                {SIMULATION_TYPE_LABEL[entryType]}
              </Badge>
            }
            createdAt={entry.createdAt}
            detailHref={`/simulator/history/${entry.id}`}
          >
            {describeSimulation(entry, entryType)}
          </HistoryEntry>
        );
      }}
    />
  );
}

type HistoryViewProps = {
  recommendations: HistoryFeed<RecommendationRecord>;
  simulations: HistoryFeed<SimulationHistoryItem>;
};

export function HistoryView({ recommendations, simulations }: HistoryViewProps) {
  return (
    <section id="history" className={`mt-1 ${SIMULATOR_HISTORY_GRID_CLASSNAME}`}>
      <RecommendationHistoryPanel feed={recommendations} />
      <SimulationHistoryPanel feed={simulations} />
    </section>
  );
}
