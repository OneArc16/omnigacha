import { Character, CharacterStatKey, CharacterStatsMap } from "./api";

export type CharacterStatInputKind = "flat" | "percent";

export type CharacterStatUiConfig = {
  label: string;
  placeholder: string;
  kind: CharacterStatInputKind;
  min: number;
  step: number | string;
};

export const CHARACTER_STAT_ORDER: CharacterStatKey[] = [
  "hp",
  "atk",
  "def",
  "speed",
  "crit_rate",
  "crit_damage",
  "break_effect",
  "energy_regen_rate",
  "effect_hit_rate",
  "effect_res",
  "elemental_dmg_bonus",
];

export const CHARACTER_STAT_UI: Record<CharacterStatKey, CharacterStatUiConfig> =
  {
    hp: {
      label: "Vida",
      placeholder: "Ej: 4200",
      kind: "flat",
      min: 0,
      step: 1,
    },
    atk: {
      label: "Ataque",
      placeholder: "Ej: 3200",
      kind: "flat",
      min: 0,
      step: 1,
    },
    def: {
      label: "Defensa",
      placeholder: "Ej: 1400",
      kind: "flat",
      min: 0,
      step: 1,
    },
    speed: {
      label: "Velocidad",
      placeholder: "Ej: 134",
      kind: "flat",
      min: 0,
      step: 1,
    },
    crit_rate: {
      label: "Prob. crítico (%)",
      placeholder: "Ej: 75",
      kind: "percent",
      min: 0,
      step: "0.1",
    },
    crit_damage: {
      label: "Daño crítico (%)",
      placeholder: "Ej: 180",
      kind: "percent",
      min: 0,
      step: "0.1",
    },
    break_effect: {
      label: "Efecto de ruptura (%)",
      placeholder: "Ej: 180",
      kind: "percent",
      min: 0,
      step: "0.1",
    },
    energy_regen_rate: {
      label: "Regeneración de energía (%)",
      placeholder: "Ej: 19.4",
      kind: "percent",
      min: 0,
      step: "0.1",
    },
    effect_hit_rate: {
      label: "Acierto de efecto (%)",
      placeholder: "Ej: 67",
      kind: "percent",
      min: 0,
      step: "0.1",
    },
    effect_res: {
      label: "Resistencia de efecto (%)",
      placeholder: "Ej: 30",
      kind: "percent",
      min: 0,
      step: "0.1",
    },
    elemental_dmg_bonus: {
      label: "Bono de daño elemental (%)",
      placeholder: "Ej: 38.8",
      kind: "percent",
      min: 0,
      step: "0.1",
    },
  };

export type CharacterStatsFormValues = Record<CharacterStatKey, string>;

export function buildEmptyCharacterStatsFormValues(): CharacterStatsFormValues {
  return CHARACTER_STAT_ORDER.reduce(
    (acc, statKey) => ({
      ...acc,
      [statKey]: "",
    }),
    {} as CharacterStatsFormValues,
  );
}

export function toStatInputValue(
  statKey: CharacterStatKey,
  value: number | undefined,
) {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return "";
  }

  if (CHARACTER_STAT_UI[statKey].kind === "percent") {
    return String(Number((value * 100).toFixed(2)));
  }

  return String(Math.round(value));
}

export function fromStatInputValue(
  statKey: CharacterStatKey,
  rawValue: string,
): number | null {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  if (CHARACTER_STAT_UI[statKey].kind === "percent") {
    return parsed / 100;
  }

  return Math.round(parsed);
}

export function buildCharacterStatsFormValues(
  stats: CharacterStatsMap | undefined,
): CharacterStatsFormValues {
  const values = buildEmptyCharacterStatsFormValues();

  for (const statKey of CHARACTER_STAT_ORDER) {
    values[statKey] = toStatInputValue(statKey, stats?.[statKey]);
  }

  return values;
}

export function getVisibleCharacterStatKeys(character: Character | null) {
  const prioritized = character?.statProfile?.prioritizedStatKeys ?? [];
  const enabled = character?.statProfile?.enabledStatKeys ?? [];
  const combined = [...prioritized, ...enabled].filter(
    (value, index, array) => array.indexOf(value) === index,
  );

  if (combined.length > 0) {
    return combined;
  }

  return ["atk", "crit_rate", "crit_damage", "speed"] satisfies CharacterStatKey[];
}

export function formatCharacterStatValue(
  statKey: CharacterStatKey,
  value: number | undefined,
) {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return "-";
  }

  if (CHARACTER_STAT_UI[statKey].kind === "percent") {
    return `${Number((value * 100).toFixed(1))}%`;
  }

  return String(Math.round(value));
}

export function formatCharacterStatChip(
  statKey: CharacterStatKey,
  value: number | undefined,
) {
  return `${CHARACTER_STAT_UI[statKey].label}: ${formatCharacterStatValue(statKey, value)}`;
}
