/*
  Warnings:

  - The primary key for the `Character` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Character` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `CharacterSynergy` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `CharacterSynergy` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Recommendation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Recommendation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `RefreshToken` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `RefreshToken` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Simulation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Simulation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `UserCharacter` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `UserCharacter` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `sourceCharacterId` on the `CharacterSynergy` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `targetCharacterId` on the `CharacterSynergy` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `Recommendation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `RefreshToken` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `Simulation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `UserCharacter` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `characterId` on the `UserCharacter` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."CharacterSynergy" DROP CONSTRAINT "CharacterSynergy_sourceCharacterId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CharacterSynergy" DROP CONSTRAINT "CharacterSynergy_targetCharacterId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Recommendation" DROP CONSTRAINT "Recommendation_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Simulation" DROP CONSTRAINT "Simulation_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserCharacter" DROP CONSTRAINT "UserCharacter_characterId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserCharacter" DROP CONSTRAINT "UserCharacter_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Character" DROP CONSTRAINT "Character_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Character_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."CharacterSynergy" DROP CONSTRAINT "CharacterSynergy_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "sourceCharacterId",
ADD COLUMN     "sourceCharacterId" INTEGER NOT NULL,
DROP COLUMN "targetCharacterId",
ADD COLUMN     "targetCharacterId" INTEGER NOT NULL,
ADD CONSTRAINT "CharacterSynergy_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."Recommendation" DROP CONSTRAINT "Recommendation_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL,
ADD CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."RefreshToken" DROP CONSTRAINT "RefreshToken_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL,
ADD CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."Simulation" DROP CONSTRAINT "Simulation_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL,
ADD CONSTRAINT "Simulation_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."UserCharacter" DROP CONSTRAINT "UserCharacter_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL,
DROP COLUMN "characterId",
ADD COLUMN     "characterId" INTEGER NOT NULL,
ADD CONSTRAINT "UserCharacter_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "CharacterSynergy_sourceCharacterId_idx" ON "public"."CharacterSynergy"("sourceCharacterId");

-- CreateIndex
CREATE INDEX "CharacterSynergy_targetCharacterId_idx" ON "public"."CharacterSynergy"("targetCharacterId");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterSynergy_sourceCharacterId_targetCharacterId_key" ON "public"."CharacterSynergy"("sourceCharacterId", "targetCharacterId");

-- CreateIndex
CREATE INDEX "Recommendation_userId_idx" ON "public"."Recommendation"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "public"."RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "Simulation_userId_idx" ON "public"."Simulation"("userId");

-- CreateIndex
CREATE INDEX "UserCharacter_userId_idx" ON "public"."UserCharacter"("userId");

-- CreateIndex
CREATE INDEX "UserCharacter_characterId_idx" ON "public"."UserCharacter"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCharacter_userId_characterId_key" ON "public"."UserCharacter"("userId", "characterId");

-- AddForeignKey
ALTER TABLE "public"."CharacterSynergy" ADD CONSTRAINT "CharacterSynergy_sourceCharacterId_fkey" FOREIGN KEY ("sourceCharacterId") REFERENCES "public"."Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CharacterSynergy" ADD CONSTRAINT "CharacterSynergy_targetCharacterId_fkey" FOREIGN KEY ("targetCharacterId") REFERENCES "public"."Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserCharacter" ADD CONSTRAINT "UserCharacter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserCharacter" ADD CONSTRAINT "UserCharacter_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "public"."Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Recommendation" ADD CONSTRAINT "Recommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Simulation" ADD CONSTRAINT "Simulation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
