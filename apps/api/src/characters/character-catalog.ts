import { StatKey, TagCategory, TraceStatKey } from '@prisma/client';

export const DEFAULT_BASE_CRIT_RATE = 0.05;
export const DEFAULT_BASE_CRIT_DAMAGE = 0.5;

export const CHARACTER_STAT_KEYS = [
  'hp',
  'atk',
  'def',
  'speed',
  'crit_rate',
  'crit_damage',
  'break_effect',
  'energy_regen_rate',
  'effect_hit_rate',
  'effect_res',
  'elemental_dmg_bonus',
] as const;

export type CharacterStatKey = (typeof CHARACTER_STAT_KEYS)[number];
export type CharacterStatMap = Partial<Record<CharacterStatKey, number>>;
export type CharacterStatSource =
  | 'catalog_default'
  | 'user_input'
  | 'legacy_migrated';
export type CharacterStatSourceMap = Partial<
  Record<CharacterStatKey, CharacterStatSource>
>;

export type CharacterTagBuckets = {
  pros: string[];
  cons: string[];
  archetypes: string[];
  roles: string[];
  characteristics: string[];
  special: string[];
  all: string[];
};

export type CharacterStatProfile = {
  prioritizedStatKeys: CharacterStatKey[];
  enabledStatKeys: CharacterStatKey[];
};

export const CHARACTER_STAT_LABELS_ES: Record<CharacterStatKey, string> = {
  hp: 'Vida',
  atk: 'Ataque',
  def: 'Defensa',
  speed: 'Velocidad',
  crit_rate: 'Probabilidad de Crítico',
  crit_damage: 'Daño Crítico',
  break_effect: 'Efecto de Ruptura',
  energy_regen_rate: 'Regeneración de energía',
  effect_hit_rate: 'Acierto de efecto',
  effect_res: 'Resistencia de efecto',
  elemental_dmg_bonus: 'Bono de daño elemental',
};

const TRACE_STAT_KEY_BY_PRISMA: Partial<
  Record<TraceStatKey, CharacterStatKey>
> = {
  SPEED_FLAT: 'speed',
  CRIT_RATE: 'crit_rate',
  CRIT_DAMAGE: 'crit_damage',
  BREAK_EFFECT: 'break_effect',
  ENERGY_REGEN_RATE: 'energy_regen_rate',
  EFFECT_HIT_RATE: 'effect_hit_rate',
  EFFECT_RES: 'effect_res',
  ELEMENTAL_DMG_BONUS: 'elemental_dmg_bonus',
};

const STAT_KEY_TO_PRISMA: Record<CharacterStatKey, StatKey> = {
  hp: StatKey.HP,
  atk: StatKey.ATK,
  def: StatKey.DEF,
  speed: StatKey.SPEED,
  crit_rate: StatKey.CRIT_RATE,
  crit_damage: StatKey.CRIT_DAMAGE,
  break_effect: StatKey.BREAK_EFFECT,
  energy_regen_rate: StatKey.ENERGY_REGEN_RATE,
  effect_hit_rate: StatKey.EFFECT_HIT_RATE,
  effect_res: StatKey.EFFECT_RES,
  elemental_dmg_bonus: StatKey.ELEMENTAL_DMG_BONUS,
};

const TAG_CATEGORY_TO_BUCKET: Record<
  TagCategory,
  keyof Omit<CharacterTagBuckets, 'all'>
> = {
  PRO: 'pros',
  CON: 'cons',
  ARCHETYPE: 'archetypes',
  ROLE: 'roles',
  CHARACTERISTIC: 'characteristics',
  SPECIAL: 'special',
};

const PERCENT_TRACE_STAT_TO_BASE_STAT: Partial<
  Record<TraceStatKey, 'hp' | 'atk' | 'def'>
> = {
  HP_PERCENT: 'hp',
  ATK_PERCENT: 'atk',
  DEF_PERCENT: 'def',
};

function uniqueStatKeys(keys: CharacterStatKey[]) {
  return [...new Set(keys)];
}

