import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RecommendationLevel } from '@prisma/client';
import {
  buildBalancedTeam,
  buildTeamWithLockedMembers,
  compareTeamDamage,
  countCompatibleTeams,
} from '../analysis/damage-calculator';
import {
  buildFallbackPathConeModifiers,
  resolveEquippedLightConeModifiers,
} from '../analysis/light-cone-effects';
import type { AnalysisCharacter } from '../analysis/types';
import { paginateByCursor } from '../common/cursor-pagination';
import { CursorPaginationQueryDto } from '../common/dto/cursor-pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  RecommendCharacterDto,
  RecommendTargetStatsDto,
} from './dto/recommend-character.dto';
import { SimulateDamageDto } from './dto/simulate-damage.dto';

type OwnedRosterEntry = {
  characterId: number;
  lightConeLevel: number | null;
  lightConeName: string | null;
  atk: number;
  critRate: number;
  critDamage: number;
  speed: number;
  lightCone: {
    id: number;
    name: string;
    path: string;
    rarity: number;
    effectDescription: string | null;
  } | null;
  character: { name: string; path: string; role: string };
};

type NamedSynergyRow = {
  sourceCharacterId: number;
  targetCharacterId: number;
  weight: number;
  sourceCharacter: { name: string };
  targetCharacter: { name: string };
};

