const path = require('path');
const {
  PrismaClient,
  TagCategory,
  TraceStatKey,
} = require('@prisma/client');
const { hashSync } = require('bcryptjs');
const XLSX = require('xlsx');

const prisma = new PrismaClient();

const ROOT_DIR = path.resolve(__dirname, '..', '..', '..');
const CHARACTERS_XLSX_PATH = path.join(ROOT_DIR, 'BD Personajes.xlsx');
const TAGS_XLSX_PATH = path.join(ROOT_DIR, 'Tags.xlsx');
const GAME_VERSION = '3.8';
const DEFAULT_BASE_CRIT_RATE = 0.05;
const DEFAULT_BASE_CRIT_DAMAGE = 0.5;

const PATH_BY_ES = {
  Abundancia: 'Abundance',
  Armonía: 'Harmony',
  Cacería: 'Hunt',
  Conservación: 'Preservation',
  Destrucción: 'Destruction',
  Erudición: 'Erudition',
  Nihilidad: 'Nihility',
  Reminiscencia: 'Remembrance',
};

const ELEMENT_BY_ES = {
  Cuántico: 'Quantum',
  Fuego: 'Fire',
  Físico: 'Physical',
  Hielo: 'Ice',
  Imaginario: 'Imaginary',
  Rayo: 'Lightning',
  Viento: 'Wind',
};

const TAG_CATEGORY_BY_SECTION = {
  Pros: TagCategory.PRO,
  Contras: TagCategory.CON,
  Arquetipos: TagCategory.ARCHETYPE,
  Rol: TagCategory.ROLE,
  Características: TagCategory.CHARACTERISTIC,
};

const TRACE_COLUMN_CONFIG = [
  { index: 8, statKey: TraceStatKey.HP_PERCENT, type: 'percent' },
  { index: 9, statKey: TraceStatKey.ATK_PERCENT, type: 'percent' },
  { index: 10, statKey: TraceStatKey.DEF_PERCENT, type: 'percent' },
  { index: 11, statKey: TraceStatKey.SPEED_FLAT, type: 'flat' },
  { index: 12, statKey: TraceStatKey.CRIT_RATE, type: 'percent' },
  { index: 13, statKey: TraceStatKey.CRIT_DAMAGE, type: 'percent' },
  { index: 14, statKey: TraceStatKey.BREAK_EFFECT, type: 'percent' },
  { index: 16, statKey: TraceStatKey.EFFECT_HIT_RATE, type: 'percent' },
  { index: 17, statKey: TraceStatKey.EFFECT_RES, type: 'percent' },
];

const ELEMENT_DMG_COLUMN_BY_ELEMENT = {
  Physical: 18,
  Fire: 19,
  Ice: 20,
  Lightning: 21,
  Wind: 22,
  Quantum: 23,
  Imaginary: 24,
};

const MANUAL_ALIASES_BY_NAME = {
  'Cisne Negro': ['Black Swan'],
  'Topaz y Conti': ['Topaz'],
  Sparkle: ['Hanabi'],
  'Quinque': ['Qingque'],
  Yanquing: ['Yanqing'],
  'Luciérnaga': ['Firefly'],
  'Sra. Herta': ['Madam Herta', 'The Herta'],
  'Siete de Marzo': ['March 7th'],
  'Siete de Marzo: Cacería': ['March 7th Hunt', 'March 7th - Hunt'],
  'Dan Heng - Imbibitor Lunae': ['Dan Heng IL', 'Dan Heng Imbibitor Lunae'],
  'Dan Heng - Permansor Terrae': ['Dan Heng PT', 'Dan Heng Permansor Terrae'],
  'Trazacaminos - Destrucción': [
    'Trailblazer Destruction',
    'PMC',
  ],
  'Trazacaminos - Conservación': [
    'Trailblazer Preservation',
    'FMC',
  ],
  'Trazacaminos - Armonía': [
    'Trailblazer Harmony',
    'Harmony Main Character',
    'HMC',
  ],
  'Trazacaminos: Reminiscencia': [
    'Trailblazer Remembrance',
    'Remembrance Main Character',
    'RMC',
  ],
  Cífer: ['Cipher'],
  Fainón: ['Phainon'],
  'Silver Wolf': ['SW'],
  Tribbie: ['Trispios'],
  Anaxa: ['Anaxagoras'],
  Hyacine: ['Ica'],
  Midei: ['Mydei', 'Mydeimos', 'Mideimos'],
};

