import type { BadgeVariant } from '../components/ui/badge';
import type { RecommendationRecord } from './api';

export type RecommendationLevel = RecommendationRecord['level'];

type RecommendationLevelUi = {
  label: string;
  badge: BadgeVariant;
  color: string;
};

export const RECOMMENDATION_LEVEL_UI: Record<
  RecommendationLevel,
  RecommendationLevelUi
> = {
  NO_RECOMENDADO: {
    label: 'No recomendado',
    badge: 'danger',
    color: 'var(--red)',
  },
  SITUACIONAL: {
    label: 'Situacional',
    badge: 'warning',
    color: 'var(--amber)',
  },
  RECOMENDADO: {
    label: 'Recomendado',
    badge: 'brand',
    color: 'var(--gold)',
  },
  MUY_RECOMENDADO: {
    label: 'Muy recomendado',
    badge: 'success',
    color: 'var(--green)',
  },
};

export const RECOMMENDATION_LEVELS = Object.keys(
  RECOMMENDATION_LEVEL_UI,
) as RecommendationLevel[];
