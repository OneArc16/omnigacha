import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RecommendationLevel } from '@prisma/client';
import {
  buildBalancedTeam,
  buildTeamWithLockedMembers,
  compareTeamDamage,
  countCompatibleTeams,
  inferTeamRole,
} from '../analysis/damage-calculator';
import { hasDerivedArchetype } from '../analysis/derived-archetypes';
import { mergeDerivedSynergyEdges } from '../analysis/catalog-synergy';
import {
  calculateFinalRecommendationScore,
  calculateRecommendationFactorScores,
  calculateRecommendationScoreBreakdown,
} from '../analysis/recommendation-score';
import {
  buildFallbackPathConeModifiers,
  resolveEquippedLightConeModifiers,
} from '../analysis/light-cone-effects';
import type { AnalysisCharacter, SynergyEdge } from '../analysis/types';
import {
  type CharacterStatKey,
  type CharacterStatMap,
  mergeCharacterStats,
  normalizeUserStatsMap,
} from '../characters/character-catalog';
import {
  characterCatalogInclude,
  mapCharacterCatalogRow,
  type CharacterCatalogRow,
} from '../characters/character-presenter';
import { paginateByCursor } from '../common/cursor-pagination';
import { CursorPaginationQueryDto } from '../common/dto/cursor-pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  RecommendCharacterDto,
  RecommendTargetStatsDto,
} from './dto/recommend-character.dto';
import { SimulateDamageDto } from './dto/simulate-damage.dto';

const simulationUserCharacterInclude = {
  character: {
    include: characterCatalogInclude,
  },
  lightCone: true,
} satisfies Prisma.UserCharacterInclude;

type OwnedRosterEntry = Prisma.UserCharacterGetPayload<{
  include: typeof simulationUserCharacterInclude;
}>;

type NamedSynergyRow = {
  sourceCharacterId: number;
  targetCharacterId: number;
  weight: number;
  sourceCharacter: { name: string };
  targetCharacter: { name: string };
};

