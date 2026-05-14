-- CreateTable
CREATE TABLE "public"."LightCone" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "rarity" INTEGER NOT NULL,
    "effectDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LightCone_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "public"."UserCharacter" ADD COLUMN "lightConeId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "LightCone_name_key" ON "public"."LightCone"("name");

-- CreateIndex
CREATE INDEX "LightCone_path_idx" ON "public"."LightCone"("path");

-- CreateIndex
CREATE INDEX "UserCharacter_lightConeId_idx" ON "public"."UserCharacter"("lightConeId");

-- AddForeignKey
ALTER TABLE "public"."UserCharacter" ADD CONSTRAINT "UserCharacter_lightConeId_fkey" FOREIGN KEY ("lightConeId") REFERENCES "public"."LightCone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
