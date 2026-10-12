'use client';

import { FormEvent, useMemo } from 'react';
import { Character, CharacterStatKey, LightCone } from '../../lib/api';
import {
  CharacterStatsFormValues,
  formatCharacterStatChip,
  getVisibleCharacterStatKeys,
} from '../../lib/character-stats';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { CheckboxField } from '../ui/checkbox-field';
import { Input } from '../ui/input';
import { Eyebrow, Inset } from '../ui/inset';
import { Select } from '../ui/select';
import { CharacterSummaryCard } from './character-summary-card';
import { CharacterVisualPicker } from './character-visual-picker';
import { StatFields } from './stat-fields';

export type UserCharacterFormValues = {
  characterId: string;
  lightConeId: string;
  level: string;
  eidolon: string;
  stats: CharacterStatsFormValues;
  lightConeLevel: string;
};

type UserCharacterFormProps = {
  catalog: Character[];
  lightCones: LightCone[];
  selectedCharacter: Character | null;
  values: UserCharacterFormValues;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: (
    field: Exclude<keyof UserCharacterFormValues, 'stats'>,
    value: string,
  ) => void;
  onStatFieldChange: (field: CharacterStatKey, value: string) => void;
  submitLabel: string;
  isSubmitting?: boolean;
  showManualToggle?: boolean;
  useManualStats?: boolean;
  onUseManualStatsChange?: (checked: boolean) => void;
  showStatsByDefault?: boolean;
  disableCharacterSelect?: boolean;
  characterPath?: string | null;
  onCancel?: () => void;
};

const FIELD_LABEL_CLASSNAME = 'space-y-1 text-xs font-medium text-[var(--ink-700)]';

export function UserCharacterForm({
  catalog,
  lightCones,
  selectedCharacter,
  values,
  onSubmit,
  onFieldChange,
  onStatFieldChange,
  submitLabel,
  isSubmitting = false,
  showManualToggle = false,
  useManualStats = false,
  onUseManualStatsChange,
  showStatsByDefault = false,
  disableCharacterSelect = false,
  characterPath = null,
  onCancel,
}: UserCharacterFormProps) {
  const showStats = showStatsByDefault || useManualStats;
  const compatibleLightCones = useMemo(
    () =>
      characterPath
        ? lightCones.filter((lightCone) => lightCone.path === characterPath)
        : lightCones,
    [characterPath, lightCones],
  );
  const visibleStatKeys = useMemo(
    () => getVisibleCharacterStatKeys(selectedCharacter),
    [selectedCharacter],
  );

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-3">
        {disableCharacterSelect && selectedCharacter ? (
          <CharacterSummaryCard character={selectedCharacter} />
        ) : (
          <CharacterVisualPicker
            characters={catalog}
            value={values.characterId ? Number(values.characterId) : null}
            onValueChange={(nextId) =>
              onFieldChange('characterId', nextId ? String(nextId) : '')
            }
            disabled={disableCharacterSelect}
          />
        )}

        <div className="flex gap-2.5">
          <Button type="submit" disabled={isSubmitting || !values.characterId}>
            {isSubmitting ? 'Guardando...' : submitLabel}
          </Button>
          {onCancel ? (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className={FIELD_LABEL_CLASSNAME}>
          Nivel
          <Input
            type="number"
            min={1}
            step={1}
            value={values.level}
            onChange={(event) => onFieldChange('level', event.target.value)}
            placeholder="Ej: 80"
            required
          />
        </label>

        <label className={FIELD_LABEL_CLASSNAME}>
          Eidolon
          <Input
            type="number"
            min={0}
            step={1}
            value={values.eidolon}
            onChange={(event) => onFieldChange('eidolon', event.target.value)}
            placeholder="Ej: 0"
            required
          />
        </label>
      </div>

      {showManualToggle ? (
        <Inset className="p-3">
          <CheckboxField
            checked={useManualStats}
            onChange={(checked) => onUseManualStatsChange?.(checked)}
            label="Quiero digitar manualmente los stats relevantes de este personaje"
            hint="Si no activas esta opción, se guardarán valores por defecto del catálogo 3.8 usando base + rastros compatibles."
          />
        </Inset>
      ) : null}

      <Inset className="space-y-3 p-3">
        <Eyebrow>Cono de luz</Eyebrow>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={FIELD_LABEL_CLASSNAME}>
            Cono equipado (opcional)
            <Select
              value={values.lightConeId}
              onChange={(event) => onFieldChange('lightConeId', event.target.value)}
            >
              <option value="">Sin cono registrado</option>
              {compatibleLightCones.map((lightCone) => (
                <option key={lightCone.id} value={String(lightCone.id)}>
                  {lightCone.name} - {lightCone.path} - {lightCone.rarity}*
                </option>
              ))}
            </Select>
          </label>

          <label className={FIELD_LABEL_CLASSNAME}>
            Nivel del cono (opcional)
            <Input
              type="number"
              min={1}
              step={1}
              value={values.lightConeLevel}
              onChange={(event) =>
                onFieldChange('lightConeLevel', event.target.value)
              }
              placeholder="Ej: 80"
              disabled={!values.lightConeId}
            />
          </label>
        </div>
        <p className="text-xs text-muted">
          {characterPath
            ? `Solo se muestran conos compatibles con la vía ${characterPath}.`
            : 'Selecciona un personaje para filtrar conos compatibles por vía.'}
        </p>
      </Inset>

      {selectedCharacter ? (
        <Inset className="space-y-3 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Eyebrow>Perfil del personaje</Eyebrow>
            <Badge variant="outline">{selectedCharacter.role}</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {visibleStatKeys.map((statKey) => (
              <span
                key={statKey}
                className="border border-[var(--line)] bg-[var(--surface-3)] px-2.5 py-1 text-xs text-[var(--ink-700)]"
              >
                {formatCharacterStatChip(
                  statKey,
                  selectedCharacter.defaultStats?.[statKey],
                )}
              </span>
            ))}
          </div>
        </Inset>
      ) : null}

      {showStats ? (
        <Inset className="space-y-3 p-3">
          <Eyebrow>Stats a guardar</Eyebrow>
          <StatFields
            statKeys={visibleStatKeys}
            values={values.stats}
            onChange={onStatFieldChange}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          />
        </Inset>
      ) : null}
    </form>
  );
}