const lightCones = [
  {
    name: 'Along the Passing Shore',
    path: 'Nihility',
    rarity: 5,
    effectDescription: 'Crit-focused signature cone with debuff synergy.',
  },
  {
    name: 'Good Night and Sleep Well',
    path: 'Nihility',
    rarity: 4,
    effectDescription: 'Scales with debuff count and fits DoT or debuff teams.',
  },
  {
    name: 'Eyes of the Prey',
    path: 'Nihility',
    rarity: 4,
    effectDescription: 'Boosts effect hit rate and damage over time output.',
  },
  {
    name: 'Patience Is All You Need',
    path: 'Nihility',
    rarity: 5,
    effectDescription: 'Premium Kafka option with speed and damage bonuses.',
  },
  {
    name: 'But the Battle Isnt Over',
    path: 'Harmony',
    rarity: 5,
    effectDescription: 'Energy and team utility for hypercarry supports.',
  },
  {
    name: 'Past and Future',
    path: 'Harmony',
    rarity: 4,
    effectDescription: 'Simple buffing cone for action-forward support units.',
  },
  {
    name: 'Carve the Moon, Weave the Clouds',
    path: 'Harmony',
    rarity: 4,
    effectDescription: 'Rotating team buffs for general Harmony value.',
  },
  {
    name: 'Earthly Escapade',
    path: 'Harmony',
    rarity: 5,
    effectDescription: 'High-value crit support option for premium buffers.',
  },
  {
    name: 'Echoes of the Coffin',
    path: 'Abundance',
    rarity: 5,
    effectDescription: 'Healing utility with extra team tempo support.',
  },
  {
    name: 'Time Waits for No One',
    path: 'Abundance',
    rarity: 5,
    effectDescription: 'Reliable healing cone with extra damage contribution.',
  },
  {
    name: 'Shared Feeling',
    path: 'Abundance',
    rarity: 4,
    effectDescription: 'Energy support and healing for utility sustain builds.',
  },
  {
    name: 'Moment of Victory',
    path: 'Preservation',
    rarity: 5,
    effectDescription: 'Defensive signature cone for tanky preservation units.',
  },
  {
    name: 'Texture of Memories',
    path: 'Preservation',
    rarity: 5,
    effectDescription: 'Free defensive option with strong survivability value.',
  },
  {
    name: 'Trend of the Universal Market',
    path: 'Preservation',
    rarity: 4,
    effectDescription: 'Utility option that adds burn pressure in some teams.',
  },
  {
    name: 'On the Fall of an Aeon',
    path: 'Destruction',
    rarity: 5,
    effectDescription: 'F2P premium attack scaling cone for destruction carries.',
  },
  {
    name: 'Something Irreplaceable',
    path: 'Destruction',
    rarity: 5,
    effectDescription: 'Generalist destruction cone with sustain and damage.',
  },
  {
    name: 'The Moles Welcome You',
    path: 'Destruction',
    rarity: 4,
    effectDescription: 'Stacking attack option for budget destruction builds.',
  },
  {
    name: 'Worrisome, Blissful',
    path: 'Hunt',
    rarity: 5,
    effectDescription: 'Follow-up oriented signature option for Hunt units.',
  },
  {
    name: 'Cruising in the Stellar Sea',
    path: 'Hunt',
    rarity: 5,
    effectDescription: 'Excellent F2P cone with strong crit support.',
  },
  {
    name: 'Only Silence Remains',
    path: 'Hunt',
    rarity: 4,
    effectDescription: 'Solid single-target cone when enemy count is low.',
  },
];

