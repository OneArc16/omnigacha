'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  HeaderStrip,
  HeaderStripActions,
  HeaderStripChip,
  HeaderStripChips,
  HeaderStripDivider,
  HeaderStripSkeleton,
} from '../../../components/layout/header-strip';
import {
  SIMULATOR_RECOMMEND_GRID_CLASSNAME,
  SIMULATOR_SCENARIO_GRID_CLASSNAME,
} from '../../../components/layout/page-shell';
import { Alert } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { ButtonLink } from '../../../components/ui/button-link';
import { SegmentedTabs } from '../../../components/ui/segmented-tabs';
import { Skeleton } from '../../../components/ui/skeleton';
import {
  apiRequest,
  Character,
  CursorPage,
  RecommendationRecord,
  SimulationHistoryItem,
  UserCharacter,
} from '../../../lib/api';
import { useSignOut } from '../../../lib/use-sign-out';
import { HistoryView } from './history-view';
import { DetectedRoster, RecommendationForm } from './recommendation-form';
import { RecommendationResult } from './recommendation-result';
import { ScenarioForm } from './scenario-form';
import { ScenarioResult } from './scenario-result';
import { useDamageScenario } from './use-damage-scenario';
import { useHistoryFeed } from './use-history-feed';
import { useRecommendation } from './use-recommendation';

type SimulatorView = 'recommend' | 'scenario' | 'history';

const VIEW_OPTIONS: { value: SimulatorView; label: string; description: string }[] = [
  {
    value: 'recommend',
    label: 'Recomendación',
    description: 'Define objetivo, stats y resultado sugerido',
  },
  {
    value: 'scenario',
    label: 'Escenarios',
    description: 'Simula cambios reales con equipo manual o auto',
  },
  {
    value: 'history',
    label: 'Historial',
    description: 'Consulta recomendaciones y simulaciones guardadas',
  },
];

// Anclas admitidas en la URL (enlaces desde la home y enlaces antiguos).
const VIEW_BY_HASH: Record<string, SimulatorView> = {
  '#recommend-target': 'recommend',
  '#recommendation-result': 'recommend',
  '#scenario-simulation': 'scenario',
  '#history': 'history',
  '#recommendation-history': 'history',
  '#simulation-history': 'history',
};

function useHashView(initialView: SimulatorView) {
  const [view, setView] = useState(initialView);

  useEffect(() => {
    const syncViewFromHash = () => {
      const hashView = VIEW_BY_HASH[window.location.hash];
      if (hashView) setView(hashView);
    };

    syncViewFromHash();
    window.addEventListener('hashchange', syncViewFromHash);
    return () => window.removeEventListener('hashchange', syncViewFromHash);
  }, []);

  return [view, setView] as const;
}

type SimulatorData = {
  catalog: Character[];
  owned: UserCharacter[];
};

type WorkbenchProps = SimulatorData & {
  accessToken: string;
};

function SimulatorWorkbench({ accessToken, catalog, owned }: WorkbenchProps) {
  const signOut = useSignOut();
  const [view, setView] = useHashView('recommend');

  const recommendationFeed = useHistoryFeed<RecommendationRecord>({
    path: '/simulations/recommendations',
    accessToken,
    loadMoreErrorMessage: 'No fue posible cargar más recomendaciones',
  });
  const simulationFeed = useHistoryFeed<SimulationHistoryItem>({
    path: '/simulations/history',
    accessToken,
    loadMoreErrorMessage: 'No fue posible cargar más simulaciones',
  });

  const recommendation = useRecommendation({
    accessToken,
    catalog,
    owned,
    onCompleted: () =>
      Promise.all([recommendationFeed.reload(), simulationFeed.reload()]),
  });
  const scenario = useDamageScenario({
    accessToken,
    owned,
    onCompleted: simulationFeed.reload,
  });

  return (
    <>
      <HeaderStrip
        glyph="✦"
        eyebrow="Laboratorio · Motor ligero"
        title="Laboratorio de simulación"
        description="Recomendación de pulls y simulación de daño con contexto de equipo."
      >
        <HeaderStripChips>
          <HeaderStripChip label="Roster" value={`${owned.length} personajes`} />
          <HeaderStripChip
            label="Historial cargado"
            value={recommendationFeed.items.length + simulationFeed.items.length}
            highlight
          />
        </HeaderStripChips>
        <HeaderStripDivider />
        <HeaderStripActions>
          <ButtonLink href="/">Espacio de trabajo</ButtonLink>
          <Button variant="ghost" onClick={signOut}>
            Cerrar sesión
          </Button>
        </HeaderStripActions>
      </HeaderStrip>

      <SegmentedTabs value={view} onValueChange={setView} options={VIEW_OPTIONS} />

      {view === 'recommend' ? (
        <section
          id="recommend-target"
          className={`mt-1 ${SIMULATOR_RECOMMEND_GRID_CLASSNAME}`}
        >
          <div className="space-y-5">
            <RecommendationForm catalog={catalog} recommendation={recommendation} />
            <DetectedRoster owned={owned} targetId={recommendation.targetId} />
          </div>
          <RecommendationResult result={recommendation.result} />
        </section>
      ) : null}

      {view === 'scenario' ? (
        <section
          id="scenario-simulation"
          className={`mt-1 ${SIMULATOR_SCENARIO_GRID_CLASSNAME}`}
        >
          <ScenarioForm
            rosterCharacters={owned.map((entry) => entry.character)}
            scenario={scenario}
          />
          <ScenarioResult scenario={scenario.result} />
        </section>
      ) : null}

      {view === 'history' ? (
        <HistoryView
          recommendations={recommendationFeed}
          simulations={simulationFeed}
        />
      ) : null}
    </>
  );
}

/** Simulador de una sesión autenticada. Se monta con `key={accessToken}`. */
export function Simulator({ accessToken }: { accessToken: string }) {
  const [data, setData] = useState<SimulatorData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    Promise.all([
      apiRequest<CursorPage<Character>>('/characters?limit=100'),
      apiRequest<CursorPage<UserCharacter>>('/user-characters?limit=100', {
        token: accessToken,
      }),
    ])
      .then(([characters, ownedCharacters]) => {
        if (!active) return;
        setData({ catalog: characters.items, owned: ownedCharacters.items });
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message);
        toast.error(err.message);
      });

    return () => {
      active = false;
    };
  }, [accessToken]);

  if (error) {
    return <Alert tone="error">{error}</Alert>;
  }

  // El banco de trabajo se monta con los datos ya cargados para que sus
  // formularios puedan partir del roster real.
  if (!data) {
    return (
      <>
        <HeaderStripSkeleton />
        <div className={`mt-1 ${SIMULATOR_RECOMMEND_GRID_CLASSNAME}`}>
          <Skeleton className="h-[28rem] w-full bevel-14" />
          <Skeleton className="h-[28rem] w-full bevel-14" />
        </div>
      </>
    );
  }

  return <SimulatorWorkbench accessToken={accessToken} {...data} />;
}
