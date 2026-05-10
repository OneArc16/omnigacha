-- CreateEnum
CREATE TYPE "public"."RecommendationLevel" AS ENUM ('NO_RECOMENDADO', 'SITUACIONAL', 'RECOMENDADO', 'MUY_RECOMENDADO');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Character" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "element" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "baseAtk" INTEGER NOT NULL,
    "baseCritRate" DOUBLE PRECISION NOT NULL,
    "baseCritDamage" DOUBLE PRECISION NOT NULL,
    "baseSpeed" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserCharacter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "eidolon" INTEGER NOT NULL,
    "lightConeName" TEXT,
    "lightConeLevel" INTEGER,
    "atk" INTEGER NOT NULL,
    "critRate" DOUBLE PRECISION NOT NULL,
    "critDamage" DOUBLE PRECISION NOT NULL,
    "speed" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCharacter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Recommendation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetCharacter" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "level" "public"."RecommendationLevel" NOT NULL,
    "explanation" TEXT NOT NULL,
    "estimatedDeltaDmg" DOUBLE PRECISION NOT NULL,
    "compatibleTeams" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Simulation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Simulation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Character_name_key" ON "public"."Character"("name");

-- CreateIndex
CREATE INDEX "UserCharacter_userId_idx" ON "public"."UserCharacter"("userId");

-- CreateIndex
CREATE INDEX "UserCharacter_characterId_idx" ON "public"."UserCharacter"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCharacter_userId_characterId_key" ON "public"."UserCharacter"("userId", "characterId");

-- CreateIndex
CREATE INDEX "Recommendation_userId_idx" ON "public"."Recommendation"("userId");

-- CreateIndex
CREATE INDEX "Recommendation_targetCharacter_idx" ON "public"."Recommendation"("targetCharacter");

-- CreateIndex
CREATE INDEX "Simulation_userId_idx" ON "public"."Simulation"("userId");

-- AddForeignKey
ALTER TABLE "public"."UserCharacter" ADD CONSTRAINT "UserCharacter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserCharacter" ADD CONSTRAINT "UserCharacter_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "public"."Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Recommendation" ADD CONSTRAINT "Recommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Simulation" ADD CONSTRAINT "Simulation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
