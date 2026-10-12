import type {
  CharacterStatKey,
  CharacterStatsMap,
  RecommendationResponse,
  SimulationHistoryItem,
} from '../../../lib/api';
import {
  CHARACTER_STAT_UI,
  CharacterStatsFormValues,
  formatCharacterStatChip,
  fromStatInputValue,
} from '../../../lib/character-stats';

export type SimulationType = NonNullable<SimulationHistoryItem['payload']['type']>;

type TargetStatsSource = NonNullable<
  RecommendationResponse['context']['appliedTargetStats']
>['source'];

export const SIMULATION_TYPE_LABEL: Record<SimulationType, string> = {
  recommendation: 'Recomendación',
  damage_scenario: 'Escenario de daño',
};

export const TARGET_STATS_SOURCE_LABEL: Record<TargetStatsSource, string> = {
  manual: 'manual',
  roster: 'tu roster',
  catalog_base: 'base de catálogo',
};

const DAMAGE_SCENARIO_LABEL_PREFIX = 'damage-sim-';

export function formatDate(value: string) {
  return new Date(value).toLocaleString('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function formatSigned(value: number, digits = 2) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(digits)}`;
}

/** Daño total como entero con separador de miles. */
export function formatDamage(value: number) {
  return Math.round(value).toLocaleString('es-CO');
}

/** Formatea un número opcional del payload histórico; "N/A" si no vino. */
export function formatOptional(
  value: number | undefined,
  format: (value: number) => string = (n) => n.toFixed(2),
) {
  return typeof value === 'number' ? format(value) : 'N/A';
}

export function formatStatSummary(
  statKeys: CharacterStatKey[],
  stats: CharacterStatsMap | undefined,
) {
  if (!stats) return 'N/A';

  // Registros antiguos no guardan las claves: se deducen de los propios stats.
  const resolvedKeys =
    statKeys.length > 0 ? statKeys : (Object.keys(stats) as CharacterStatKey[]);

  return resolvedKeys
    .map((statKey) => formatCharacterStatChip(statKey, stats[statKey]))
    .join(' · ');
}

/** Registros antiguos no traen `payload.type`; se deduce del prefijo de la etiqueta. */
export function resolveSimulationType(entry: SimulationHistoryItem): SimulationType {
  return (
    entry.payload?.type ??
    (entry.label.startsWith(DAMAGE_SCENARIO_LABEL_PREFIX)
      ? 'damage_scenario'
      : 'recommendation')
  );
}

/** Convierte los inputs del formulario en stats para la API; lanza si alguno es inválido. */
export function buildStatsPayload(
  statKeys: CharacterStatKey[],
  formValues: CharacterStatsFormValues,
): CharacterStatsMap {
  const stats: CharacterStatsMap = {};

  for (const statKey of statKeys) {
    const { label, kind } = CHARACTER_STAT_UI[statKey];
    const parsedValue = fromStatInputValue(statKey, formValues[statKey]);

    if (parsedValue === null) {
      throw new Error(`Completa el campo ${label} con un valor válido.`);
    }

    if (kind === 'flat' && parsedValue < 1) {
      throw new Error(`${label} debe ser mayor o igual a 1.`);
    }

    if (parsedValue < 0) {
      throw new Error(`${label} no puede ser negativo.`);
    }

    stats[statKey] = parsedValue;
  }

  return stats;
}
