'use client';

import { FormEvent, useMemo } from 'react';
import { Character, LightCone } from '../../lib/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export type UserCharacterFormValues = {
  characterId: string;
  lightConeId: string;
  level: string;
  eidolon: string;
  atk: string;
  critRate: string;
  critDamage: string;
  speed: string;
  lightConeLevel: string;
};

type UserCharacterFormProps = {
  catalog: Character[];
  lightCones: LightCone[];
  values: UserCharacterFormValues;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: (
    field: keyof UserCharacterFormValues,
    value: string,
  ) => void;
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

type StatFieldConfig = {
  field: keyof UserCharacterFormValues;
  label: string;
  placeholder: string;
  type?: 'text' | 'number';
  min?: number;
  max?: number;
  step?: number | string;
  required?: boolean;
};

const statFields: StatFieldConfig[] = [
  {
    field: 'level',
    label: 'Nivel',
    placeholder: 'Ej: 80',
    type: 'number',
    min: 1,
    step: 1,
    required: true,
  },
  {
    field: 'eidolon',
    label: 'Eidolon',
    placeholder: 'Ej: 0',
    type: 'number',
    min: 0,
    step: 1,
    required: true,
  },
  {
    field: 'atk',
    label: 'ATK',
    placeholder: 'Ej: 3200',
    type: 'number',
    min: 0,
    step: 1,
    required: true,
  },
  {
    field: 'critRate',
    label: 'CRIT Rate',
    placeholder: 'Ej: 0.70',
    type: 'number',
    min: 0,
    step: '0.01',
    required: true,
  },
  {
    field: 'critDamage',
    label: 'CRIT DMG',
    placeholder: 'Ej: 1.40',
    type: 'number',
    min: 0,
    step: '0.01',
    required: true,
  },
  {
    field: 'speed',
    label: 'Velocidad',
    placeholder: 'Ej: 134',
    type: 'number',
    min: 0,
    step: 1,
    required: true,
  },
];

function renderField(
  config: StatFieldConfig,
  values: UserCharacterFormValues,
  onFieldChange: UserCharacterFormProps['onFieldChange'],
) {
  return (
    <label
      key={config.field}
      className="space-y-1 text-xs font-medium text-[var(--ink-700)]"
    >
      {config.label}
      <Input
        type={config.type ?? 'text'}
        min={config.min}
        max={config.max}
        step={config.step}
        value={values[config.field]}
        onChange={(event) => onFieldChange(config.field, event.target.value)}
        placeholder={config.placeholder}
        required={config.required}
      />
    </label>
  );
}

export function UserCharacterForm({
  catalog,
  lightCones,
  values,
  onSubmit,
  onFieldChange,
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

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="flex flex-col gap-3 md:flex-row">
        <select
          className="w-full rounded-xl border border-[var(--line)] bg-white/90 px-3 py-2.5 text-sm text-[var(--ink-900)] transition focus:border-[var(--brand-500)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-200)] md:min-w-96 disabled:cursor-not-allowed disabled:bg-[var(--surface-2)]"
          value={values.characterId}
          onChange={(event) => onFieldChange('characterId', event.target.value)}
          disabled={disableCharacterSelect}
          required
        >
          <option value="">Selecciona un personaje</option>
          {catalog.map((character) => (
            <option key={character.id} value={String(character.id)}>
              {character.name} - {character.element} / {character.path}
            </option>
          ))}
        </select>

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
            Quiero digitar manualmente los stats de este personaje
          </label>
          <p className="mt-1 text-xs text-[var(--ink-500)]">
            Si no activas esta opcion, se guardaran los stats base del catalogo.
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
              className="w-full rounded-xl border border-[var(--line)] bg-white/90 px-3 py-2.5 text-sm text-[var(--ink-900)] transition focus:border-[var(--brand-500)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-200)]"
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
            ? `Solo se muestran conos compatibles con la via ${characterPath}.`
            : 'Selecciona un personaje para filtrar conos compatibles por via.'}
        </p>
      </div>

      {showStats ? (
        <div className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">
            Stats a guardar
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {statFields.map((field) => renderField(field, values, onFieldChange))}
          </div>
        </div>
      ) : null}
    </form>
  );
}
