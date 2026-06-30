import { Injectable, NotFoundException } from '@nestjs/common';
import { CatalogStatus } from '@prisma/client';
import { paginateByCursor } from '../common/cursor-pagination';
import { CursorPaginationQueryDto } from '../common/dto/cursor-pagination-query.dto';
import { generateUniqueSlug } from '../common/slug';
import { handlePrismaError } from '../common/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import {
  characterCatalogInclude,
  mapCharacterCatalogRow,
} from './character-presenter';

const DEFAULT_CHARACTER_VERSION = '3.8';

type CharacterWriteDefaults = {
  name: string;
  slug: string;
  element: string;
  path: string;
  role: string;
  rarity: number;
  gameVersion: string;
  status: CatalogStatus;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseCritRate: number;
  baseCritDamage: number;
  baseSpeed: number;
  splashArtAssetId: number | null;
};

function buildCharacterWriteData(
  dto: Partial<CreateCharacterDto>,
  current: CharacterWriteDefaults,
) {
  return {
    name: dto.name ?? current.name,
    slug: dto.slug ?? current.slug,
    element: dto.element ?? current.element,
    path: dto.path ?? current.path,
    role: dto.role ?? current.role,
    rarity: dto.rarity ?? current.rarity,
    gameVersion: dto.gameVersion ?? current.gameVersion,
    status: dto.status ?? current.status,
    baseHp: dto.baseHp ?? current.baseHp,
    baseAtk: dto.baseAtk ?? current.baseAtk,
    baseDef: dto.baseDef ?? current.baseDef,
    baseCritRate: dto.baseCritRate ?? current.baseCritRate,
    baseCritDamage: dto.baseCritDamage ?? current.baseCritDamage,
    baseSpeed: dto.baseSpeed ?? current.baseSpeed,
    splashArtAssetId:
      dto.splashArtAssetId === undefined
        ? current.splashArtAssetId
        : dto.splashArtAssetId,
  };
}

@Injectable()
export class CharactersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCharacterDto) {
    try {
      const slug = await this.resolveUniqueSlug(dto.slug ?? dto.name);
      const character = await this.prisma.character.create({
        data: buildCharacterWriteData(dto, {
          name: dto.name,
          slug,
          element: dto.element,
          path: dto.path,
          role: dto.role,
          rarity: dto.rarity ?? 5,
          gameVersion: dto.gameVersion ?? DEFAULT_CHARACTER_VERSION,
          status: dto.status ?? CatalogStatus.DRAFT,
          baseHp: dto.baseHp ?? 0,
          baseAtk: dto.baseAtk,
          baseDef: dto.baseDef ?? 0,
          baseCritRate: dto.baseCritRate,
          baseCritDamage: dto.baseCritDamage,
          baseSpeed: dto.baseSpeed,
          splashArtAssetId: dto.splashArtAssetId ?? null,
        }),
        include: characterCatalogInclude,
      });

      return mapCharacterCatalogRow(character);
    } catch (error) {
      handlePrismaError(error, 'Character');
    }
  }

  async findAll(query: CursorPaginationQueryDto) {
    return this.findMany(query, true);
  }

  async findAllAdmin(query: CursorPaginationQueryDto) {
    return this.findMany(query, false);
  }

  async findOne(id: number) {
    const character = await this.prisma.character.findFirst({
      where: { id, status: CatalogStatus.PUBLISHED },
      include: characterCatalogInclude,
    });

    if (!character) {
      throw new NotFoundException('Character not found');
    }

    return mapCharacterCatalogRow(character);
  }

  async findOneAdmin(id: number) {
    const character = await this.prisma.character.findUnique({
      where: { id },
      include: characterCatalogInclude,
    });

    if (!character) {
      throw new NotFoundException('Character not found');
    }

    return mapCharacterCatalogRow(character);
  }

  async update(id: number, dto: UpdateCharacterDto) {
    try {
      const current = await this.prisma.character.findUnique({
        where: { id },
        select: {
          name: true,
          slug: true,
          element: true,
          path: true,
          role: true,
          rarity: true,
          gameVersion: true,
          status: true,
          baseHp: true,
          baseAtk: true,
          baseDef: true,
          baseCritRate: true,
          baseCritDamage: true,
          baseSpeed: true,
          splashArtAssetId: true,
        },
      });

      if (!current) {
        throw new NotFoundException('Character not found');
      }

      const nextSlug =
        dto.slug && dto.slug !== current.slug
          ? await this.resolveUniqueSlug(dto.slug)
          : current.slug;

      const character = await this.prisma.character.update({
        where: { id },
        data: buildCharacterWriteData(dto, {
          name: current.name,
          slug: nextSlug,
          element: current.element,
          path: current.path,
          role: current.role,
          rarity: current.rarity,
          gameVersion: current.gameVersion,
          status: dto.status ?? current.status,
          baseHp: current.baseHp,
          baseAtk: current.baseAtk,
          baseDef: current.baseDef,
          baseCritRate: current.baseCritRate,
          baseCritDamage: current.baseCritDamage,
          baseSpeed: current.baseSpeed,
          splashArtAssetId: current.splashArtAssetId,
        }),
        include: characterCatalogInclude,
      });

      return mapCharacterCatalogRow(character);
    } catch (error) {
      handlePrismaError(error, 'Character');
    }
  }

  async archive(id: number) {
    try {
      const character = await this.prisma.character.update({
        where: { id },
        data: { status: CatalogStatus.ARCHIVED },
        include: characterCatalogInclude,
      });

      return mapCharacterCatalogRow(character);
    } catch (error) {
      handlePrismaError(error, 'Character');
    }
  }

  private async findMany(
    query: CursorPaginationQueryDto,
    publishedOnly: boolean,
  ) {
    const limit = query.limit ?? 20;
    const rows = await this.prisma.character.findMany({
      where: {
        ...(query.cursor ? { id: { gt: query.cursor } } : {}),
        ...(publishedOnly ? { status: CatalogStatus.PUBLISHED } : {}),
      },
      include: characterCatalogInclude,
      orderBy: { id: 'asc' },
      take: limit + 1,
    });

    return paginateByCursor(
      rows.map((row) => mapCharacterCatalogRow(row)),
      limit,
    );
  }

  private async resolveUniqueSlug(value: string) {
    return generateUniqueSlug(value, async (slug) => {
      const existing = await this.prisma.character.findUnique({
        where: { slug },
        select: { id: true },
      });

      return Boolean(existing);
    });
  }
}
