import { Injectable, NotFoundException } from '@nestjs/common';
import { CatalogStatus } from '@prisma/client';
import { paginateByCursor } from '../common/cursor-pagination';
import { generateUniqueSlug } from '../common/slug';
import { handlePrismaError } from '../common/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import { ListRelicSetsQueryDto } from './dto/list-relic-sets-query.dto';
import { CreateRelicSetDto } from './dto/create-relic-set.dto';
import { UpdateRelicSetDto } from './dto/update-relic-set.dto';
import {
  mapRelicSetCatalogRow,
  relicSetCatalogInclude,
} from './relic-set-presenter';

type RelicSetWriteDefaults = {
  name: string;
  slug: string;
  type: 'ARTIFACT' | 'ORNAMENT';
  rarity: number;
  twoPieceBonus: string;
  fourPieceBonus: string | null;
  gameVersion: string | null;
  status: CatalogStatus;
  splashArtAssetId: number | null;
};

function buildRelicSetWriteData(
  dto: Partial<CreateRelicSetDto>,
  current: RelicSetWriteDefaults,
) {
  return {
    name: dto.name ?? current.name,
    slug: dto.slug ?? current.slug,
    type: dto.type ?? current.type,
    rarity: dto.rarity ?? current.rarity,
    twoPieceBonus: dto.twoPieceBonus ?? current.twoPieceBonus,
    fourPieceBonus:
      dto.fourPieceBonus === undefined
        ? current.fourPieceBonus
        : dto.fourPieceBonus,
    gameVersion:
      dto.gameVersion === undefined ? current.gameVersion : dto.gameVersion,
    status: dto.status ?? current.status,
    splashArtAssetId:
      dto.splashArtAssetId === undefined
        ? current.splashArtAssetId
        : dto.splashArtAssetId,
  };
}

@Injectable()
export class RelicSetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRelicSetDto) {
    try {
      const slug = await this.resolveUniqueSlug(dto.slug ?? dto.name);
      const relicSet = await this.prisma.relicSet.create({
        data: buildRelicSetWriteData(dto, {
          name: dto.name,
          slug,
          type: dto.type,
          rarity: dto.rarity,
          twoPieceBonus: dto.twoPieceBonus,
          fourPieceBonus: dto.fourPieceBonus ?? null,
          gameVersion: dto.gameVersion ?? null,
          status: dto.status ?? CatalogStatus.DRAFT,
          splashArtAssetId: dto.splashArtAssetId ?? null,
        }),
        include: relicSetCatalogInclude,
      });

      return mapRelicSetCatalogRow(relicSet);
    } catch (error) {
      handlePrismaError(error, 'RelicSet');
    }
  }

  async findAll(query: ListRelicSetsQueryDto) {
    return this.findMany(query, true);
  }

  async findAllAdmin(query: ListRelicSetsQueryDto) {
    return this.findMany(query, false);
  }

  async findOne(id: number) {
    const relicSet = await this.prisma.relicSet.findFirst({
      where: { id, status: CatalogStatus.PUBLISHED },
      include: relicSetCatalogInclude,
    });

    if (!relicSet) {
      throw new NotFoundException('Relic set not found');
    }

    return mapRelicSetCatalogRow(relicSet);
  }

  async findOneAdmin(id: number) {
    const relicSet = await this.prisma.relicSet.findUnique({
      where: { id },
      include: relicSetCatalogInclude,
    });

    if (!relicSet) {
      throw new NotFoundException('Relic set not found');
    }

    return mapRelicSetCatalogRow(relicSet);
  }

  async update(id: number, dto: UpdateRelicSetDto) {
    try {
      const current = await this.prisma.relicSet.findUnique({
        where: { id },
        select: {
          name: true,
          slug: true,
          type: true,
          rarity: true,
          twoPieceBonus: true,
          fourPieceBonus: true,
          gameVersion: true,
          status: true,
          splashArtAssetId: true,
        },
      });

      if (!current) {
        throw new NotFoundException('Relic set not found');
      }

      const nextSlug =
        dto.slug && dto.slug !== current.slug
          ? await this.resolveUniqueSlug(dto.slug)
          : current.slug;

      const relicSet = await this.prisma.relicSet.update({
        where: { id },
        data: buildRelicSetWriteData(dto, {
          name: current.name,
          slug: nextSlug,
          type: current.type,
          rarity: current.rarity,
          twoPieceBonus: current.twoPieceBonus,
          fourPieceBonus: current.fourPieceBonus,
          gameVersion: current.gameVersion,
          status: dto.status ?? current.status,
          splashArtAssetId: current.splashArtAssetId,
        }),
        include: relicSetCatalogInclude,
      });

      return mapRelicSetCatalogRow(relicSet);
    } catch (error) {
      handlePrismaError(error, 'RelicSet');
    }
  }

  async archive(id: number) {
    try {
      const relicSet = await this.prisma.relicSet.update({
        where: { id },
        data: { status: CatalogStatus.ARCHIVED },
        include: relicSetCatalogInclude,
      });

      return mapRelicSetCatalogRow(relicSet);
    } catch (error) {
      handlePrismaError(error, 'RelicSet');
    }
  }

  private async findMany(query: ListRelicSetsQueryDto, publishedOnly: boolean) {
    const limit = query.limit ?? 20;
    const rows = await this.prisma.relicSet.findMany({
      where: {
        ...(query.cursor ? { id: { gt: query.cursor } } : {}),
        ...(publishedOnly ? { status: CatalogStatus.PUBLISHED } : {}),
        ...(query.type ? { type: query.type } : {}),
      },
      include: relicSetCatalogInclude,
      orderBy: { id: 'asc' },
      take: limit + 1,
    });

    return paginateByCursor(
      rows.map((row) => mapRelicSetCatalogRow(row)),
      limit,
    );
  }

  private async resolveUniqueSlug(value: string) {
    return generateUniqueSlug(value, async (slug) => {
      const existing = await this.prisma.relicSet.findUnique({
        where: { slug },
        select: { id: true },
      });

      return Boolean(existing);
    });
  }
}
