import { Injectable, NotFoundException } from '@nestjs/common';
import { RecommendationLevel } from '@prisma/client';
import {
  buildBalancedTeam,
  compareTeamDamage,
  countCompatibleTeams,
} from '../analysis/damage-calculator';
import type { AnalysisCharacter } from '../analysis/types';
import { paginateByCursor } from '../common/cursor-pagination';
import { CursorPaginationQueryDto } from '../common/dto/cursor-pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RecommendCharacterDto } from './dto/recommend-character.dto';

@Injectable()
export class SimulationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listRecommendations(userId: number, query: CursorPaginationQueryDto) {
    const limit = query.limit ?? 5;
    const rows = await this.prisma.recommendation.findMany({
      where: {
        userId,
        ...(query.cursor ? { id: { lt: query.cursor } } : {}),
      },
      orderBy: { id: 'desc' },
      take: limit + 1,
    });

    return paginateByCursor(rows, limit);
  }

  async listHistory(userId: number, query: CursorPaginationQueryDto) {
    const limit = query.limit ?? 5;
    const rows = await this.prisma.simulation.findMany({
      where: {
        userId,
        ...(query.cursor ? { id: { lt: query.cursor } } : {}),
      },
      orderBy: { id: 'desc' },
      take: limit + 1,
    });

    return paginateByCursor(rows, limit);
  }

  async recommend(userId: number, dto: RecommendCharacterDto) {
    const [targetCharacter, ownedEntries] = await Promise.all([
      this.prisma.character.findUnique({ where: { id: dto.targetCharacterId } }),
      this.prisma.userCharacter.findMany({
        where: { userId },
        include: { character: true },
      }),
    ]);

    if (!targetCharacter) {
      throw new NotFoundException('Target character not found');
    }

    const ownedCharacterIds = new Set(
      ownedEntries.map((entry) => entry.characterId),
    );
    const alreadyOwned = ownedCharacterIds.has(targetCharacter.id);

    const ownedRoster = ownedEntries.map((entry) =>
      this.mapOwnedEntryToAnalysisCharacter(entry),
    );
    const targetAsAnalysisCharacter = this.mapTargetToAnalysisCharacter(
      targetCharacter,
    );

    const proposedRoster = alreadyOwned
      ? ownedRoster
      : [...ownedRoster, targetAsAnalysisCharacter];

    const allCandidateIds = [...new Set(proposedRoster.map((member) => member.id))];

    const synergyRows = await this.prisma.characterSynergy.findMany({
      where: {
        sourceCharacterId: { in: allCandidateIds },
        targetCharacterId: { in: allCandidateIds },
      },
      include: {
        sourceCharacter: { select: { name: true } },
        targetCharacter: { select: { name: true } },
      },
    });

    const synergyScore =
      synergyRows.length === 0
        ? 0
        : Math.round(
            synergyRows.reduce((acc, row) => acc + row.weight, 0) /
              synergyRows.length,
          );

    const sameRoleCount = ownedEntries.filter(
      (entry) => entry.character.role === targetCharacter.role,
    ).length;

    const currentTeam = buildBalancedTeam(ownedRoster, undefined, synergyRows);
    const proposedTeam = buildBalancedTeam(
      proposedRoster,
      targetCharacter.id,
      synergyRows,
    );
    const damageComparison = compareTeamDamage(currentTeam, proposedTeam, synergyRows);

    const roleNeedBonus = sameRoleCount === 0 ? 12 : 0;
    const ownershipPenalty = alreadyOwned ? 25 : 0;
    const boundedDamageDelta = this.clamp(damageComparison.deltaPercent, -40, 80);
    const damageImpact = boundedDamageDelta * 0.58;
    const synergyImpact = synergyScore * 0.28;
    const profileCompositionImpact =
      (damageComparison.proposedTeam.profileCoverageBonus -
        damageComparison.currentTeam.profileCoverageBonus) *
      100 *
      0.35;
    const baseScore = 25;

    const score = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          baseScore +
            synergyImpact +
            damageImpact +
            roleNeedBonus +
            profileCompositionImpact -
            ownershipPenalty,
        ),
      ),
    );

    const level = this.toLevel(score);

    const topSynergies = synergyRows
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map(
        (row) =>
          `${row.sourceCharacter.name} ↔ ${row.targetCharacter.name} (${row.weight})`,
      );

    const explanation = this.buildExplanation({
      targetName: targetCharacter.name,
      score,
      sameRoleCount,
      alreadyOwned,
      topSynergies,
      currentTeamDamage: damageComparison.currentTeam.totalDamage,
      proposedTeamDamage: damageComparison.proposedTeam.totalDamage,
      deltaPercent: damageComparison.deltaPercent,
      currentProfileCoverage: damageComparison.currentTeam.profileCoverageBonus,
      proposedProfileCoverage: damageComparison.proposedTeam.profileCoverageBonus,
    });

    const estimatedDeltaDmg = Number(damageComparison.deltaPercent.toFixed(2));
    const compatibleTeams = countCompatibleTeams(proposedRoster, targetCharacter.id);
    const scoringBreakdown = {
      baseScore,
      synergyImpact: Number(synergyImpact.toFixed(2)),
      damageImpact: Number(damageImpact.toFixed(2)),
      roleNeedBonus,
      profileCompositionImpact: Number(profileCompositionImpact.toFixed(2)),
      ownershipPenalty,
    };

    const recommendation = await this.prisma.recommendation.create({
      data: {
        userId,
        targetCharacter: targetCharacter.name,
        score,
        level,
        explanation,
        estimatedDeltaDmg,
        compatibleTeams,
      },
    });

    await this.prisma.simulation.create({
      data: {
        userId,
        label: `recommend-${targetCharacter.name}`,
        payload: {
          targetCharacterId: targetCharacter.id,
          synergyCount: synergyRows.length,
          synergyScore,
          sameRoleCount,
          alreadyOwned,
          currentTeamDamage: Number(
            damageComparison.currentTeam.totalDamage.toFixed(2),
          ),
          proposedTeamDamage: Number(
            damageComparison.proposedTeam.totalDamage.toFixed(2),
          ),
          deltaPercent: damageComparison.deltaPercent,
          scoringBreakdown,
          score,
          level,
        },
      },
    });

    return {
      recommendation,
      context: {
        targetCharacter,
        ownedCount: ownedEntries.length,
        topSynergies,
        damageComparison,
        scoringBreakdown,
      },
    };
  }

  private toLevel(score: number): RecommendationLevel {
    if (score < 40) return RecommendationLevel.NO_RECOMENDADO;
    if (score < 60) return RecommendationLevel.SITUACIONAL;
    if (score < 80) return RecommendationLevel.RECOMENDADO;
    return RecommendationLevel.MUY_RECOMENDADO;
  }

  private buildExplanation(input: {
    targetName: string;
    score: number;
    sameRoleCount: number;
    alreadyOwned: boolean;
    topSynergies: string[];
    currentTeamDamage: number;
    proposedTeamDamage: number;
    deltaPercent: number;
    currentProfileCoverage: number;
    proposedProfileCoverage: number;
  }) {
    const roleLine =
      input.sameRoleCount === 0
        ? 'Tu cuenta necesita mas cobertura de este rol.'
        : `Ya tienes ${input.sameRoleCount} personaje(s) del mismo rol, por eso el bonus de rol es menor.`;

    const ownershipLine = input.alreadyOwned
      ? 'Ya lo tienes en la cuenta, asi que la conveniencia para pull baja.'
      : 'No lo tienes aun, por lo que la adquisicion puede abrir nuevas opciones.';

    const synergyLine =
      input.topSynergies.length > 0
        ? `Sinergias detectadas: ${input.topSynergies.join('; ')}.`
        : 'No se detectaron sinergias directas fuertes con tu roster actual.';

    const damageLine = `Dano estimado: actual ${input.currentTeamDamage.toFixed(2)} vs propuesto ${input.proposedTeamDamage.toFixed(2)} (delta ${input.deltaPercent.toFixed(2)}%).`;
    const profileLine = `Cobertura de perfiles: ${input.currentProfileCoverage.toFixed(2)} -> ${input.proposedProfileCoverage.toFixed(2)}.`;

    return `${input.targetName} obtiene un score de ${input.score}/100. ${damageLine} ${profileLine} ${roleLine} ${ownershipLine} ${synergyLine}`;
  }

  private mapOwnedEntryToAnalysisCharacter(entry: {
    characterId: number;
    atk: number;
    critRate: number;
    critDamage: number;
    speed: number;
    character: { name: string; path: string; role: string };
  }): AnalysisCharacter {
    return {
      id: entry.characterId,
      name: entry.character.name,
      path: entry.character.path,
      roleText: entry.character.role,
      atk: entry.atk,
      critRate: entry.critRate,
      critDamage: entry.critDamage,
      speed: entry.speed,
    };
  }

  private mapTargetToAnalysisCharacter(targetCharacter: {
    id: number;
    name: string;
    path: string;
    role: string;
    baseAtk: number;
    baseCritRate: number;
    baseCritDamage: number;
    baseSpeed: number;
  }): AnalysisCharacter {
    return {
      id: targetCharacter.id,
      name: targetCharacter.name,
      path: targetCharacter.path,
      roleText: targetCharacter.role,
      atk: targetCharacter.baseAtk,
      critRate: targetCharacter.baseCritRate,
      critDamage: targetCharacter.baseCritDamage,
      speed: targetCharacter.baseSpeed,
    };
  }

  private clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
  }
}
