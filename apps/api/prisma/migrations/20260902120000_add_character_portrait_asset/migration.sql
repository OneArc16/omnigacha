-- AlterEnum
ALTER TYPE "public"."MediaKind" ADD VALUE 'CHARACTER_PORTRAIT';

-- AlterTable
ALTER TABLE "public"."Character" ADD COLUMN     "portraitAssetId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Character_portraitAssetId_key" ON "public"."Character"("portraitAssetId");

-- AddForeignKey
ALTER TABLE "public"."Character" ADD CONSTRAINT "Character_portraitAssetId_fkey" FOREIGN KEY ("portraitAssetId") REFERENCES "public"."MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
