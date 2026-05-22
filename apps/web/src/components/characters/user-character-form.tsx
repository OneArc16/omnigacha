'use client';

import { FormEvent, useMemo } from 'react';
import { Character, CharacterStatKey, LightCone } from '../../lib/api';
import {
  CHARACTER_STAT_UI,
  CharacterStatsFormValues,
  formatCharacterStatChip,
  getVisibleCharacterStatKeys,
} from '../../lib/character-stats';
import { Button } from '../ui/button';
import { Combobox } from '../ui/combobox';
import { Input } from '../ui/input';

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

function renderStatField(
  statKey: CharacterStatKey,
  values: UserCharacterFormValues,
  onStatFieldChange: UserCharacterFormProps['onStatFieldChange'],
) {
  const config = CHARACTER_STAT_UI[statKey];

  return (
    <label
      key={statKey}
      className="space-y-1 text-xs font-medium text-[var(--ink-700)]"
    >
      {config.label}
      <Input
        type="number"
        min={config.min}
        step={config.step}
        value={values.stats[statKey]}
        onChange={(event) => onStatFieldChange(statKey, event.target.value)}
        placeholder={config.placeholder}
      />
    </label>
  );
}

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
  const characterOptions = useMemo(
    () =>
      catalog.map((character) => ({
        value: String(character.id),
        label: `${character.name} - ${character.element} / ${character.path}`,
        searchText: [character.name, ...character.aliases.map((alias) => alias.alias)].join(
          ' ',
        ),
      })),
    [catalog],
  );

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="flex flex-col gap-3 md:flex-row">
        <Combobox
          className="w-full md:min-w-96"
          options={characterOptions}
          value={values.characterId}
          onValueChange={(nextValue) => onFieldChange('characterId', nextValue)}
          disabled={disableCharacterSelect}
          placeholder="Selecciona un personaje"
          searchPlaceholder="Busca por nombre o alias"
          emptyText="No hay personajes que coincidan."
        />

        <div className="flex gap-3">
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
        <label className="space-y-1 text-xs font-medium text-[var(--ink-700)]">
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

        <label className="space-y-1 text-xs font-medium text-[var(--ink-700)]">
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
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--ink-800)]">
            <input
              className="h-4 w-4 accent-[var(--brand-600)]"
              type="checkbox"
              checked={useManualStats}
              onChange={(event) =>
                onUseManualStatsChange?.(event.target.checked)
              }
            />
            Quiero digitar manualmente los stats relevantes de este personaje
          </label>
          <p className="mt-1 text-xs text-[var(--ink-500)]">
            Si no activas esta opción, se guardarán valores por defecto del catálogo 3.8
            usando base + rastros compatibles.
          </p>
        </div>
      ) : null}

      <div className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">
          Cono de luz
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-medium text-[var(--ink-700)]">
            Cono equipado (opcional)
            <select
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-3)] px-3 py-2.5 text-sm text-[var(--ink-900)] transition focus:border-[var(--brand-500)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-200)]"
              value={values.lightConeId}
              onChange={(event) =>
                onFieldChange('lightConeId', event.target.value)
              }
            >
              <option value="">Sin cono registrado</option>
              {compatibleLightCones.map((lightCone) => (
                <option key={lightCone.id} value={String(lightCone.id)}>
                  {lightCone.name} - {lightCone.path} - {lightCone.rarity}*
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs font-medium text-[var(--ink-700)]">
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
        <p className="text-xs text-[var(--ink-500)]">
          {characterPath
            ? `Solo se muestran conos compatibles con la vía ${characterPath}.`
            : 'Selecciona un personaje para filtrar conos compatibles por vía.'}
        </p>
      </div>

      {selectedCharacter ? (
        <div className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">
              Perfil del personaje
            </p>
            <span className="rounded-full border border-[var(--line)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">
              {selectedCharacter.role}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {visibleStatKeys.map((statKey) => (
              <span
                key={statKey}
                className="rounded-full border border-[var(--line)] bg-[var(--surface-3)] px-2.5 py-1 text-xs text-[var(--ink-700)]"
              >
                {formatCharacterStatChip(
                  statKey,
                  selectedCharacter.defaultStats?.[statKey],
                )}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {showStats ? (
        <div className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">
            Stats a guardar
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleStatKeys.map((statKey) =>
              renderStatField(statKey, values, onStatFieldChange),
            )}
          </div>
        </div>
      ) : null}
    </form>
  );
}