type RecommendationTargetStatsContext = {
  statKeys: CharacterStatKey[];
  stats: CharacterStatMap;
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
        include: characterCatalogInclude,
      }),
      this.prisma.userCharacter.findMany({
        where: { userId },
        include: simulationUserCharacterInclude,
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
      ? this.applyStatOverrides(
          baseProposedTargetCharacter,
          normalizedTargetStats,
        )
      : baseProposedTargetCharacter;
    const targetStatKeys = this.getRelevantStatKeys(proposedTargetCharacter);
    const appliedTargetStats: RecommendationTargetStatsContext = {
      statKeys: targetStatKeys,
      stats: this.pickStatSubset(proposedTargetCharacter.stats, targetStatKeys),
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

    const explicitSynergyRows: NamedSynergyRow[] =
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
    const synergyRows = mergeDerivedSynergyEdges(
      proposedRoster,
      explicitSynergyRows,
      (source, target, weight) => ({
        sourceCharacterId: source.id,
        targetCharacterId: target.id,
        weight,
        sourceCharacter: { name: source.name },
        targetCharacter: { name: target.name },
      }),
    );

    const targetRole = inferTeamRole(
      proposedTargetCharacter.path,
      proposedTargetCharacter.roleText,
      proposedTargetCharacter.tagKeys,
    );
    const sameRoleCount = ownedRoster.filter(
      (member) =>
        inferTeamRole(member.path, member.roleText, member.tagKeys) ===
        targetRole,
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

    const compatibleTeams = countCompatibleTeams(
      proposedRoster,
      targetCharacter.id,
      synergyRows,
    );
    const singleStrongLinkSupportOpportunity =
      targetRole === 'support' &&
      hasDerivedArchetype(proposedTargetCharacter, 'hypercarry_support') &&
      compatibleTeams === 0 &&
      targetSynergyPairs.length === 1 &&
      synergyScore >= 85;
    const factorScores = calculateRecommendationFactorScores({
      deltaPercent: damageComparison.deltaPercent,
      synergyScore,
      synergyCount: targetSynergyPairs.length,
      compatibleTeams,
      sameRoleCount,
      alreadyOwned,
      targetRole,
      singleStrongLinkSupportOpportunity,
    });
    const scoringBreakdown =
      calculateRecommendationScoreBreakdown(factorScores);
    const score = calculateFinalRecommendationScore(scoringBreakdown);

    const level = this.toLevel(score);

    const topSynergies = this.toTopSynergyLabels(targetSynergyPairs);

    const explanation = this.buildExplanation({
      targetName: targetCharacter.name,
      score,
      sameRoleCount,
      alreadyOwned,
      topSynergies,
      compatibleTeams,
      currentTeamDamage: damageComparison.currentTeam.totalDamage,
      proposedTeamDamage: damageComparison.proposedTeam.totalDamage,
      deltaPercent: damageComparison.deltaPercent,
      currentProfileCoverage: damageComparison.currentTeam.profileCoverageBonus,
      proposedProfileCoverage:
        damageComparison.proposedTeam.profileCoverageBonus,
      factorScores,
      singleStrongLinkSupportOpportunity,
    });

    const estimatedDeltaDmg = Number(damageComparison.deltaPercent.toFixed(2));

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
          singleStrongLinkSupportOpportunity,
          currentTeamDamage: Number(
            damageComparison.currentTeam.totalDamage.toFixed(2),
          ),
          proposedTeamDamage: Number(
            damageComparison.proposedTeam.totalDamage.toFixed(2),
          ),
          deltaPercent: damageComparison.deltaPercent,
          factorScores,
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
        factorScores,
        scoringBreakdown,
      },
    };
  }

  async simulateDamage(userId: number, dto: SimulateDamageDto) {
    const ownedEntries = (await this.prisma.userCharacter.findMany({
      where: { userId },
      include: simulationUserCharacterInclude,
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
    const simulatedStats = this.normalizeManualStats(dto.stats);
    const simulatedCharacter = this.applyStatOverrides(
      baseCharacter,
      simulatedStats,
    );
    const statKeys = this.getRelevantStatKeys(baseCharacter);

    const rosterIds = [...new Set(fullRoster.map((member) => member.id))];
    const explicitSynergyRows: SynergyEdge[] =
      await this.prisma.characterSynergy.findMany({
        where: {
          sourceCharacterId: { in: rosterIds },
          targetCharacterId: { in: rosterIds },
        },
      });
    const synergyRows = mergeDerivedSynergyEdges(
      fullRoster,
      explicitSynergyRows,
      (source, target, weight) => ({
        sourceCharacterId: source.id,
        targetCharacterId: target.id,
        weight,
      }),
    );

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
      statKeys,
      baseStats: this.pickStatSubset(baseCharacter.stats, statKeys),
      simulatedStats: this.pickStatSubset(simulatedCharacter.stats, statKeys),
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
        `Equipo ${teamContext.mode === 'custom' ? 'personalizado' : 'automático'} aplicado ` +
        `(${teamContext.members.map((member) => member.name).join(', ')}).` +
        (customTeamEntries && customTeamEntries.length < 4
          ? ' Se autocompletó con prioridad de sinergia hasta 4 miembros.'
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
    compatibleTeams: number;
    currentTeamDamage: number;
    proposedTeamDamage: number;
    deltaPercent: number;
    currentProfileCoverage: number;
    proposedProfileCoverage: number;
    factorScores: {
      damageScore: number;
      synergyScore: number;
      teamScore: number;
      roleScore: number;
      investmentScore: number;
      accountValueScore: number;
    };
    singleStrongLinkSupportOpportunity: boolean;
  }) {
    const roleLine =
      input.sameRoleCount === 0
        ? 'Tu cuenta necesita más cobertura de este rol.'
        : `Ya tienes ${input.sameRoleCount} personaje(s) del mismo rol, por eso el bonus de rol es menor.`;

    const ownershipLine = input.alreadyOwned
      ? 'Ya lo tienes en la cuenta, así que la conveniencia para pull baja.'
      : 'No lo tienes aún, por lo que la adquisición puede abrir nuevas opciones.';

    const synergyLine =
      input.topSynergies.length > 0
        ? `Sinergias detectadas: ${input.topSynergies.join('; ')}.`
        : 'No se detectaron sinergias directas fuertes con tu roster actual.';

    const teamLine = (() => {
      if (input.singleStrongLinkSupportOpportunity) {
        return 'Solo se detectó un núcleo fuerte con un carry concreto, pero no varios equipos estables con tu roster actual.';
      }

      if (input.compatibleTeams >= 3) {
        return 'Puede entrar en 3 o más equipos compatibles dentro de tu cuenta.';
      }

      if (input.compatibleTeams === 2) {
        return 'Puede entrar en 2 equipos compatibles dentro de tu cuenta.';
      }

      if (input.compatibleTeams === 1) {
        return 'Solo se detectó 1 equipo compatible claro con tu roster actual.';
      }

      return 'No se detectaron equipos compatibles estables con tu roster actual.';
    })();

    const factorLine = `Factores: daño ${input.factorScores.damageScore}/100, sinergia ${input.factorScores.synergyScore}/100, equipos ${input.factorScores.teamScore}/100, rol ${input.factorScores.roleScore}/100, inversión ${input.factorScores.investmentScore}/100, valor de cuenta ${input.factorScores.accountValueScore}/100.`;
    const damageLine = `Daño estimado: actual ${input.currentTeamDamage.toFixed(2)} vs propuesto ${input.proposedTeamDamage.toFixed(2)} (delta ${input.deltaPercent.toFixed(2)}%).`;
    const profileLine = `Cobertura de perfiles: ${input.currentProfileCoverage.toFixed(2)} -> ${input.proposedProfileCoverage.toFixed(2)}.`;
    const lightConeLine =
      'El cálculo integra bonificaciones ofensivas de conos de luz equipados (stats base + efecto compatible por vía).';

    return `${input.targetName} obtiene un puntaje de ${input.score}/100. ${damageLine} ${profileLine} ${teamLine} ${roleLine} ${ownershipLine} ${synergyLine} ${factorLine} ${lightConeLine}`;
  }

  private mapOwnedEntryToAnalysisCharacter(
    entry: OwnedRosterEntry,
  ): AnalysisCharacter {
    const catalogCharacter = mapCharacterCatalogRow(entry.character);
    const mergedStats = mergeCharacterStats(catalogCharacter.defaultStats, {
      ...this.readLegacyStats(entry),
      ...this.parseCharacterStats(entry.stats),
    });
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
      element: entry.character.element,
      path: entry.character.path,
      roleText: entry.character.role,
      tagKeys: catalogCharacter.tagBuckets.all,
      statProfile: catalogCharacter.statProfile,
      stats: mergedStats,
      hp: mergedStats.hp ?? catalogCharacter.baseHp,
      atk: mergedStats.atk ?? entry.atk,
      def: mergedStats.def ?? catalogCharacter.baseDef,
      critRate: mergedStats.crit_rate ?? entry.critRate,
      critDamage: mergedStats.crit_damage ?? entry.critDamage,
      breakEffect: mergedStats.break_effect ?? 0,
      energyRegenRate: mergedStats.energy_regen_rate ?? 0,
      effectHitRate: mergedStats.effect_hit_rate ?? 0,
      effectRes: mergedStats.effect_res ?? 0,
      elementalDmgBonus: mergedStats.elemental_dmg_bonus ?? 0,
      speed: mergedStats.speed ?? entry.speed,
      modifiers,
    };
  }

  private mapTargetToAnalysisCharacter(
    targetCharacter: CharacterCatalogRow,
    targetStatsOverride?: CharacterStatMap | null,
  ): AnalysisCharacter {
    const catalogCharacter = mapCharacterCatalogRow(targetCharacter);
    const mergedStats = mergeCharacterStats(
      catalogCharacter.defaultStats,
      targetStatsOverride,
    );

    return {
      id: targetCharacter.id,
      name: targetCharacter.name,
      element: targetCharacter.element,
      path: targetCharacter.path,
      roleText: targetCharacter.role,
      tagKeys: catalogCharacter.tagBuckets.all,
      statProfile: catalogCharacter.statProfile,
      stats: mergedStats,
      hp: mergedStats.hp ?? catalogCharacter.baseHp,
      atk: mergedStats.atk ?? catalogCharacter.baseAtk,
      def: mergedStats.def ?? catalogCharacter.baseDef,
      critRate: mergedStats.crit_rate ?? catalogCharacter.baseCritRate,
      critDamage: mergedStats.crit_damage ?? catalogCharacter.baseCritDamage,
      breakEffect: mergedStats.break_effect ?? 0,
      energyRegenRate: mergedStats.energy_regen_rate ?? 0,
      effectHitRate: mergedStats.effect_hit_rate ?? 0,
      effectRes: mergedStats.effect_res ?? 0,
      elementalDmgBonus: mergedStats.elemental_dmg_bonus ?? 0,
      speed: mergedStats.speed ?? catalogCharacter.baseSpeed,
      modifiers: buildFallbackPathConeModifiers(targetCharacter.path),
    };
  }

  private normalizeRecommendationTargetStats(
    targetStats?: RecommendTargetStatsDto,
  ): CharacterStatMap | null {
    if (!targetStats) {
      return null;
    }

    return this.normalizeManualStats(targetStats);
  }

  private applyStatOverrides(
    baseCharacter: AnalysisCharacter,
    overrideStats: CharacterStatMap,
  ): AnalysisCharacter {
    const mergedStats = mergeCharacterStats(baseCharacter.stats, overrideStats);
    return {
      ...baseCharacter,
      stats: mergedStats,
      hp: mergedStats.hp ?? baseCharacter.hp,
      atk: mergedStats.atk ?? baseCharacter.atk,
      def: mergedStats.def ?? baseCharacter.def,
      critRate: mergedStats.crit_rate ?? baseCharacter.critRate,
      critDamage: mergedStats.crit_damage ?? baseCharacter.critDamage,
      breakEffect: mergedStats.break_effect ?? baseCharacter.breakEffect,
      energyRegenRate:
        mergedStats.energy_regen_rate ?? baseCharacter.energyRegenRate,
      effectHitRate: mergedStats.effect_hit_rate ?? baseCharacter.effectHitRate,
      effectRes: mergedStats.effect_res ?? baseCharacter.effectRes,
      elementalDmgBonus:
        mergedStats.elemental_dmg_bonus ?? baseCharacter.elementalDmgBonus,
      speed: mergedStats.speed ?? baseCharacter.speed,
    };
  }

  private normalizeManualStats(stats: CharacterStatMap): CharacterStatMap {
    return normalizeUserStatsMap(stats);
  }

  private getRelevantStatKeys(
    character: AnalysisCharacter,
  ): CharacterStatKey[] {
    return [
      ...new Set([
        ...character.statProfile.prioritizedStatKeys,
        ...character.statProfile.enabledStatKeys,
      ]),
    ];
  }

  private pickStatSubset(
    stats: CharacterStatMap,
    statKeys: CharacterStatKey[],
  ): CharacterStatMap {
    const subset: CharacterStatMap = {};

    for (const statKey of statKeys) {
      const value = stats[statKey];
      if (typeof value === 'number') {
        subset[statKey] = value;
      }
    }

    return subset;
  }

  private parseCharacterStats(
    rawStats: Prisma.JsonValue | null,
  ): CharacterStatMap {
    if (!rawStats || typeof rawStats !== 'object' || Array.isArray(rawStats)) {
      return {};
    }

    const normalized: CharacterStatMap = {};
    for (const key of Object.keys(rawStats)) {
      const statKey = key as CharacterStatKey;
      const value = rawStats[key];
      if (typeof value !== 'number') {
        continue;
      }

      normalized[statKey] = value;
    }

    return normalizeUserStatsMap(normalized);
  }

  private readLegacyStats(entry: OwnedRosterEntry): CharacterStatMap {
    return normalizeUserStatsMap({
      hp: entry.hp ?? undefined,
      atk: entry.atk,
      def: entry.def ?? undefined,
      speed: entry.speed,
      crit_rate: entry.critRate,
      crit_damage: entry.critDamage,
      break_effect: entry.breakEffect ?? undefined,
      energy_regen_rate: entry.energyRegenRate ?? undefined,
      effect_hit_rate: entry.effectHitRate ?? undefined,
      effect_res: entry.effectRes ?? undefined,
      elemental_dmg_bonus: entry.elementalDmgBonus ?? undefined,
    });
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
        'El personaje objetivo no puede repetirse dentro de los compañeros.',
      );
    }

    const teammateEntries = teammateCharacterIds.map((characterId) => {
      const teammate = ownedEntries.find(
        (entry) => entry.characterId === characterId,
      );

      if (!teammate) {
        throw new NotFoundException(
          `El compañero con id ${characterId} no existe en tu roster.`,
        );
      }

      return teammate;
    });

    return [targetEntry, ...teammateEntries];
  }
}