export function toPrismaStatKey(statKey: CharacterStatKey) {
  return STAT_KEY_TO_PRISMA[statKey];
}

export function fromPrismaTraceStat(
  statKey: TraceStatKey,
  value: number,
): [CharacterStatKey, number] | null {
  const mappedStatKey = TRACE_STAT_KEY_BY_PRISMA[statKey];

  if (!mappedStatKey) {
    return null;
  }

  return [mappedStatKey, value];
}

export function normalizeStatValue(statKey: CharacterStatKey, value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (
    statKey === 'hp' ||
    statKey === 'atk' ||
    statKey === 'def' ||
    statKey === 'speed'
  ) {
    return Math.max(0, Math.round(value));
  }

  return Math.max(0, Number(value.toFixed(4)));
}

export function normalizeUserStatsMap(
  stats: CharacterStatMap,
): CharacterStatMap {
  const normalized: CharacterStatMap = {};

  for (const statKey of CHARACTER_STAT_KEYS) {
    const value = stats[statKey];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      continue;
    }

    normalized[statKey] = normalizeStatValue(statKey, value);
  }

  return normalized;
}

export function buildTagBuckets(
  tags: Array<{ key: string; category: TagCategory }>,
): CharacterTagBuckets {
  const buckets: CharacterTagBuckets = {
    pros: [],
    cons: [],
    archetypes: [],
    roles: [],
    characteristics: [],
    special: [],
    all: [],
  };

  for (const tag of tags) {
    const bucket = TAG_CATEGORY_TO_BUCKET[tag.category];
    buckets[bucket].push(tag.key);
    buckets.all.push(tag.key);
  }

  return {
    ...buckets,
    pros: [...new Set(buckets.pros)],
    cons: [...new Set(buckets.cons)],
    archetypes: [...new Set(buckets.archetypes)],
    roles: [...new Set(buckets.roles)],
    characteristics: [...new Set(buckets.characteristics)],
    special: [...new Set(buckets.special)],
    all: [...new Set(buckets.all)],
  };
}

export function buildCharacterStatProfile(
  tagBuckets: CharacterTagBuckets,
): CharacterStatProfile {
  const prioritized: CharacterStatKey[] = [];
  const enabled: CharacterStatKey[] = [];
  const isDoT = tagBuckets.archetypes.includes('DoT');
  const isDebuff = tagBuckets.archetypes.includes('Debuff');
  const isBreak =
    tagBuckets.archetypes.includes('Break') ||
    tagBuckets.characteristics.includes('BreakPlayed');

  const enable = (...statKeys: CharacterStatKey[]) => {
    enabled.push(...statKeys);
  };

  const prioritize = (...statKeys: CharacterStatKey[]) => {
    prioritized.push(...statKeys);
    enabled.push(...statKeys);
  };

  if (tagBuckets.characteristics.includes('HP-Scaller')) {
    prioritize('hp');
  }

  if (tagBuckets.characteristics.includes('ATK-Scaller')) {
    prioritize('atk');
  }

  if (tagBuckets.characteristics.includes('DEF-Scaller')) {
    prioritize('def');
  }

  if (tagBuckets.characteristics.includes('SPD-Scaller')) {
    prioritize('speed');
  }

  if (tagBuckets.characteristics.includes('Break-Scaller')) {
    prioritize('break_effect');
    enable('speed');
  }

  if (tagBuckets.characteristics.includes('CritDMG-Scaller')) {
    prioritize('crit_damage');
    enable('crit_rate');
  }

  if (tagBuckets.characteristics.includes('EHR-Scaller')) {
    prioritize('effect_hit_rate');
  }

  if (isBreak) {
    enable('break_effect', 'speed');
  }

  if (isDebuff || isDoT) {
    enable('effect_hit_rate');
  }

  if (
    tagBuckets.roles.includes('DPS') ||
    tagBuckets.roles.includes('Support-DPS')
  ) {
    if (!isDoT && !isBreak) {
      enable('crit_rate', 'crit_damage');
    }

    enable('elemental_dmg_bonus', 'speed');
  }

  if (tagBuckets.roles.includes('Amplifier')) {
    enable('speed', 'energy_regen_rate', 'effect_res');
  }

  if (tagBuckets.roles.includes('Sustain')) {
    enable('speed', 'effect_res', 'energy_regen_rate');
  }

  if (
    tagBuckets.characteristics.includes('HighSpeed') ||
    tagBuckets.characteristics.includes('SpeedTunning') ||
    tagBuckets.characteristics.includes('SpdBreakpoint')
  ) {
    enable('speed');
  }

  if (
    tagBuckets.characteristics.includes('HighEnergy') ||
    tagBuckets.characteristics.includes('VeryHighEnergy') ||
    tagBuckets.characteristics.includes('UltimateReliance')
  ) {
    enable('energy_regen_rate');
  }

  if (!enabled.includes('speed')) {
    enable('speed');
  }

  return {
    prioritizedStatKeys: uniqueStatKeys(prioritized),
    enabledStatKeys: uniqueStatKeys(enabled),
  };
}

