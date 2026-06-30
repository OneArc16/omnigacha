import { Prisma } from '@prisma/client';

export const lightConeCatalogInclude = {
  splashArtAsset: {
    select: {
      id: true,
      publicUrl: true,
      storageKey: true,
      kind: true,
    },
  },
} satisfies Prisma.LightConeInclude;

export type LightConeCatalogRow = Prisma.LightConeGetPayload<{
  include: typeof lightConeCatalogInclude;
}>;

export function mapLightConeCatalogRow(lightCone: LightConeCatalogRow) {
  return {
    id: lightCone.id,
    name: lightCone.name,
    slug: lightCone.slug,
    path: lightCone.path,
    rarity: lightCone.rarity,
    effectDescription: lightCone.effectDescription,
    status: lightCone.status,
    splashArtAssetId: lightCone.splashArtAssetId,
    splashArtUrl: lightCone.splashArtAsset?.publicUrl ?? null,
    createdAt: lightCone.createdAt,
    updatedAt: lightCone.updatedAt,
  };
}