const synergyRules = [
  { source: 'Kafka', target: 'Black Swan', weight: 95, note: 'Best in slot DoT core.' },
  { source: 'Kafka', target: 'Ruan Mei', weight: 78, note: 'Universal speed and dmg amplification.' },
  { source: 'Acheron', target: 'Pela', weight: 84, note: 'Reliable DEF shred for ultimate spikes.' },
  { source: 'Acheron', target: 'Jiaoqiu', weight: 92, note: 'Premier Nihility partner for stack flow.' },
  { source: 'Jingliu', target: 'Bronya', weight: 91, note: 'Action advance and crit scaling synergy.' },
  { source: 'Blade', target: 'Ruan Mei', weight: 73, note: 'Damage and speed gains across cycles.' },
  { source: 'Topaz', target: 'Dr. Ratio', weight: 94, note: 'Follow-up centered dual DPS core.' },
  { source: 'Topaz', target: 'Robin', weight: 86, note: 'Follow-up teams gain strong buffs.' },
  { source: 'Dr. Ratio', target: 'Silver Wolf', weight: 88, note: 'Debuffs improve consistency and output.' },
  { source: 'Sunday', target: 'Jingliu', weight: 89, note: 'Hypercarry setup with high buff uptime.' },
  { source: 'Sunday', target: 'Acheron', weight: 81, note: 'Good hypercarry utility and team tempo.' },
  { source: 'Robin', target: 'Aventurine', weight: 70, note: 'Safe sustain core for buff windows.' },
  { source: 'Sparkle', target: 'Acheron', weight: 74, note: 'Skill point economy and burst tempo.' },
  { source: 'Fu Xuan', target: 'Acheron', weight: 68, note: 'Stability for high-risk hypercarry comps.' },
  { source: 'Luocha', target: 'Blade', weight: 82, note: 'Comfort sustain with offensive uptime.' },
];

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function slugify(value) {
  return normalizeText(value).replace(/\s+/g, '-');
}

function parseString(value) {
  return String(value ?? '').trim();
}

function parseIntStrict(value) {
  const parsed = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.trunc(parsed);
}

function parsePercentOrNumber(value) {
  if (value === '' || value == null) {
    return null;
  }

  if (typeof value === 'number') {
    const normalized = Math.abs(value) > 1 ? value / 100 : value;
    return Number(normalized.toFixed(4));
  }

  const raw = String(value).trim();
  if (!raw) {
    return null;
  }

  const isPercent = raw.includes('%');
  const parsed = Number(raw.replace('%', '').replace(',', '.'));
  if (!Number.isFinite(parsed)) {
    return null;
  }

  const normalized = isPercent || Math.abs(parsed) > 1 ? parsed / 100 : parsed;
  return Number(normalized.toFixed(4));
}

function splitMultiValueCell(value) {
  const raw = parseString(value);
  if (!raw) {
    return [];
  }

  return raw
    .split(/[;,|]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function uniq(values) {
  return [...new Set(values)];
}

function normalizeStatValue(statKey, value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (statKey === 'hp' || statKey === 'atk' || statKey === 'def' || statKey === 'speed') {
    return Math.max(0, Math.trunc(value));
  }

  return Math.max(0, Number(value.toFixed(4)));
}

function normalizeStatsMap(stats) {
  const normalized = {};

  for (const [statKey, value] of Object.entries(stats)) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      continue;
    }

    normalized[statKey] = normalizeStatValue(statKey, value);
  }

  return normalized;
}

function readSheetRows(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
}

function buildTagCatalog() {
  const rows = readSheetRows(TAGS_XLSX_PATH);
  let currentCategory = TagCategory.PRO;
  const tags = [];

  for (const row of rows) {
    const label = parseString(row[0]);
    const description = parseString(row[1]);

    if (!label) {
      continue;
    }

    const nextCategory = TAG_CATEGORY_BY_SECTION[label];
    if (nextCategory) {
      currentCategory = nextCategory;
      continue;
    }

    tags.push({
      key: label,
      displayLabel: label,
      category: currentCategory,
      internalDescription: description || null,
    });
  }

  return tags;
}

function assertColumnValue(row, index, label) {
  const value = parseString(row[index]);
  if (!value) {
    throw new Error(`Fila invalida en Excel: falta ${label}.`);
  }

  return value;
}

