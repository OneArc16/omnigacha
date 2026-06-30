-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."CatalogStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."RelicSetType" AS ENUM ('ARTIFACT', 'ORNAMENT');

-- CreateEnum
CREATE TYPE "public"."MediaKind" AS ENUM ('SPLASH_ART');

-- CreateEnum
CREATE TYPE "public"."StorageDriver" AS ENUM ('LOCAL', 'S3');

-- AlterTable
ALTER TABLE "public"."User"
ADD COLUMN     "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Character"
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "status" "public"."CatalogStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN     "splashArtAssetId" INTEGER;

-- AlterTable
ALTER TABLE "public"."LightCone"
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "status" "public"."CatalogStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN     "splashArtAssetId" INTEGER;

-- CreateTable
CREATE TABLE "public"."MediaAsset" (
    "id" SERIAL NOT NULL,
    "kind" "public"."MediaKind" NOT NULL,
    "storageDriver" "public"."StorageDriver" NOT NULL DEFAULT 'LOCAL',
    "storageKey" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "checksum" TEXT,
    "createdByUserId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RelicSet" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "public"."RelicSetType" NOT NULL,
    "rarity" INTEGER NOT NULL,
    "twoPieceBonus" TEXT NOT NULL,
    "fourPieceBonus" TEXT,
    "gameVersion" TEXT,
    "status" "public"."CatalogStatus" NOT NULL DEFAULT 'DRAFT',
    "splashArtAssetId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RelicSet_pkey" PRIMARY KEY ("id")
);

-- Backfill slug values for existing catalog rows.
WITH "CharacterSlugged" AS (
    SELECT
        c."id",
        NULLIF(
            REGEXP_REPLACE(
                REGEXP_REPLACE(LOWER(c."name"), '[^a-z0-9]+', '-', 'g'),
                '(^-|-$)',
                '',
                'g'
            ),
            ''
        ) AS "baseSlug",
        ROW_NUMBER() OVER (
            PARTITION BY NULLIF(
                REGEXP_REPLACE(
                    REGEXP_REPLACE(LOWER(c."name"), '[^a-z0-9]+', '-', 'g'),
                    '(^-|-$)',
                    '',
                    'g'
                ),
                ''
            )
            ORDER BY c."id"
        ) AS "rn"
    FROM "public"."Character" c
)
UPDATE "public"."Character" c
SET "slug" = CASE
    WHEN "CharacterSlugged"."baseSlug" IS NULL THEN 'character-' || c."id"
    WHEN "CharacterSlugged"."rn" = 1 THEN "CharacterSlugged"."baseSlug"
    ELSE "CharacterSlugged"."baseSlug" || '-' || c."id"
END
FROM "CharacterSlugged"
WHERE c."id" = "CharacterSlugged"."id";

WITH "LightConeSlugged" AS (
    SELECT
        l."id",
        NULLIF(
            REGEXP_REPLACE(
                REGEXP_REPLACE(LOWER(l."name"), '[^a-z0-9]+', '-', 'g'),
                '(^-|-$)',
                '',
                'g'
            ),
            ''
        ) AS "baseSlug",
        ROW_NUMBER() OVER (
            PARTITION BY NULLIF(
                REGEXP_REPLACE(
                    REGEXP_REPLACE(LOWER(l."name"), '[^a-z0-9]+', '-', 'g'),
                    '(^-|-$)',
                    '',
                    'g'
                ),
                ''
            )
            ORDER BY l."id"
        ) AS "rn"
    FROM "public"."LightCone" l
)
UPDATE "public"."LightCone" l
SET "slug" = CASE
    WHEN "LightConeSlugged"."baseSlug" IS NULL THEN 'light-cone-' || l."id"
    WHEN "LightConeSlugged"."rn" = 1 THEN "LightConeSlugged"."baseSlug"
    ELSE "LightConeSlugged"."baseSlug" || '-' || l."id"
END
FROM "LightConeSlugged"
WHERE l."id" = "LightConeSlugged"."id";

-- Make slug columns required after backfill.
ALTER TABLE "public"."Character"
ALTER COLUMN "slug" SET NOT NULL;

ALTER TABLE "public"."LightCone"
ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Character_slug_key" ON "public"."Character"("slug");

-- CreateIndex
CREATE INDEX "Character_status_idx" ON "public"."Character"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Character_splashArtAssetId_key" ON "public"."Character"("splashArtAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "LightCone_slug_key" ON "public"."LightCone"("slug");

-- CreateIndex
CREATE INDEX "LightCone_status_idx" ON "public"."LightCone"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LightCone_splashArtAssetId_key" ON "public"."LightCone"("splashArtAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_storageKey_key" ON "public"."MediaAsset"("storageKey");

-- CreateIndex
CREATE INDEX "MediaAsset_kind_idx" ON "public"."MediaAsset"("kind");

-- CreateIndex
CREATE INDEX "MediaAsset_createdByUserId_idx" ON "public"."MediaAsset"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "RelicSet_slug_key" ON "public"."RelicSet"("slug");

-- CreateIndex
CREATE INDEX "RelicSet_type_idx" ON "public"."RelicSet"("type");

-- CreateIndex
CREATE INDEX "RelicSet_status_idx" ON "public"."RelicSet"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RelicSet_splashArtAssetId_key" ON "public"."RelicSet"("splashArtAssetId");

-- AddForeignKey
ALTER TABLE "public"."Character" ADD CONSTRAINT "Character_splashArtAssetId_fkey" FOREIGN KEY ("splashArtAssetId") REFERENCES "public"."MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LightCone" ADD CONSTRAINT "LightCone_splashArtAssetId_fkey" FOREIGN KEY ("splashArtAssetId") REFERENCES "public"."MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MediaAsset" ADD CONSTRAINT "MediaAsset_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RelicSet" ADD CONSTRAINT "RelicSet_splashArtAssetId_fkey" FOREIGN KEY ("splashArtAssetId") REFERENCES "public"."MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