export function buildCharacterDefaultStats(input: {
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseSpeed: number;
  baseCritRate?: number | null;
  baseCritDamage?: number | null;
  traceStats?: Array<{ statKey: TraceStatKey; value: number }>;
}): CharacterStatMap {
  const stats: CharacterStatMap = {
    hp: input.baseHp,
    atk: input.baseAtk,
    def: input.baseDef,
    speed: input.baseSpeed,
    crit_rate: input.baseCritRate ?? DEFAULT_BASE_CRIT_RATE,
    crit_damage: input.baseCritDamage ?? DEFAULT_BASE_CRIT_DAMAGE,
    break_effect: 0,
    energy_regen_rate: 0,
    effect_hit_rate: 0,
    effect_res: 0,
    elemental_dmg_bonus: 0,
  };

  for (const traceStat of input.traceStats ?? []) {
    const percentBaseStatKey =
      PERCENT_TRACE_STAT_TO_BASE_STAT[traceStat.statKey];

    if (percentBaseStatKey) {
      const baseValue =
        percentBaseStatKey === 'hp'
          ? input.baseHp
          : percentBaseStatKey === 'atk'
            ? input.baseAtk
            : input.baseDef;

      stats[percentBaseStatKey] =
        (stats[percentBaseStatKey] ?? 0) + baseValue * traceStat.value;
      continue;
    }

    const parsedTraceStat = fromPrismaTraceStat(
      traceStat.statKey,
      traceStat.value,
    );

    if (!parsedTraceStat) {
      continue;
    }

    const [statKey, value] = parsedTraceStat;
    stats[statKey] = (stats[statKey] ?? 0) + value;
  }

  return normalizeUserStatsMap(stats);
}

export function mergeCharacterStats(
  baseStats: CharacterStatMap,
  overrideStats?: CharacterStatMap | null,
): CharacterStatMap {
  return normalizeUserStatsMap({
    ...baseStats,
    ...(overrideStats ?? {}),
  });
}

export function buildCharacterStatSources(
  baseStats: CharacterStatMap,
  overrideStats: CharacterStatMap | null | undefined,
  overrideSource: CharacterStatSource = 'user_input',
): CharacterStatSourceMap {
  const sources: CharacterStatSourceMap = {};

  for (const statKey of CHARACTER_STAT_KEYS) {
    if (baseStats[statKey] !== undefined) {
      sources[statKey] = 'catalog_default';
    }
  }

  for (const statKey of CHARACTER_STAT_KEYS) {
    if (overrideStats?.[statKey] !== undefined) {
      sources[statKey] = overrideSource;
    }
  }

  return sources;
}

export function serializeRoleText(tagBuckets: CharacterTagBuckets) {
  if (tagBuckets.roles.length === 0) {
    return 'Unknown';
  }

  return tagBuckets.roles.join(' / ');
}
