import Link from 'next/link';
import {
  RECOMMENDATION_SUMMARY_CLASSNAME,
  RecommendationSummaryCard,
  RecommendationSummarySkeleton,
} from '../../../components/recommendations/recommendation-summary-card';
import { Tag } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { ButtonLink } from '../../../components/ui/button-link';
import { Eyebrow } from '../../../components/ui/inset';
import { StatTile } from '../../../components/ui/stat-tile';
import { WindowPanel } from '../../../components/ui/window-panel';
import type { Character, DashboardSummaryResponse } from '../../../lib/api';

function NoRecommendationYet() {
  return (
    <div className={`mt-3 ${RECOMMENDATION_SUMMARY_CLASSNAME}`}>
      <div className="col-span-full py-6 pl-1">
        <Eyebrow>Última recomendación</Eyebrow>
        <p className="mt-2 text-sm text-muted">
          Aún no tienes recomendaciones guardadas. Abre un análisis para evaluar
          tu próximo pull.
        </p>
      </div>
    </div>
  );
}

type DashboardBoardProps = {
  summary: DashboardSummaryResponse | null;
  catalog: Character[];
  onRegisterCharacter: () => void;
};

export function DashboardBoard({
  summary,
  catalog,
  onRegisterCharacter,
}: DashboardBoardProps) {
  const lastRecommendation = summary?.lastRecommendation ?? null;
  const lastCharacter = lastRecommendation
    ? (catalog.find(
        (character) => character.name === lastRecommendation.characterName,
      ) ?? null)
    : null;

  return (
    <WindowPanel
      title="Tablero"
      subtitle="Actividad de tu cuenta y última recomendación."
      action={<Tag>En vivo</Tag>}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Personajes"
          value={summary?.totalCharacters ?? null}
          caption="en tu roster"
        />
        <StatTile
          label="Recomendaciones"
          value={summary?.totalRecommendations ?? null}
          caption="análisis de pulls"
          accent="var(--purple)"
        />
        <StatTile
          label="Simulaciones"
          value={summary?.totalSimulations ?? null}
          caption="cálculos de daño"
          accent="var(--cyan)"
        />
      </div>

      {!summary ? (
        <RecommendationSummarySkeleton className="mt-3" />
      ) : lastRecommendation ? (
        <RecommendationSummaryCard
          className="mt-3"
          eyebrow="Última recomendación"
          name={lastRecommendation.characterName}
          character={lastCharacter}
          level={lastRecommendation.recommendation}
          score={lastRecommendation.score}
        />
      ) : (
        <NoRecommendationYet />
      )}

      <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
        <Button variant="ghost" size="sm" type="button" onClick={onRegisterCharacter}>
          + Registrar personaje
        </Button>
        <ButtonLink href="/simulator" variant="ghost" size="sm">
          Abrir análisis
        </ButtonLink>
        <ButtonLink href="/simulator#scenario-simulation" size="sm">
          Simular daño
        </ButtonLink>
        <Link
          href="/simulator#history"
          className="ml-auto text-xs text-gold transition hover:brightness-125"
        >
          Ver historial →
        </Link>
      </div>
    </WindowPanel>
  );
}
