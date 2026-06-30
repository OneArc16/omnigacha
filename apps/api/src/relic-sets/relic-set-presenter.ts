import { Prisma } from '@prisma/client';

export const relicSetCatalogInclude = {
  splashArtAsset: {
    select: {
      id: true,
      publicUrl: true,
      storageKey: true,
      kind: true,
    },
  },
} satisfies Prisma.RelicSetInclude;

export type RelicSetCatalogRow = Prisma.RelicSetGetPayload<{
  include: typeof relicSetCatalogInclude;
}>;

export function mapRelicSetCatalogRow(relicSet: RelicSetCatalogRow) {
  return {
    id: relicSet.id,
    name: relicSet.name,
    slug: relicSet.slug,
    type: relicSet.type,
    rarity: relicSet.rarity,
    twoPieceBonus: relicSet.twoPieceBonus,
    fourPieceBonus: relicSet.fourPieceBonus,
    gameVersion: relicSet.gameVersion,
    status: relicSet.status,
    splashArtAssetId: relicSet.splashArtAssetId,
    splashArtUrl: relicSet.splashArtAsset?.publicUrl ?? null,
    createdAt: relicSet.createdAt,
    updatedAt: relicSet.updatedAt,
  };
}