type RecommendationTargetStatsContext = {
  atk: number;
  critRate: number;
  critDamage: number;
  speed: number;
  source: 'manual' | 'roster' | 'catalog_base';
};

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

  async findRecommendationById(userId: number, recommendationId: number) {
    const row = await this.prisma.recommendation.findFirst({
      where: {
        id: recommendationId,
        userId,
      },
    });

    if (!row) {
      throw new NotFoundException('Recommendation not found');
    }

    return row;
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

  async findHistoryById(userId: number, simulationId: number) {
    const row = await this.prisma.simulation.findFirst({
      where: {
        id: simulationId,
        userId,
      },
    });

    if (!row) {
      throw new NotFoundException('Simulation not found');
    }

    return row;
  }

  async recommend(userId: number, dto: RecommendCharacterDto) {
    const [targetCharacter, ownedEntries] = await Promise.all([
      this.prisma.character.findUnique({
        where: { id: dto.targetCharacterId },
      }),
      this.prisma.userCharacter.findMany({
        where: { userId },
        include: { character: true, lightCone: true },
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
    const normalizedTargetStats = this.normalizeRecommendationTargetStats(
      dto.targetStats,
    );
    const targetAsAnalysisCharacter = this.mapTargetToAnalysisCharacter(
      targetCharacter,
      normalizedTargetStats,
    );
    const ownedTargetCharacter =
      ownedRoster.find((member) => member.id === targetCharacter.id) ?? null;
    const baseProposedTargetCharacter =
      ownedTargetCharacter ?? targetAsAnalysisCharacter;
    const proposedTargetCharacter = normalizedTargetStats
      ? {
          ...baseProposedTargetCharacter,
          ...normalizedTargetStats,
        }
      : baseProposedTargetCharacter;
    const appliedTargetStats: RecommendationTargetStatsContext = {
      atk: proposedTargetCharacter.atk,
      critRate: proposedTargetCharacter.critRate,
      critDamage: proposedTargetCharacter.critDamage,
      speed: proposedTargetCharacter.speed,
      source: normalizedTargetStats
        ? 'manual'
        : ownedTargetCharacter
          ? 'roster'
          : 'catalog_base',
    };

    const proposedRoster = alreadyOwned
      ? ownedRoster.some((member) => member.id === targetCharacter.id)
        ? ownedRoster.map((member) =>
            member.id === targetCharacter.id ? proposedTargetCharacter : member,
          )
        : [...ownedRoster, proposedTargetCharacter]
      : [...ownedRoster, proposedTargetCharacter];

    const allCandidateIds = [
      ...new Set(proposedRoster.map((member) => member.id)),
    ];

    const synergyRows: NamedSynergyRow[] =
      await this.prisma.characterSynergy.findMany({
        where: {
          sourceCharacterId: { in: allCandidateIds },
          targetCharacterId: { in: allCandidateIds },
        },
        include: {
          sourceCharacter: { select: { name: true } },
          targetCharacter: { select: { name: true } },
        },
      });

    const sameRoleCount = ownedEntries.filter(
      (entry) => entry.character.role === targetCharacter.role,
    ).length;

    const currentTeam = buildBalancedTeam(ownedRoster, undefined, synergyRows);
    const proposedTeam = buildBalancedTeam(
      proposedRoster,
      targetCharacter.id,
      synergyRows,
    );
    const damageComparison = compareTeamDamage(
      currentTeam,
      proposedTeam,
      synergyRows,
    );
    const proposedTeamIds = proposedTeam.map((member) => member.id);
    const targetSynergyRows = this.collectTargetTeamSynergies(
      synergyRows,
      targetCharacter.id,
      proposedTeamIds,
    );
    const targetSynergyPairs = this.toUniqueSynergyPairs(targetSynergyRows);

    const synergyScore =
      targetSynergyPairs.length === 0
        ? 0
        : Math.round(
            targetSynergyPairs.reduce((acc, row) => acc + row.weight, 0) /
              targetSynergyPairs.length,
          );

    const roleNeedBonus = sameRoleCount === 0 ? 12 : 0;
    const ownershipPenalty = alreadyOwned ? 25 : 0;
    const boundedDamageDelta = this.clamp(
      damageComparison.deltaPercent,
      -40,
      80,
    );
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

    const topSynergies = this.toTopSynergyLabels(targetSynergyPairs);

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
      proposedProfileCoverage:
        damageComparison.proposedTeam.profileCoverageBonus,
    });

    const estimatedDeltaDmg = Number(damageComparison.deltaPercent.toFixed(2));
    const compatibleTeams = countCompatibleTeams(
      proposedRoster,
      targetCharacter.id,
    );
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
          type: 'recommendation',
          targetCharacterId: targetCharacter.id,
          targetStats: appliedTargetStats,
          synergyCount: targetSynergyPairs.length,
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
        appliedTargetStats,
        topSynergies,
        damageComparison,
        scoringBreakdown,
      },
    };
  }

  async simulateDamage(userId: number, dto: SimulateDamageDto) {
    const ownedEntries = (await this.prisma.userCharacter.findMany({
      where: { userId },
      include: { character: true, lightCone: true },
    })) as OwnedRosterEntry[];

    if (ownedEntries.length === 0) {
      throw new BadRequestException(
        'Debes registrar personajes antes de simular escenarios.',
      );
    }

    const targetEntry = ownedEntries.find(
      (entry) => entry.characterId === dto.characterId,
    );

    if (!targetEntry) {
      throw new NotFoundException(
        'El personaje a simular no existe en tu roster.',
      );
    }

    const fullRoster = ownedEntries.map((entry) =>
      this.mapOwnedEntryToAnalysisCharacter(entry),
    );
    const customTeamEntries = this.resolveCustomTeamEntries(
      ownedEntries,
      targetEntry.characterId,
      dto.teammateCharacterIds,
    );

    const baseCharacter = this.mapOwnedEntryToAnalysisCharacter(targetEntry);
    const simulatedCharacter = this.applyStatAdjustments(baseCharacter, dto);

    const rosterIds = [...new Set(fullRoster.map((member) => member.id))];
    const synergyRows = await this.prisma.characterSynergy.findMany({
      where: {
        sourceCharacterId: { in: rosterIds },
        targetCharacterId: { in: rosterIds },
      },
    });

    const baseTeam = customTeamEntries
      ? buildTeamWithLockedMembers(
          fullRoster,
          customTeamEntries.map((entry) => entry.characterId),
          targetEntry.characterId,
          synergyRows,
        )
      : buildBalancedTeam(fullRoster, undefined, synergyRows);
    const simulatedTeam = baseTeam.map((member) =>
      member.id === dto.characterId ? simulatedCharacter : member,
    );

    const damageComparison = compareTeamDamage(
      baseTeam,
      simulatedTeam,
      synergyRows,
    );

    const teamContext = customTeamEntries
      ? {
          mode: 'custom',
          members: baseTeam.map((member) => ({
            id: member.id,
            name: member.name,
            isTarget: member.id === targetEntry.characterId,
          })),
        }
      : {
          mode: 'auto',
          members: baseTeam.map((member) => ({
            id: member.id,
            name: member.name,
            isTarget: member.id === targetEntry.characterId,
          })),
        };

    const payload = {
      type: 'damage_scenario',
      characterId: targetEntry.characterId,
      characterName: targetEntry.character.name,
      teamContext,
      adjustments: this.normalizeAdjustments(dto),
      baseStats: {
        atk: baseCharacter.atk,
        critRate: baseCharacter.critRate,
        critDamage: baseCharacter.critDamage,
        speed: baseCharacter.speed,
      },
      simulatedStats: {
        atk: simulatedCharacter.atk,
        critRate: simulatedCharacter.critRate,
        critDamage: simulatedCharacter.critDamage,
        speed: simulatedCharacter.speed,
      },
      baseTeamDamage: Number(
        damageComparison.currentTeam.totalDamage.toFixed(2),
      ),
      simulatedTeamDamage: Number(
        damageComparison.proposedTeam.totalDamage.toFixed(2),
      ),
      deltaAbsolute: damageComparison.deltaAbsolute,
      deltaPercent: damageComparison.deltaPercent,
    };

    await this.prisma.simulation.create({
      data: {
        userId,
        label: `damage-sim-${targetEntry.character.name}`,
        payload,
      },
    });

    return {
      character: {
        id: targetEntry.characterId,
        name: targetEntry.character.name,
      },
      ...payload,
      damageComparison,
      summary:
        `Escenario ${targetEntry.character.name}: ${payload.baseTeamDamage.toFixed(2)} -> ` +
        `${payload.simulatedTeamDamage.toFixed(2)} (${payload.deltaPercent.toFixed(2)}%). ` +
        `Equipo ${teamContext.mode === 'custom' ? 'personalizado' : 'automatico'} aplicado ` +
        `(${teamContext.members.map((member) => member.name).join(', ')}).` +
        (customTeamEntries && customTeamEntries.length < 4
          ? ' Se autocompleto con prioridad de sinergia hasta 4 miembros.'
          : ''),
    };
  }

  private toLevel(score: number): RecommendationLevel {
    if (score < 40) return RecommendationLevel.NO_RECOMENDADO;
    if (score < 60) return RecommendationLevel.SITUACIONAL;
    if (score < 80) return RecommendationLevel.RECOMENDADO;
    return RecommendationLevel.MUY_RECOMENDADO;
  }

  private collectTargetTeamSynergies(
    synergyRows: NamedSynergyRow[],
    targetCharacterId: number,
    teamMemberIds: number[],
  ): NamedSynergyRow[] {
    const teamIds = new Set(teamMemberIds);

    return synergyRows.filter((row) => {
      if (
        !teamIds.has(row.sourceCharacterId) ||
        !teamIds.has(row.targetCharacterId)
      ) {
        return false;
      }

      return (
        row.sourceCharacterId === targetCharacterId ||
        row.targetCharacterId === targetCharacterId
      );
    });
  }

  private toTopSynergyLabels(
    synergyRows: NamedSynergyRow[],
    limit = 3,
  ): string[] {
    return this.toUniqueSynergyPairs(synergyRows)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit)
      .map(
        (row) =>
          `${row.sourceCharacter.name} ↔ ${row.targetCharacter.name} (${row.weight})`,
      );
  }

  private toUniqueSynergyPairs(
    synergyRows: NamedSynergyRow[],
  ): NamedSynergyRow[] {
    const dedupedByPair = new Map<string, NamedSynergyRow>();

    for (const row of synergyRows) {
      const pairKey =
        row.sourceCharacterId < row.targetCharacterId
          ? `${row.sourceCharacterId}:${row.targetCharacterId}`
          : `${row.targetCharacterId}:${row.sourceCharacterId}`;

      const current = dedupedByPair.get(pairKey);
      if (!current || row.weight > current.weight) {
        dedupedByPair.set(pairKey, row);
      }
    }

    return [...dedupedByPair.values()];
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
    const lightConeLine =
      'El calculo integra bonificaciones ofensivas de conos de luz equipados (stats base + efecto compatible por via).';

    return `${input.targetName} obtiene un score de ${input.score}/100. ${damageLine} ${profileLine} ${roleLine} ${ownershipLine} ${synergyLine} ${lightConeLine}`;
  }

  private mapOwnedEntryToAnalysisCharacter(
    entry: OwnedRosterEntry,
  ): AnalysisCharacter {
    const equippedLightCone = entry.lightCone
      ? {
          name: entry.lightCone.name,
          path: entry.lightCone.path,
          rarity: entry.lightCone.rarity,
          effectDescription: entry.lightCone.effectDescription,
          level: entry.lightConeLevel,
        }
      : entry.lightConeName
        ? {
            name: entry.lightConeName,
            path: entry.character.path,
            rarity: 4,
            effectDescription: null,
            level: entry.lightConeLevel,
          }
        : null;

    const modifiers = resolveEquippedLightConeModifiers({
      characterPath: entry.character.path,
      lightCone: equippedLightCone,
    });

    return {
      id: entry.characterId,
      name: entry.character.name,
      path: entry.character.path,
      roleText: entry.character.role,
      atk: entry.atk,
      critRate: entry.critRate,
      critDamage: entry.critDamage,
      speed: entry.speed,
      modifiers,
    };
  }

  private mapTargetToAnalysisCharacter(
    targetCharacter: {
      id: number;
      name: string;
      path: string;
      role: string;
      baseAtk: number;
      baseCritRate: number;
      baseCritDamage: number;
      baseSpeed: number;
    },
    targetStatsOverride?: Pick<
      AnalysisCharacter,
      'atk' | 'critRate' | 'critDamage' | 'speed'
    > | null,
  ): AnalysisCharacter {
    return {
      id: targetCharacter.id,
      name: targetCharacter.name,
      path: targetCharacter.path,
      roleText: targetCharacter.role,
      atk: targetStatsOverride?.atk ?? targetCharacter.baseAtk,
      critRate: targetStatsOverride?.critRate ?? targetCharacter.baseCritRate,
      critDamage:
        targetStatsOverride?.critDamage ?? targetCharacter.baseCritDamage,
      speed: targetStatsOverride?.speed ?? targetCharacter.baseSpeed,
      modifiers: buildFallbackPathConeModifiers(targetCharacter.path),
    };
  }

  private normalizeRecommendationTargetStats(
    targetStats?: RecommendTargetStatsDto,
  ): Pick<
    AnalysisCharacter,
    'atk' | 'critRate' | 'critDamage' | 'speed'
  > | null {
    if (!targetStats) {
      return null;
    }

    return {
      atk: Math.max(1, Math.round(targetStats.atk)),
      critRate: this.clamp(targetStats.critRate / 100, 0, 1),
      critDamage: Math.max(0, targetStats.critDamage / 100),
      speed: Math.max(1, Math.round(targetStats.speed)),
    };
  }

  private applyStatAdjustments(
    baseCharacter: AnalysisCharacter,
    dto: SimulateDamageDto,
  ): AnalysisCharacter {
    const critRateDeltaRatio = dto.critRateDelta / 100;
    const critDamageDeltaRatio = dto.critDamageDelta / 100;

    return {
      ...baseCharacter,
      atk: Math.max(1, baseCharacter.atk + dto.atkDelta),
      critRate: this.clamp(baseCharacter.critRate + critRateDeltaRatio, 0, 1),
      critDamage: Math.max(0, baseCharacter.critDamage + critDamageDeltaRatio),
      speed: Math.max(1, baseCharacter.speed + dto.speedDelta),
    };
  }

  private normalizeAdjustments(dto: SimulateDamageDto) {
    return {
      atkDelta: dto.atkDelta,
      critRateDelta: Number(dto.critRateDelta.toFixed(2)),
      critDamageDelta: Number(dto.critDamageDelta.toFixed(2)),
      speedDelta: dto.speedDelta,
    };
  }

  private clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
  }

  private resolveCustomTeamEntries(
    ownedEntries: OwnedRosterEntry[],
    targetCharacterId: number,
    teammateCharacterIds?: number[],
  ): OwnedRosterEntry[] | null {
    if (!teammateCharacterIds || teammateCharacterIds.length === 0) {
      return null;
    }

    const targetEntry = ownedEntries.find(
      (entry) => entry.characterId === targetCharacterId,
    );
    if (!targetEntry) {
      throw new NotFoundException(
        'El personaje objetivo no existe en tu roster.',
      );
    }

    if (teammateCharacterIds.includes(targetCharacterId)) {
      throw new BadRequestException(
        'El personaje objetivo no puede repetirse dentro de los companeros.',
      );
    }

    const teammateEntries = teammateCharacterIds.map((characterId) => {
      const teammate = ownedEntries.find(
        (entry) => entry.characterId === characterId,
      );

      if (!teammate) {
        throw new NotFoundException(
          `El companero con id ${characterId} no existe en tu roster.`,
        );
      }

      return teammate;
    });

    return [targetEntry, ...teammateEntries];
  }
}