function buildCharacterCatalog(tagCatalog) {
  const validTagKeys = new Set(tagCatalog.map((tag) => tag.key));
  const rows = readSheetRows(CHARACTERS_XLSX_PATH).slice(2);
  const characters = [];

  for (const row of rows) {
    const rawName = parseString(row[0]);
    if (!rawName) {
      continue;
    }

    const pathEs = assertColumnValue(row, 1, 'Vía');
    const elementEs = assertColumnValue(row, 2, 'Elemento');
    const rarityRaw = assertColumnValue(row, 3, 'Rareza');
    const baseHp = parseIntStrict(row[4]);
    const baseAtk = parseIntStrict(row[5]);
    const baseDef = parseIntStrict(row[6]);
    const baseSpeed = parseIntStrict(row[7]);

    if (
      baseHp == null ||
      baseAtk == null ||
      baseDef == null ||
      baseSpeed == null
    ) {
      throw new Error(`El personaje ${rawName} tiene stats base invalidos.`);
    }

    const mappedPath = PATH_BY_ES[pathEs];
    const mappedElement = ELEMENT_BY_ES[elementEs];
    if (!mappedPath || !mappedElement) {
      throw new Error(
        `No se pudo mapear la via/elemento de ${rawName}: ${pathEs} / ${elementEs}.`,
      );
    }

    const rarity = parseIntStrict(rarityRaw);
    if (rarity == null) {
      throw new Error(`Rareza invalida para ${rawName}: ${rarityRaw}.`);
    }

    const genericTags = row.slice(25, 29).flatMap(splitMultiValueCell);
    const roles = row.slice(29, 31).flatMap(splitMultiValueCell);
    const characteristics = row.slice(31, 36).flatMap(splitMultiValueCell);
    const tagKeys = uniq([...genericTags, ...roles, ...characteristics]);

    for (const tagKey of tagKeys) {
      if (!validTagKeys.has(tagKey)) {
        throw new Error(`El tag ${tagKey} de ${rawName} no existe en Tags.xlsx.`);
      }
    }

    const traceStats = [];
    for (const config of TRACE_COLUMN_CONFIG) {
      const value =
        config.type === 'percent'
          ? parsePercentOrNumber(row[config.index])
          : parseIntStrict(row[config.index]);

      if (value == null) {
        continue;
      }

      traceStats.push({
        statKey: config.statKey,
        value,
      });
    }

    const elementalDmgColumn = ELEMENT_DMG_COLUMN_BY_ELEMENT[mappedElement];
    const elementalDmgBonus = parsePercentOrNumber(row[elementalDmgColumn]);
    if (elementalDmgBonus != null) {
      traceStats.push({
        statKey: TraceStatKey.ELEMENTAL_DMG_BONUS,
        value: elementalDmgBonus,
      });
    }

    const roleText = roles.length > 0 ? roles.join(' / ') : 'Unknown';
    const aliases = uniq([
      ...(MANUAL_ALIASES_BY_NAME[rawName] ?? []),
      rawName.includes(' - ') ? rawName.replace(/\s-\s/g, ': ') : '',
    ].filter(Boolean));

    characters.push({
      name: rawName,
      normalizedName: normalizeText(rawName),
      element: mappedElement,
      path: mappedPath,
      role: roleText,
      rarity,
      gameVersion: GAME_VERSION,
      baseHp,
      baseAtk,
      baseDef,
      baseCritRate: DEFAULT_BASE_CRIT_RATE,
      baseCritDamage: DEFAULT_BASE_CRIT_DAMAGE,
      baseSpeed,
      tagKeys,
      roles,
      characteristics,
      aliases,
      traceStats,
    });
  }

  return characters;
}

function buildExistingCharacterLookup(existingCharacters) {
  const lookup = new Map();

  for (const character of existingCharacters) {
    lookup.set(normalizeText(character.name), character);

    for (const alias of character.aliases ?? []) {
      lookup.set(alias.normalizedAlias, character);
    }
  }

  return lookup;
}

