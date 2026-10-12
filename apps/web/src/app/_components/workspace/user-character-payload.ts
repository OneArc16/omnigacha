import type { UserCharacterFormValues } from '../../../components/characters/user-character-form';
import type {
  Character,
  CharacterStatsMap,
  LightCone,
  UserCharacter,
} from '../../../lib/api';
import {
  buildCharacterStatsFormValues,
  buildEmptyCharacterStatsFormValues,
  formatCharacterStatChip,
  fromStatInputValue,
  getVisibleCharacterStatKeys,
} from '../../../lib/character-stats';

export type UserCharacterMutationPayload = {
  characterId: number;
  level: number;
  eidolon: number;
  stats?: CharacterStatsMap;
  lightConeId: number | null;
  lightConeLevel: number | null;
};

export function buildCreateCharacterFormValues(
  character: Character | null,
): UserCharacterFormValues {
  return {
    characterId: character ? String(character.id) : '',
    lightConeId: '',
    level: '80',
    eidolon: '0',
    stats: character
      ? buildCharacterStatsFormValues(character.defaultStats)
      : buildEmptyCharacterStatsFormValues(),
    lightConeLevel: '',
  };
}

export function buildEditCharacterFormValues(
  entry: UserCharacter,
  lightCones: LightCone[],
): UserCharacterFormValues {
  const resolvedLightConeId =
    entry.lightCone?.id ??
    lightCones.find((lightCone) => lightCone.name === entry.lightConeName)?.id;

  return {
    characterId: String(entry.character.id),
    lightConeId: resolvedLightConeId ? String(resolvedLightConeId) : '',
    level: String(entry.level),
    eidolon: String(entry.eidolon),
    stats: buildCharacterStatsFormValues(entry.stats),
    lightConeLevel:
      resolvedLightConeId && entry.lightConeLevel
        ? String(entry.lightConeLevel)
        : '',
  };
}

function buildManualStats(
  values: UserCharacterFormValues,
  character: Character | null,
): CharacterStatsMap {
  if (!character) {
    throw new Error('Selecciona un personaje antes de guardar stats.');
  }

  const stats: CharacterStatsMap = {};
  for (const statKey of getVisibleCharacterStatKeys(character)) {
    const parsedValue = fromStatInputValue(statKey, values.stats[statKey]);

    if (parsedValue === null) {
      throw new Error(`Completa el campo ${statKey} con un valor válido.`);
    }

    stats[statKey] = parsedValue;
  }

  return stats;
}

function parseLightCone(
  values: UserCharacterFormValues,
): Pick<UserCharacterMutationPayload, 'lightConeId' | 'lightConeLevel'> {
  const lightConeIdText = values.lightConeId.trim();
  const lightConeLevelText = values.lightConeLevel.trim();
  let lightConeId: number | null = null;
  let lightConeLevel: number | null = null;

  if (lightConeIdText) {
    const parsedId = Number(lightConeIdText);
    if (!Number.isFinite(parsedId) || parsedId < 1) {
      throw new Error('Selecciona un cono de luz válido.');
    }
    lightConeId = Math.trunc(parsedId);
  }

  if (lightConeLevelText) {
    const parsedLevel = Number(lightConeLevelText);
    if (!Number.isFinite(parsedLevel) || parsedLevel < 1) {
      throw new Error('El nivel del cono debe ser un número mayor o igual a 1.');
    }
    if (lightConeId == null) {
      throw new Error('Selecciona un cono de luz antes de guardar su nivel.');
    }
    lightConeLevel = Math.trunc(parsedLevel);
  }

  return { lightConeId, lightConeLevel };
}

export function buildUserCharacterPayload(
  values: UserCharacterFormValues,
  character: Character | null,
  includeManualStats: boolean,
): UserCharacterMutationPayload {
  const characterId = Number(values.characterId);
  const level = Number(values.level);
  const eidolon = Number(values.eidolon);

  if ([characterId, level, eidolon].some((value) => !Number.isFinite(value))) {
    throw new Error('Completa el formulario con valores numéricos válidos.');
  }

  if (characterId < 1 || level < 1 || eidolon < 0) {
    throw new Error('Los campos base deben respetar los mínimos permitidos.');
  }

  return {
    characterId: Math.trunc(characterId),
    level: Math.trunc(level),
    eidolon: Math.trunc(eidolon),
    ...(includeManualStats ? { stats: buildManualStats(values, character) } : {}),
    ...parseLightCone(values),
  };
}

export function formatRosterSummary(entry: UserCharacter) {
  return getVisibleCharacterStatKeys(entry.character)
    .slice(0, 4)
    .map((statKey) => formatCharacterStatChip(statKey, entry.stats[statKey]))
    .join(' · ');
}

export function formatLightConeSummary(entry: UserCharacter) {
  const lightConeName = entry.lightCone?.name ?? entry.lightConeName;

  if (!lightConeName) {
    return 'Sin cono de luz registrado';
  }

  return entry.lightConeLevel
    ? `Cono: ${lightConeName} · Nivel ${entry.lightConeLevel}`
    : `Cono: ${lightConeName}`;
}
