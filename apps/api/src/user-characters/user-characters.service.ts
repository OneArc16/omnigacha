import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  buildCharacterStatSources,
  type CharacterStatKey,
  type CharacterStatMap,
  type CharacterStatSourceMap,
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
import { handlePrismaError } from '../common/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserCharacterDto } from './dto/create-user-character.dto';
import { UpdateUserCharacterDto } from './dto/update-user-character.dto';

const userCharacterInclude = {
  user: { select: { id: true, name: true, email: true } },
  character: {
    include: characterCatalogInclude,
  },
  lightCone: {
    select: { id: true, name: true, path: true, rarity: true },
  },
} satisfies Prisma.UserCharacterInclude;

type UserCharacterRow = Prisma.UserCharacterGetPayload<{
  include: typeof userCharacterInclude;
}>;

@Injectable()
export class UserCharactersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateUserCharacterDto) {
    try {
      const character = await this.getCharacterCatalogRow(dto.characterId);

      await this.assertLightConeCompatibility(
        dto.characterId,
        dto.lightConeId ?? null,
      );

      const { stats, statSources } = this.resolveStatsForCreate(character, dto);

      const created = await this.prisma.userCharacter.create({
        data: {
          userId,
          characterId: dto.characterId,
          level: dto.level,
          eidolon: dto.eidolon,
          lightConeId: dto.lightConeId ?? null,
          lightConeLevel: dto.lightConeId ? (dto.lightConeLevel ?? null) : null,
          ...this.toPersistenceStats(stats, statSources),
        },
        include: userCharacterInclude,
      });

      return this.mapUserCharacterRow(created);
    } catch (error) {
      handlePrismaError(error, 'UserCharacter');
    }
  }

  async findAll(userId: number, query: CursorPaginationQueryDto) {
    const limit = query.limit ?? 20;
    const rows = await this.prisma.userCharacter.findMany({
      where: { userId },
      include: userCharacterInclude,
      orderBy: { id: 'asc' },
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      take: limit + 1,
    });

    return paginateByCursor(
      rows.map((row) => this.mapUserCharacterRow(row)),
      limit,
    );
  }

  async findOne(userId: number, id: number) {
    const record = await this.findRawOne(userId, id);
    return this.mapUserCharacterRow(record);
  }

  async update(userId: number, id: number, dto: UpdateUserCharacterDto) {
    try {
      const existing = await this.findRawOne(userId, id);
      const nextCharacterId = dto.characterId ?? existing.characterId;
      const nextLightConeId =
        dto.lightConeId === undefined ? existing.lightConeId : dto.lightConeId;
      const nextLightConeLevel =
        nextLightConeId == null
          ? null
          : dto.lightConeLevel === undefined
            ? existing.lightConeLevel
            : dto.lightConeLevel;

      await this.assertLightConeCompatibility(
        nextCharacterId,
        nextLightConeId ?? null,
      );

      const nextCharacter = await this.getCharacterCatalogRow(nextCharacterId);
      const { stats, statSources } = this.resolveStatsForUpdate(
        existing,
        nextCharacter,
        dto,
      );

      const updated = await this.prisma.userCharacter.update({
        where: { id },
        data: {
          characterId: nextCharacterId,
          level: dto.level ?? existing.level,
          eidolon: dto.eidolon ?? existing.eidolon,
          lightConeId: nextLightConeId ?? null,
          lightConeLevel: nextLightConeLevel ?? null,
          ...this.toPersistenceStats(stats, statSources),
        },
        include: userCharacterInclude,
      });

      return this.mapUserCharacterRow(updated);
    } catch (error) {
      handlePrismaError(error, 'UserCharacter');
    }
  }

  async remove(userId: number, id: number) {
    try {
      await this.findRawOne(userId, id);
      await this.prisma.userCharacter.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      handlePrismaError(error, 'UserCharacter');
    }
  }

  private async findRawOne(userId: number, id: number) {
    const record = await this.prisma.userCharacter.findFirst({
      where: { id, userId },
      include: userCharacterInclude,
    });

    if (!record) {
      throw new NotFoundException('UserCharacter not found');
    }

    return record;
  }

  private async getCharacterCatalogRow(characterId: number) {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: characterCatalogInclude,
    });

    if (!character) {
      throw new NotFoundException('Character not found');
    }

    return character;
  }

  private mapUserCharacterRow(row: UserCharacterRow) {
    const character = mapCharacterCatalogRow(row.character);
    const fallbackStats = this.readLegacyStats(row);
    const storedStats = this.parseCharacterStats(row.stats);
    const stats = mergeCharacterStats(character.defaultStats, {
      ...fallbackStats,
      ...storedStats,
    });

    return {
      id: row.id,
      userId: row.userId,
      characterId: row.characterId,
      lightConeId: row.lightConeId,
      lightConeName: row.lightConeName,
      lightConeLevel: row.lightConeLevel,
      level: row.level,
      eidolon: row.eidolon,
      hp: row.hp,
      atk: row.atk,
      def: row.def,
      critRate: row.critRate,
      critDamage: row.critDamage,
      breakEffect: row.breakEffect,
      energyRegenRate: row.energyRegenRate,
      effectHitRate: row.effectHitRate,
      effectRes: row.effectRes,
      elementalDmgBonus: row.elementalDmgBonus,
      speed: row.speed,
      stats,
      statSources: this.parseCharacterStatSources(row.statSources),
      lightCone: row.lightCone,
      character,
    };
  }

  private resolveStatsForCreate(
    character: CharacterCatalogRow,
    dto: CreateUserCharacterDto,
  ) {
    const baseStats = mapCharacterCatalogRow(character).defaultStats;
    const overrideStats = this.extractStatsOverride(dto);
    const stats = mergeCharacterStats(baseStats, overrideStats);
    const statSources = buildCharacterStatSources(
      baseStats,
      overrideStats,
      'user_input',
    );

    return { stats, statSources };
  }

  private resolveStatsForUpdate(
    existing: UserCharacterRow,
    nextCharacter: CharacterCatalogRow,
    dto: UpdateUserCharacterDto,
  ) {
    const characterChanged = nextCharacter.id !== existing.characterId;
    const baseStats = characterChanged
      ? mapCharacterCatalogRow(nextCharacter).defaultStats
      : this.mapUserCharacterRow(existing).stats;
    const overrideStats = this.extractStatsOverride(dto);

    if (Object.keys(overrideStats).length === 0) {
      return {
        stats: baseStats,
        statSources: characterChanged
          ? buildCharacterStatSources(baseStats, null)
          : this.parseCharacterStatSources(existing.statSources),
      };
    }

    const stats = mergeCharacterStats(baseStats, overrideStats);
    const statSources = characterChanged
      ? buildCharacterStatSources(baseStats, overrideStats, 'user_input')
      : {
          ...this.parseCharacterStatSources(existing.statSources),
          ...buildCharacterStatSources({}, overrideStats, 'user_input'),
        };

    return { stats, statSources };
  }

  private extractStatsOverride(
    dto: Partial<CreateUserCharacterDto>,
  ): CharacterStatMap {
    if (dto.stats) {
      return normalizeUserStatsMap(dto.stats);
    }

    const legacyStats: CharacterStatMap = {};

    if (dto.hp !== undefined) legacyStats.hp = dto.hp;
    if (dto.atk !== undefined) legacyStats.atk = dto.atk;
    if (dto.def !== undefined) legacyStats.def = dto.def;
    if (dto.speed !== undefined) legacyStats.speed = dto.speed;
    if (dto.critRate !== undefined) legacyStats.crit_rate = dto.critRate;
    if (dto.critDamage !== undefined) legacyStats.crit_damage = dto.critDamage;
    if (dto.breakEffect !== undefined) {
      legacyStats.break_effect = dto.breakEffect;
    }
    if (dto.energyRegenRate !== undefined) {
      legacyStats.energy_regen_rate = dto.energyRegenRate;
    }
    if (dto.effectHitRate !== undefined) {
      legacyStats.effect_hit_rate = dto.effectHitRate;
    }
    if (dto.effectRes !== undefined) legacyStats.effect_res = dto.effectRes;
    if (dto.elementalDmgBonus !== undefined) {
      legacyStats.elemental_dmg_bonus = dto.elementalDmgBonus;
    }

    return normalizeUserStatsMap(legacyStats);
  }

  private readLegacyStats(row: UserCharacterRow): CharacterStatMap {
    return normalizeUserStatsMap({
      hp: row.hp ?? undefined,
      atk: row.atk,
      def: row.def ?? undefined,
      speed: row.speed,
      crit_rate: row.critRate,
      crit_damage: row.critDamage,
      break_effect: row.breakEffect ?? undefined,
      energy_regen_rate: row.energyRegenRate ?? undefined,
      effect_hit_rate: row.effectHitRate ?? undefined,
      effect_res: row.effectRes ?? undefined,
      elemental_dmg_bonus: row.elementalDmgBonus ?? undefined,
    });
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

  private parseCharacterStatSources(
    rawSources: Prisma.JsonValue | null,
  ): CharacterStatSourceMap {
    if (
      !rawSources ||
      typeof rawSources !== 'object' ||
      Array.isArray(rawSources)
    ) {
      return {};
    }

    const normalized: CharacterStatSourceMap = {};
    for (const key of Object.keys(rawSources)) {
      const statKey = key as CharacterStatKey;
      const value = rawSources[key];
      if (
        value === 'catalog_default' ||
        value === 'user_input' ||
        value === 'legacy_migrated'
      ) {
        normalized[statKey] = value;
      }
    }

    return normalized;
  }

  private toPersistenceStats(
    stats: CharacterStatMap,
    statSources: CharacterStatSourceMap,
  ) {
    return {
      stats: stats as Prisma.InputJsonValue,
      statSources: statSources as Prisma.InputJsonValue,
      hp: stats.hp ?? null,
      atk: stats.atk ?? 0,
      def: stats.def ?? null,
      critRate: stats.crit_rate ?? 0,
      critDamage: stats.crit_damage ?? 0,
      breakEffect: stats.break_effect ?? null,
      energyRegenRate: stats.energy_regen_rate ?? null,
      effectHitRate: stats.effect_hit_rate ?? null,
      effectRes: stats.effect_res ?? null,
      elementalDmgBonus: stats.elemental_dmg_bonus ?? null,
      speed: stats.speed ?? 0,
    };
  }

  private async assertLightConeCompatibility(
    characterId: number,
    lightConeId: number | null,
  ) {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      select: { id: true, path: true, name: true },
    });

    if (!character) {
      throw new NotFoundException('Character not found');
    }

    if (lightConeId == null) {
      return;
    }

    const lightCone = await this.prisma.lightCone.findUnique({
      where: { id: lightConeId },
      select: { id: true, path: true, name: true },
    });

    if (!lightCone) {
      throw new NotFoundException('LightCone not found');
    }

    if (character.path !== lightCone.path) {
      throw new BadRequestException(
        `${lightCone.name} solo es compatible con personajes de la vía ${lightCone.path}.`,
      );
    }
  }
}
