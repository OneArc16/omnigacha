-- CreateEnum
CREATE TYPE "public"."TagCategory" AS ENUM ('PRO', 'CON', 'ARCHETYPE', 'ROLE', 'CHARACTERISTIC', 'SPECIAL');

-- CreateEnum
CREATE TYPE "public"."StatKey" AS ENUM (
    'HP',
    'ATK',
    'DEF',
    'SPEED',
    'CRIT_RATE',
    'CRIT_DAMAGE',
    'BREAK_EFFECT',
    'ENERGY_REGEN_RATE',
    'EFFECT_HIT_RATE',
    'EFFECT_RES',
    'ELEMENTAL_DMG_BONUS'
);

-- CreateEnum
CREATE TYPE "public"."TraceStatKey" AS ENUM (
    'HP_PERCENT',
    'ATK_PERCENT',
    'DEF_PERCENT',
    'SPEED_FLAT',
    'CRIT_RATE',
    'CRIT_DAMAGE',
    'BREAK_EFFECT',
    'ENERGY_REGEN_RATE',
    'EFFECT_HIT_RATE',
    'EFFECT_RES',
    'ELEMENTAL_DMG_BONUS'
);

-- AlterTable
ALTER TABLE "public"."Character"
ADD COLUMN "baseDef" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "baseHp" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "gameVersion" TEXT NOT NULL DEFAULT '3.8',
ADD COLUMN "rarity" INTEGER NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "public"."UserCharacter"
ADD COLUMN "breakEffect" DOUBLE PRECISION,
ADD COLUMN "def" INTEGER,
ADD COLUMN "effectHitRate" DOUBLE PRECISION,
ADD COLUMN "effectRes" DOUBLE PRECISION,
ADD COLUMN "elementalDmgBonus" DOUBLE PRECISION,
ADD COLUMN "energyRegenRate" DOUBLE PRECISION,
ADD COLUMN "hp" INTEGER,
ADD COLUMN "statSources" JSONB,
ADD COLUMN "stats" JSONB;

-- CreateTable
CREATE TABLE "public"."CharacterAlias" (
    "id" SERIAL NOT NULL,
    "characterId" INTEGER NOT NULL,
    "alias" TEXT NOT NULL,
    "normalizedAlias" TEXT NOT NULL,
    "locale" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TagDefinition" (
    "key" TEXT NOT NULL,
    "displayLabel" TEXT NOT NULL,
    "category" "public"."TagCategory" NOT NULL,
    "internalDescription" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TagDefinition_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "public"."CharacterTag" (
    "characterId" INTEGER NOT NULL,
    "tagKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CharacterTag_pkey" PRIMARY KEY ("characterId","tagKey")
);

-- CreateTable
CREATE TABLE "public"."CharacterTraceStat" (
    "id" SERIAL NOT NULL,
    "characterId" INTEGER NOT NULL,
    "statKey" "public"."TraceStatKey" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterTraceStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CharacterAlias_normalizedAlias_key" ON "public"."CharacterAlias"("normalizedAlias");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterAlias_characterId_alias_key" ON "public"."CharacterAlias"("characterId", "alias");

-- CreateIndex
CREATE INDEX "CharacterAlias_characterId_idx" ON "public"."CharacterAlias"("characterId");

-- CreateIndex
CREATE INDEX "TagDefinition_category_idx" ON "public"."TagDefinition"("category");

-- CreateIndex
CREATE INDEX "CharacterTag_tagKey_idx" ON "public"."CharacterTag"("tagKey");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterTraceStat_characterId_statKey_key" ON "public"."CharacterTraceStat"("characterId", "statKey");

-- CreateIndex
CREATE INDEX "CharacterTraceStat_statKey_idx" ON "public"."CharacterTraceStat"("statKey");

-- AddForeignKey
ALTER TABLE "public"."CharacterAlias" ADD CONSTRAINT "CharacterAlias_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "public"."Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CharacterTag" ADD CONSTRAINT "CharacterTag_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "public"."Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CharacterTag" ADD CONSTRAINT "CharacterTag_tagKey_fkey" FOREIGN KEY ("tagKey") REFERENCES "public"."TagDefinition"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CharacterTraceStat" ADD CONSTRAINT "CharacterTraceStat_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "public"."Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
