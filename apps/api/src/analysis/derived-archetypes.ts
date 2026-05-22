import type { AnalysisCharacter } from './types';

type CharacterLike = Pick<
  AnalysisCharacter,
  'name' | 'path' | 'roleText' | 'tagKeys'
>;

export type DerivedArchetypeKey =
  | 'follow_up'
  | 'follow_up_support'
  | 'counter'
  | 'counter_support'
  | 'summon'
  | 'summon_support'
  | 'hypercarry'
  | 'hypercarry_support';

const FOLLOW_UP_CARRY_NAMES = new Set([
  'dr ratio',
  'feixiao',
  'herta',
  'sra herta',
  'topaz y conti',
]);

const FOLLOW_UP_SUPPORT_NAMES = new Set(['aventurine', 'robin']);
const COUNTER_CARRY_NAMES = new Set(['clara', 'yunli']);
const COUNTER_SUPPORT_NAMES = new Set([
  'huohuo',
  'robin',
  'sparkle',
  'sunday',
  'tingyun',
]);
const SUMMON_CARRY_NAMES = new Set(['jing yuan']);
const SUMMON_SUPPORT_NAMES = new Set([
  'robin',
  'sunday',
  'trazacaminos reminiscencia',
]);
const HYPERCARRY_CARRY_NAMES = new Set([
  'argenti',
  'blade',
  'dan heng imbibitor lunae',
  'jingliu',
  'seele',
]);
const HYPERCARRY_SUPPORT_NAMES = new Set(['bronya', 'sparkle', 'sunday']);

function normalizeName(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function isDamageDealerLike(character: CharacterLike) {
  const roleText = normalizeText(character.roleText);
  return (
    character.tagKeys.includes('DPS') ||
    character.tagKeys.includes('Support-DPS') ||
    roleText.includes('dps')
  );
}

function isRemembranceCharacter(character: CharacterLike) {
  return normalizeText(character.path).includes('remembrance');
}

export function getDerivedArchetypes(
  character: CharacterLike,
): Set<DerivedArchetypeKey> {
  const derived = new Set<DerivedArchetypeKey>();
  const normalizedName = normalizeName(character.name);

  if (FOLLOW_UP_CARRY_NAMES.has(normalizedName)) {
    derived.add('follow_up');
  }

  if (FOLLOW_UP_SUPPORT_NAMES.has(normalizedName)) {
    derived.add('follow_up_support');
  }

  if (COUNTER_CARRY_NAMES.has(normalizedName)) {
    derived.add('counter');
  }

  if (COUNTER_SUPPORT_NAMES.has(normalizedName)) {
    derived.add('counter_support');
  }

  if (
    SUMMON_CARRY_NAMES.has(normalizedName) ||
    (isRemembranceCharacter(character) && isDamageDealerLike(character))
  ) {
    derived.add('summon');
  }

  if (SUMMON_SUPPORT_NAMES.has(normalizedName)) {
    derived.add('summon_support');
  }

  if (HYPERCARRY_CARRY_NAMES.has(normalizedName)) {
    derived.add('hypercarry');
  }

  if (HYPERCARRY_SUPPORT_NAMES.has(normalizedName)) {
    derived.add('hypercarry_support');
  }

  return derived;
}

export function hasDerivedArchetype(
  character: CharacterLike,
  archetype: DerivedArchetypeKey,
) {
  return getDerivedArchetypes(character).has(archetype);
}