function buildDefaultFinalStats(record) {
  const stats = {
    hp: record.baseHp,
    atk: record.baseAtk,
    def: record.baseDef,
    speed: record.baseSpeed,
    crit_rate: record.baseCritRate,
    crit_damage: record.baseCritDamage,
    break_effect: 0,
    energy_regen_rate: 0,
    effect_hit_rate: 0,
    effect_res: 0,
    elemental_dmg_bonus: 0,
  };

  for (const traceStat of record.traceStats) {
    switch (traceStat.statKey) {
      case TraceStatKey.SPEED_FLAT:
        stats.speed += traceStat.value;
        break;
      case TraceStatKey.CRIT_RATE:
        stats.crit_rate += traceStat.value;
        break;
      case TraceStatKey.CRIT_DAMAGE:
        stats.crit_damage += traceStat.value;
        break;
      case TraceStatKey.BREAK_EFFECT:
        stats.break_effect += traceStat.value;
        break;
      case TraceStatKey.ENERGY_REGEN_RATE:
        stats.energy_regen_rate += traceStat.value;
        break;
      case TraceStatKey.EFFECT_HIT_RATE:
        stats.effect_hit_rate += traceStat.value;
        break;
      case TraceStatKey.EFFECT_RES:
        stats.effect_res += traceStat.value;
        break;
      case TraceStatKey.ELEMENTAL_DMG_BONUS:
        stats.elemental_dmg_bonus += traceStat.value;
        break;
      default:
        break;
    }
  }

  return normalizeStatsMap(stats);
}

function parseJsonObject(rawValue) {
  if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) {
    return {};
  }

  return rawValue;
}

function buildLegacyOverrideStats(userCharacter) {
  return normalizeStatsMap({
    hp: userCharacter.hp ?? undefined,
    atk: userCharacter.atk,
    def: userCharacter.def ?? undefined,
    speed: userCharacter.speed,
    crit_rate: userCharacter.critRate,
    crit_damage: userCharacter.critDamage,
    break_effect: userCharacter.breakEffect ?? undefined,
    energy_regen_rate: userCharacter.energyRegenRate ?? undefined,
    effect_hit_rate: userCharacter.effectHitRate ?? undefined,
    effect_res: userCharacter.effectRes ?? undefined,
    elemental_dmg_bonus: userCharacter.elementalDmgBonus ?? undefined,
  });
}

function buildCatalogSourceMap(baseStats) {
  const sources = {};

  for (const statKey of Object.keys(baseStats)) {
    sources[statKey] = 'catalog_default';
  }

  return sources;
}

function toUserCharacterPersistence(stats, statSources) {
  return {
    stats,
    statSources,
    hp: stats.hp ?? null,
    atk: stats.atk ?? 0,
    def: stats.def ?? null,
    critRate: stats.crit_rate ?? 0,
    critDamage: stats.crit_damage ?? 0,
    breakEffect: stats.break_effect ?? null,
    energyRegenRate: stats.energy_regen_rate ?? null,
    effectHitRate: stats.effect_hit_rate ?? null,
    effectRes: stats.effect_res ?? null,
    elementalDmgBonus: stats.elemental_dmg_bonus ?? null,
    speed: stats.speed ?? 0,
  };
}

function resolveExistingCharacter(record, existingLookup, claimedCharacterIds) {
  const candidates = uniq([record.normalizedName, ...record.aliases.map(normalizeText)]);
  const matches = uniq(
    candidates
      .map((candidate) => existingLookup.get(candidate))
      .filter(Boolean)
      .map((character) => character.id),
  );

  if (matches.length > 1) {
    throw new Error(
      `El personaje ${record.name} coincide con multiples registros existentes (${matches.join(', ')}).`,
    );
  }

  if (matches.length === 0) {
    return null;
  }

  const matchedCharacter = existingLookup.get(candidates.find((candidate) => {
    const existing = existingLookup.get(candidate);
    return existing && existing.id === matches[0];
  }));

  if (!matchedCharacter) {
    return null;
  }

  if (claimedCharacterIds.has(matchedCharacter.id)) {
    throw new Error(
      `El personaje existente ${matchedCharacter.name} se intento reutilizar mas de una vez durante la importacion.`,
    );
  }

  claimedCharacterIds.add(matchedCharacter.id);
  return matchedCharacter;
}

