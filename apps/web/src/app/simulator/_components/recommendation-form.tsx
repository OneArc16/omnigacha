import { CharacterPortrait } from '../../../components/characters/character-portrait';
import { CharacterVisualPicker } from '../../../components/characters/character-visual-picker';
import { StatFields } from '../../../components/characters/stat-fields';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { CheckboxField } from '../../../components/ui/checkbox-field';
import { EmptyState, Eyebrow, Inset } from '../../../components/ui/inset';
import { WindowPanel } from '../../../components/ui/window-panel';
import type { Character, UserCharacter } from '../../../lib/api';
import { getVisibleCharacterStatKeys } from '../../../lib/character-stats';
import { formatStatSummary } from './simulator-format';
import type { Recommendation } from './use-recommendation';

const ROSTER_SUMMARY_STAT_COUNT = 4;

function TargetSummary({ recommendation }: { recommendation: Recommendation }) {
  const { target, statKeys } = recommendation;
  if (!target) return null;

  return (
    <Inset className="flex flex-wrap items-start gap-4">
      <CharacterPortrait character={target} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="brand">{target.element}</Badge>
          <Badge variant="outline">{target.path}</Badge>
          <Badge variant="neutral">{target.role}</Badge>
          {target.tagBuckets.archetypes.map((archetype) => (
            <Badge key={archetype} variant="success">
              {archetype}
            </Badge>
          ))}
        </div>
        <Eyebrow className="mt-3">Base del catálogo</Eyebrow>
        <p className="mt-1 text-xs leading-5 text-[var(--ink-700)]">
          {formatStatSummary(statKeys, target.defaultStats)}
        </p>
      </div>
    </Inset>
  );
}

type RecommendationFormProps = {
  catalog: Character[];
  recommendation: Recommendation;
};

export function RecommendationForm({
  catalog,
  recommendation,
}: RecommendationFormProps) {
  const { target, targetId, useCustomStats, isSubmitting } = recommendation;

  return (
    <WindowPanel
      title="Objetivo de recomendación"
      subtitle="Elige el personaje a evaluar y, si quieres, fija sus stats."
      action={
        <Badge variant={target ? 'brand' : 'neutral'}>
          {target?.name ?? 'Sin objetivo'}
        </Badge>
      }
    >
      <form className="space-y-4" onSubmit={recommendation.submit}>
        {catalog.length === 0 ? (
          <EmptyState>
            No hay personajes disponibles en catálogo. Verifica la carga del API
            o el seed.
          </EmptyState>
        ) : (
          <CharacterVisualPicker
            characters={catalog}
            value={targetId}
            onValueChange={recommendation.selectTarget}
          />
        )}

        <TargetSummary recommendation={recommendation} />

        <Inset className="space-y-3 p-3">
          <CheckboxField
            checked={useCustomStats}
            onChange={recommendation.setUseCustomStats}
            label="Usar stats personalizados para esta recomendación"
            hint={
              useCustomStats
                ? 'Estos valores solo aplican a esta simulación. No se guardan en tu roster.'
                : 'Sin stats manuales, el motor prioriza los de tu roster y, si no existen, usa la base del catálogo.'
            }
          />
          {useCustomStats ? (
            <StatFields
              statKeys={recommendation.statKeys}
              values={recommendation.statInputs}
              onChange={recommendation.changeStat}
              required
            />
          ) : null}
        </Inset>

        <Button type="submit" disabled={!targetId || isSubmitting}>
          {isSubmitting ? 'Simulando...' : 'Simular recomendación'}
        </Button>
      </form>
    </WindowPanel>
  );
}

type DetectedRosterProps = {
  owned: UserCharacter[];
  targetId: number | null;
};

export function DetectedRoster({ owned, targetId }: DetectedRosterProps) {
  return (
    <WindowPanel
      title="Roster detectado"
      subtitle="El objetivo y la sinergia se calculan sobre estos personajes."
      action={
        <Badge variant="neutral">
          {owned.length} {owned.length === 1 ? 'disponible' : 'disponibles'}
        </Badge>
      }
    >
      {owned.length === 0 ? (
        <EmptyState>
          No tienes personajes registrados aún en tu cuenta principal.
        </EmptyState>
      ) : (
        <div className="max-h-[36rem] space-y-3 overflow-y-auto pr-1">
          {owned.map((entry) => (
            <Inset key={entry.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex gap-3">
                  <CharacterPortrait character={entry.character} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {entry.character.name}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge variant="brand">{entry.character.element}</Badge>
                      <Badge variant="outline">{entry.character.path}</Badge>
                    </div>
                  </div>
                </div>
                {targetId === entry.character.id ? (
                  <Badge variant="success" dot>
                    Objetivo actual
                  </Badge>
                ) : null}
              </div>
              <p className="mt-3 text-xs text-muted">
                LVL {entry.level} · E{entry.eidolon} ·{' '}
                {formatStatSummary(
                  getVisibleCharacterStatKeys(entry.character).slice(
                    0,
                    ROSTER_SUMMARY_STAT_COUNT,
                  ),
                  entry.stats,
                )}
              </p>
            </Inset>
          ))}
        </div>
      )}
    </WindowPanel>
  );
}
