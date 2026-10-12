import Image from 'next/image';
import { buildApiAssetUrl, Character } from '../../lib/api';
import {
  RECOMMENDATION_LEVEL_UI,
  RecommendationLevel,
} from '../../lib/recommendation-level';
import { getInitials } from '../characters/character-portrait';
import { Badge } from '../ui/badge';
import { Eyebrow } from '../ui/inset';
import { ScoreRing } from '../ui/score-ring';
import { Skeleton } from '../ui/skeleton';

export const RECOMMENDATION_SUMMARY_CLASSNAME =
  'grid grid-cols-[auto_minmax(0,1fr)] items-center gap-[18px] border border-accent-purple/25 bg-[linear-gradient(90deg,rgba(180,140,255,.14),rgba(7,10,22,.4)_55%)] py-3.5 pl-3.5 pr-[18px] sm:grid-cols-[120px_minmax(0,1fr)_auto]';

function CharacterTile({
  name,
  character,
}: {
  name: string;
  character: Character | null;
}) {
  const portraitSrc = buildApiAssetUrl(character?.portraitUrl);

  return (
    <div className="relative grid size-[120px] place-items-center overflow-hidden bevel-12 bg-[radial-gradient(circle_at_50%_40%,rgba(180,140,255,.45),transparent_60%),linear-gradient(180deg,#2a2160,#151034)]">
      {portraitSrc ? (
        <Image
          src={portraitSrc}
          alt={name}
          fill
          sizes="120px"
          className="object-cover"
          unoptimized
        />
      ) : (
        <span className="text-3xl font-extrabold tracking-[0.04em] text-[#e6dcff]">
          {getInitials(name)}
        </span>
      )}
      {character ? (
        <span className="absolute inset-x-0 bottom-2 text-center text-[11px] tracking-[2px] text-accent-purple">
          {'★'.repeat(character.rarity)}
        </span>
      ) : null}
    </div>
  );
}

type RecommendationSummaryCardProps = {
  eyebrow: string;
  name: string;
  /** Entrada de catálogo, si se conoce: aporta retrato y rareza. */
  character: Character | null;
  level: RecommendationLevel;
  score: number;
  className?: string;
};

/** Tarjeta de veredicto: personaje, nivel de recomendación y anillo de puntaje. */
export function RecommendationSummaryCard({
  eyebrow,
  name,
  character,
  level,
  score,
  className = '',
}: RecommendationSummaryCardProps) {
  const levelUi = RECOMMENDATION_LEVEL_UI[level];

  return (
    <div className={`${RECOMMENDATION_SUMMARY_CLASSNAME} ${className}`.trim()}>
      <CharacterTile name={name} character={character} />
      <div className="min-w-0">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h3 className="mb-1 mt-1.5 truncate text-[22px] font-bold text-ink">
          {name}
        </h3>
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 text-xs text-muted">
          <Badge variant={levelUi.badge} dot>
            {levelUi.label}
          </Badge>
          <span>
            Puntaje <b className="font-semibold text-ink">{score}</b> / 100
          </span>
        </div>
      </div>
      <div className="col-span-2 justify-self-center sm:col-span-1">
        <ScoreRing score={score} color={levelUi.color} />
      </div>
    </div>
  );
}

export function RecommendationSummarySkeleton({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div className={`${RECOMMENDATION_SUMMARY_CLASSNAME} ${className}`.trim()}>
      <Skeleton className="size-[120px] bevel-12" />
      <div className="space-y-2.5">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-5 w-56" />
      </div>
    </div>
  );
}