function createAliasRows(characterId, record) {
  const rowsByNormalizedAlias = new Map();

  for (const alias of uniq(record.aliases)) {
    const normalizedAlias = normalizeText(alias);

    if (normalizedAlias === record.normalizedName) {
      continue;
    }

    if (!rowsByNormalizedAlias.has(normalizedAlias)) {
      rowsByNormalizedAlias.set(normalizedAlias, {
        characterId,
        alias,
        normalizedAlias,
        locale: null,
        source: 'excel_v38',
      });
    }
  }

  return [...rowsByNormalizedAlias.values()];
}

function createTagRows(characterId, record) {
  return record.tagKeys.map((tagKey) => ({
    characterId,
    tagKey,
  }));
}

function createTraceRows(characterId, record) {
  return record.traceStats.map((traceStat) => ({
    characterId,
    statKey: traceStat.statKey,
    value: traceStat.value,
  }));
}

async function seedCharacterCatalog() {
  const tagCatalog = buildTagCatalog();
  const characterCatalog = buildCharacterCatalog(tagCatalog);
  const existingCharacters = await prisma.character.findMany({
    include: {
      aliases: true,
      userCharacters: {
        select: { id: true },
      },
    },
  });

  const existingLookup = buildExistingCharacterLookup(existingCharacters);
  const claimedCharacterIds = new Set();
  const importedCharacters = [];

  for (const record of characterCatalog) {
    const matchedCharacter = resolveExistingCharacter(
      record,
      existingLookup,
      claimedCharacterIds,
    );

    importedCharacters.push({
      ...record,
      matchedCharacterId: matchedCharacter?.id ?? null,
    });
  }

  const importedCharacterIds = new Set(
    importedCharacters
      .map((record) => record.matchedCharacterId)
      .filter((value) => value != null),
  );

  const staleCharacters = existingCharacters.filter(
    (character) => !importedCharacterIds.has(character.id),
  );
  const blockedStaleCharacters = staleCharacters.filter(
    (character) => character.userCharacters.length > 0,
  );

  if (blockedStaleCharacters.length > 0) {
    throw new Error(
      `No se puede limpiar el catalogo viejo porque estos personajes aun estan vinculados a usuarios: ${blockedStaleCharacters
        .map((character) => character.name)
        .join(', ')}.`,
    );
  }

  return prisma.$transaction(async (tx) => {
    await tx.characterSynergy.deleteMany();
    await tx.characterAlias.deleteMany();
    await tx.characterTag.deleteMany();
    await tx.characterTraceStat.deleteMany();
    await tx.tagDefinition.deleteMany();

    const characterIdByName = new Map();

    for (const record of importedCharacters) {
      const data = {
        name: record.name,
        slug: slugify(record.name),
        element: record.element,
        path: record.path,
        role: record.role,
        rarity: record.rarity,
        gameVersion: record.gameVersion,
        status: 'PUBLISHED',
        baseHp: record.baseHp,
        baseAtk: record.baseAtk,
        baseDef: record.baseDef,
        baseCritRate: record.baseCritRate,
        baseCritDamage: record.baseCritDamage,
        baseSpeed: record.baseSpeed,
      };

      const character = record.matchedCharacterId
        ? await tx.character.update({
            where: { id: record.matchedCharacterId },
            data,
          })
        : await tx.character.create({ data });

      characterIdByName.set(record.name, character.id);
    }

    const importedRecordByCharacterId = new Map(
      importedCharacters.map((record) => [
        characterIdByName.get(record.name),
        record,
      ]),
    );

    if (staleCharacters.length > 0) {
      await tx.character.deleteMany({
        where: {
          id: {
            in: staleCharacters.map((character) => character.id),
          },
        },
      });
    }

    await tx.tagDefinition.createMany({
      data: tagCatalog,
    });

    const aliasRows = importedCharacters.flatMap((record) =>
      createAliasRows(characterIdByName.get(record.name), record),
    );
    if (aliasRows.length > 0) {
      await tx.characterAlias.createMany({ data: aliasRows });
    }

    const tagRows = importedCharacters.flatMap((record) =>
      createTagRows(characterIdByName.get(record.name), record),
    );
    if (tagRows.length > 0) {
      await tx.characterTag.createMany({ data: tagRows });
    }

    const traceRows = importedCharacters.flatMap((record) =>
      createTraceRows(characterIdByName.get(record.name), record),
    );
    if (traceRows.length > 0) {
      await tx.characterTraceStat.createMany({ data: traceRows });
    }

    const userCharacters = await tx.userCharacter.findMany();
    for (const userCharacter of userCharacters) {
      const characterRecord = importedRecordByCharacterId.get(
        userCharacter.characterId,
      );

      if (!characterRecord) {
        continue;
      }

      const baseStats = buildDefaultFinalStats(characterRecord);
      const storedStats = normalizeStatsMap(parseJsonObject(userCharacter.stats));
      const existingSources = parseJsonObject(userCharacter.statSources);
      const overrideStats =
        Object.keys(storedStats).length > 0
          ? storedStats
          : buildLegacyOverrideStats(userCharacter);
      const overrideSource =
        Object.keys(storedStats).length > 0 ? existingSources : {};
      const mergedStats = normalizeStatsMap({
        ...baseStats,
        ...overrideStats,
      });
      const statSources = {
        ...buildCatalogSourceMap(baseStats),
        ...(Object.keys(storedStats).length > 0
          ? overrideSource
          : Object.fromEntries(
              Object.keys(overrideStats).map((key) => [key, 'legacy_migrated']),
            )),
      };

      await tx.userCharacter.update({
        where: { id: userCharacter.id },
        data: toUserCharacterPersistence(mergedStats, statSources),
      });
    }

    for (const lightCone of lightCones) {
      await tx.lightCone.upsert({
        where: { name: lightCone.name },
        create: {
          ...lightCone,
          slug: slugify(lightCone.name),
          status: 'PUBLISHED',
        },
        update: {
          slug: slugify(lightCone.name),
          path: lightCone.path,
          rarity: lightCone.rarity,
          effectDescription: lightCone.effectDescription,
          status: 'PUBLISHED',
        },
      });
    }

    const resolutionLookup = new Map();
    for (const record of importedCharacters) {
      const characterId = characterIdByName.get(record.name);
      resolutionLookup.set(normalizeText(record.name), characterId);
      for (const alias of record.aliases) {
        resolutionLookup.set(normalizeText(alias), characterId);
      }
    }

    for (const rule of synergyRules) {
      const sourceId = resolutionLookup.get(normalizeText(rule.source));
      const targetId = resolutionLookup.get(normalizeText(rule.target));

      if (!sourceId || !targetId) {
        continue;
      }

      await tx.characterSynergy.create({
        data: {
          sourceCharacterId: sourceId,
          targetCharacterId: targetId,
          weight: rule.weight,
          note: rule.note,
        },
      });
    }

    return {
      characterCount: importedCharacters.length,
      tagCount: tagCatalog.length,
      aliasCount: aliasRows.length,
      traceCount: traceRows.length,
      staleCharacterCount: staleCharacters.length,
      lightConeCount: lightCones.length,
      synergyCount: synergyRules.length,
    };
  });
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@omnigacha.dev';
  const adminPassword =
    process.env.SEED_ADMIN_PASSWORD ?? 'AdminOmniGacha_1234!';
  const adminName = process.env.SEED_ADMIN_NAME ?? 'OmniGacha Admin';

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      passwordHash: hashSync(adminPassword, 12),
      role: 'ADMIN',
      isActive: true,
      mustChangePassword: false,
    },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash: hashSync(adminPassword, 12),
      role: 'ADMIN',
      isActive: true,
      mustChangePassword: false,
    },
  });

  const result = await seedCharacterCatalog();
  console.log(
    `Seed completado: ${result.characterCount} personajes, ${result.tagCount} tags, ` +
      `${result.aliasCount} aliases, ${result.traceCount} trace stats, ` +
      `${result.lightConeCount} light cones y ${result.synergyCount} reglas de sinergia.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
