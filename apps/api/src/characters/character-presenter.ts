import { Prisma } from '@prisma/client';
import {
  buildCharacterDefaultStats,
  buildCharacterStatProfile,
  buildTagBuckets,
} from './character-catalog';

export const characterCatalogInclude = {
  aliases: {
    select: {
      alias: true,
      normalizedAlias: true,
      locale: true,
      source: true,
    },
    orderBy: { alias: 'asc' },
  },
  traceStats: {
    orderBy: { statKey: 'asc' },
  },
  splashArtAsset: {
    select: {
      id: true,
      publicUrl: true,
      storageKey: true,
      kind: true,
    },
  },
  tags: {
    include: {
      tag: {
        select: {
          key: true,
          displayLabel: true,
          category: true,
        },
      },
    },
    orderBy: { tagKey: 'asc' },
  },
} satisfies Prisma.CharacterInclude;

export type CharacterCatalogRow = Prisma.CharacterGetPayload<{
  include: typeof characterCatalogInclude;
}>;

export function mapCharacterCatalogRow(character: CharacterCatalogRow) {
  const tags = character.tags.map((row) => row.tag);
  const tagBuckets = buildTagBuckets(tags);
  const statProfile = buildCharacterStatProfile(tagBuckets);
  const defaultStats = buildCharacterDefaultStats({
    baseHp: character.baseHp,
    baseAtk: character.baseAtk,
    baseDef: character.baseDef,
    baseSpeed: character.baseSpeed,
    baseCritRate: character.baseCritRate,
    baseCritDamage: character.baseCritDamage,
    traceStats: character.traceStats,
  });

  return {
    id: character.id,
    name: character.name,
    slug: character.slug,
    element: character.element,
    path: character.path,
    role: character.role,
    rarity: character.rarity,
    gameVersion: character.gameVersion,
    status: character.status,
    baseHp: character.baseHp,
    baseAtk: character.baseAtk,
    baseDef: character.baseDef,
    baseCritRate: character.baseCritRate,
    baseCritDamage: character.baseCritDamage,
    baseSpeed: character.baseSpeed,
    splashArtAssetId: character.splashArtAssetId,
    splashArtUrl: character.splashArtAsset?.publicUrl ?? null,
    aliases: character.aliases,
    tags,
    tagBuckets,
    traceStats: character.traceStats,
    statProfile,
    defaultStats,
  };
}
