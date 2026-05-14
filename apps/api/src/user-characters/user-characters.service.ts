import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { paginateByCursor } from '../common/cursor-pagination';
import { CursorPaginationQueryDto } from '../common/dto/cursor-pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { handlePrismaError } from '../common/prisma-errors';
import { CreateUserCharacterDto } from './dto/create-user-character.dto';
import { UpdateUserCharacterDto } from './dto/update-user-character.dto';

const userCharacterInclude = {
  user: { select: { id: true, name: true, email: true } },
  character: {
    select: { id: true, name: true, element: true, path: true, role: true },
  },
  lightCone: {
    select: { id: true, name: true, path: true, rarity: true },
  },
} as const;

@Injectable()
export class UserCharactersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateUserCharacterDto) {
    try {
      await this.assertLightConeCompatibility(
        dto.characterId,
        dto.lightConeId ?? null,
      );

      return await this.prisma.userCharacter.create({
        data: {
          userId,
          characterId: dto.characterId,
          level: dto.level,
          eidolon: dto.eidolon,
          lightConeId: dto.lightConeId ?? null,
          lightConeLevel: dto.lightConeId ? (dto.lightConeLevel ?? null) : null,
          atk: dto.atk,
          critRate: dto.critRate,
          critDamage: dto.critDamage,
          speed: dto.speed,
        },
        include: userCharacterInclude,
      });
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

    return paginateByCursor(rows, limit);
  }

  async findOne(userId: number, id: number) {
    const record = await this.prisma.userCharacter.findFirst({
      where: { id, userId },
      include: userCharacterInclude,
    });

    if (!record) {
      throw new NotFoundException('UserCharacter not found');
    }

    return record;
  }

  async update(userId: number, id: number, dto: UpdateUserCharacterDto) {
    try {
      const existing = await this.findOne(userId, id);
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

      return await this.prisma.userCharacter.update({
        where: { id },
        data: {
          ...dto,
          lightConeId: nextLightConeId ?? null,
          lightConeLevel: nextLightConeLevel ?? null,
        },
        include: userCharacterInclude,
      });
    } catch (error) {
      handlePrismaError(error, 'UserCharacter');
    }
  }

  async remove(userId: number, id: number) {
    try {
      await this.findOne(userId, id);
      await this.prisma.userCharacter.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      handlePrismaError(error, 'UserCharacter');
    }
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
        `${lightCone.name} solo es compatible con personajes de la via ${lightCone.path}.`,
      );
    }
  }
}
