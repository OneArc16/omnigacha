import type { AnalysisCharacter, SynergyEdge } from './types';
import { hasDerivedArchetype } from './derived-archetypes';

type BasicSynergyEdge = SynergyEdge;

const SHARED_ARCHETYPE_WEIGHTS: Record<string, number> = {
  DoT: 68,
  Debuff: 20,
  Break: 64,
};

const FOLLOW_UP_CARRY_WEIGHT = 62;
const FOLLOW_UP_SUPPORT_WEIGHT = 82;
const COUNTER_SUPPORT_WEIGHT = 78;
const SUMMON_SUPPORT_WEIGHT = 68;
const HYPERCARRY_SUPPORT_WEIGHT = 66;

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function summonSupportBonus(
  source: AnalysisCharacter,
  target: AnalysisCharacter,
) {
  const sourceName = normalizeText(source.name);
  const targetName = normalizeText(target.name);

  if (sourceName === 'sunday' || targetName === 'sunday') {
    return 18;
  }

  if (
    sourceName === 'trazacaminos reminiscencia' ||
    targetName === 'trazacaminos reminiscencia'
  ) {
    return 4;
  }

  if (sourceName === 'robin' || targetName === 'robin') {
    return 6;
  }

  return 0;
}

function hypercarrySupportBonus(
  source: AnalysisCharacter,
  target: AnalysisCharacter,
) {
  const sourceName = normalizeText(source.name);
  const targetName = normalizeText(target.name);

  const carryName = hasDerivedArchetype(source, 'hypercarry')
    ? sourceName
    : targetName;
  const supportName = hasDerivedArchetype(source, 'hypercarry_support')
    ? sourceName
    : targetName;

  let bonus = 0;

  if (supportName === 'sunday') {
    bonus += 10;
  } else if (supportName === 'sparkle') {
    bonus += 8;
  } else if (supportName === 'bronya') {
    bonus += 6;
  }

  if (carryName === 'dan heng imbibitor lunae') {
    if (supportName === 'sparkle') {
      bonus += 12;
    } else if (supportName === 'sunday') {
      bonus += 10;
    }
  }

  if (carryName === 'blade') {
    if (supportName === 'sunday') {
      bonus += 12;
    } else if (supportName === 'bronya') {
      bonus += 10;
    }
  }

  if (
    carryName === 'jingliu' &&
    (supportName === 'bronya' || supportName === 'sunday')
  ) {
    bonus += 8;
  }

  if (
    carryName === 'seele' &&
    (supportName === 'bronya' || supportName === 'sparkle')
  ) {
    bonus += 8;
  }

  if (carryName === 'argenti' && supportName === 'sunday') {
    bonus += 8;
  }

  return bonus;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hasTag(character: AnalysisCharacter, tagKey: string) {
  return character.tagKeys.includes(tagKey);
}

function shareTag(
  source: AnalysisCharacter,
  target: AnalysisCharacter,
  tagKey: string,
) {
  return hasTag(source, tagKey) && hasTag(target, tagKey);
}

function buildPairKey(sourceCharacterId: number, targetCharacterId: number) {
  return sourceCharacterId < targetCharacterId
    ? `${sourceCharacterId}:${targetCharacterId}`
    : `${targetCharacterId}:${sourceCharacterId}`;
}

export function deriveCatalogSynergyWeight(
  source: AnalysisCharacter,
  target: AnalysisCharacter,
) {
  let weight = 0;

  for (const [tagKey, archetypeWeight] of Object.entries(
    SHARED_ARCHETYPE_WEIGHTS,
  )) {
    if (shareTag(source, target, tagKey)) {
      weight += archetypeWeight;
    }
  }

  if (
    shareTag(source, target, 'DoT') &&
    (hasTag(source, 'Support-DPS') || hasTag(target, 'Support-DPS'))
  ) {
    weight += 8;
  }

  if (
    shareTag(source, target, 'Debuff') &&
    (hasTag(source, 'EHR-Scaller') || hasTag(target, 'EHR-Scaller'))
  ) {
    weight += 6;
  }

  if (
    shareTag(source, target, 'Break') &&
    (hasTag(source, 'SpeedTunning') || hasTag(target, 'SpeedTunning'))
  ) {
    weight += 6;
  }

  if (
    hasDerivedArchetype(source, 'follow_up') &&
    hasDerivedArchetype(target, 'follow_up')
  ) {
    weight += FOLLOW_UP_CARRY_WEIGHT;
  }

  if (
    (hasDerivedArchetype(source, 'follow_up') &&
      hasDerivedArchetype(target, 'follow_up_support')) ||
    (hasDerivedArchetype(target, 'follow_up') &&
      hasDerivedArchetype(source, 'follow_up_support'))
  ) {
    weight += FOLLOW_UP_SUPPORT_WEIGHT;
  }

  if (
    (hasDerivedArchetype(source, 'counter') &&
      hasDerivedArchetype(target, 'counter_support')) ||
    (hasDerivedArchetype(target, 'counter') &&
      hasDerivedArchetype(source, 'counter_support'))
  ) {
    weight += COUNTER_SUPPORT_WEIGHT;
  }

  if (
    (hasDerivedArchetype(source, 'summon') &&
      hasDerivedArchetype(target, 'summon_support')) ||
    (hasDerivedArchetype(target, 'summon') &&
      hasDerivedArchetype(source, 'summon_support'))
  ) {
    weight += SUMMON_SUPPORT_WEIGHT + summonSupportBonus(source, target);
  }

  if (
    (hasDerivedArchetype(source, 'hypercarry') &&
      hasDerivedArchetype(target, 'hypercarry_support')) ||
    (hasDerivedArchetype(target, 'hypercarry') &&
      hasDerivedArchetype(source, 'hypercarry_support'))
  ) {
    weight +=
      HYPERCARRY_SUPPORT_WEIGHT + hypercarrySupportBonus(source, target);
  }

  if (weight === 0) {
    return 0;
  }

  return clamp(Math.round(weight), 0, 90);
}

export function mergeDerivedSynergyEdges<T extends BasicSynergyEdge>(
  characters: AnalysisCharacter[],
  explicitEdges: T[],
  createEdge: (
    source: AnalysisCharacter,
    target: AnalysisCharacter,
    weight: number,
  ) => T,
): T[] {
  const mergedByPair = new Map<string, T>();

  for (const edge of explicitEdges) {
    const pairKey = buildPairKey(
      edge.sourceCharacterId,
      edge.targetCharacterId,
    );
    const current = mergedByPair.get(pairKey);

    if (!current || edge.weight > current.weight) {
      mergedByPair.set(pairKey, edge);
    }
  }

  for (let index = 0; index < characters.length - 1; index += 1) {
    for (
      let comparisonIndex = index + 1;
      comparisonIndex < characters.length;
      comparisonIndex += 1
    ) {
      const source = characters[index];
      const target = characters[comparisonIndex];
      const derivedWeight = deriveCatalogSynergyWeight(source, target);

      if (derivedWeight <= 0) {
        continue;
      }

      const pairKey = buildPairKey(source.id, target.id);
      const current = mergedByPair.get(pairKey);

      if (current && current.weight >= derivedWeight) {
        continue;
      }

      mergedByPair.set(pairKey, createEdge(source, target, derivedWeight));
    }
  }

  return [...mergedByPair.values()];
}
