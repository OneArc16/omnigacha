import { Injectable, NotFoundException } from '@nestjs/common';
import { CatalogStatus } from '@prisma/client';
import { paginateByCursor } from '../common/cursor-pagination';
import { CursorPaginationQueryDto } from '../common/dto/cursor-pagination-query.dto';
import { generateUniqueSlug } from '../common/slug';
import { handlePrismaError } from '../common/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLightConeDto } from './dto/create-light-cone.dto';
import { UpdateLightConeDto } from './dto/update-light-cone.dto';
import {
  lightConeCatalogInclude,
  mapLightConeCatalogRow,
} from './light-cone-presenter';

type LightConeWriteDefaults = {
  name: string;
  slug: string;
  path: string;
  rarity: number;
  effectDescription: string | null;
  status: CatalogStatus;
  splashArtAssetId: number | null;
};

function buildLightConeWriteData(
  dto: Partial<CreateLightConeDto>,
  current: LightConeWriteDefaults,
) {
  return {
    name: dto.name ?? current.name,
    slug: dto.slug ?? current.slug,
    path: dto.path ?? current.path,
    rarity: dto.rarity ?? current.rarity,
    effectDescription:
      dto.effectDescription === undefined
        ? current.effectDescription
        : dto.effectDescription,
    status: dto.status ?? current.status,
    splashArtAssetId:
      dto.splashArtAssetId === undefined
        ? current.splashArtAssetId
        : dto.splashArtAssetId,
  };
}

@Injectable()
export class LightConesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLightConeDto) {
    try {
      const slug = await this.resolveUniqueSlug(dto.slug ?? dto.name);
      const lightCone = await this.prisma.lightCone.create({
        data: buildLightConeWriteData(dto, {
          name: dto.name,
          slug,
          path: dto.path,
          rarity: dto.rarity,
          effectDescription: dto.effectDescription ?? null,
          status: dto.status ?? CatalogStatus.DRAFT,
          splashArtAssetId: dto.splashArtAssetId ?? null,
        }),
        include: lightConeCatalogInclude,
      });

      return mapLightConeCatalogRow(lightCone);
    } catch (error) {
      handlePrismaError(error, 'LightCone');
    }
  }

  async findAll(query: CursorPaginationQueryDto) {
    return this.findMany(query, true);
  }

  async findAllAdmin(query: CursorPaginationQueryDto) {
    return this.findMany(query, false);
  }

  async findOne(id: number) {
    const lightCone = await this.prisma.lightCone.findFirst({
      where: { id, status: CatalogStatus.PUBLISHED },
      include: lightConeCatalogInclude,
    });

    if (!lightCone) {
      throw new NotFoundException('LightCone not found');
    }

    return mapLightConeCatalogRow(lightCone);
  }

  async findOneAdmin(id: number) {
    const lightCone = await this.prisma.lightCone.findUnique({
      where: { id },
      include: lightConeCatalogInclude,
    });

    if (!lightCone) {
      throw new NotFoundException('LightCone not found');
    }

    return mapLightConeCatalogRow(lightCone);
  }

  async update(id: number, dto: UpdateLightConeDto) {
    try {
      const current = await this.prisma.lightCone.findUnique({
        where: { id },
        select: {
          name: true,
          slug: true,
          path: true,
          rarity: true,
          effectDescription: true,
          status: true,
          splashArtAssetId: true,
        },
      });

      if (!current) {
        throw new NotFoundException('LightCone not found');
      }

      const nextSlug =
        dto.slug && dto.slug !== current.slug
          ? await this.resolveUniqueSlug(dto.slug)
          : current.slug;

      const lightCone = await this.prisma.lightCone.update({
        where: { id },
        data: buildLightConeWriteData(dto, {
          name: current.name,
          slug: nextSlug,
          path: current.path,
          rarity: current.rarity,
          effectDescription: current.effectDescription,
          status: dto.status ?? current.status,
          splashArtAssetId: current.splashArtAssetId,
        }),
        include: lightConeCatalogInclude,
      });

      return mapLightConeCatalogRow(lightCone);
    } catch (error) {
      handlePrismaError(error, 'LightCone');
    }
  }

  async archive(id: number) {
    try {
      const lightCone = await this.prisma.lightCone.update({
        where: { id },
        data: { status: CatalogStatus.ARCHIVED },
        include: lightConeCatalogInclude,
      });

      return mapLightConeCatalogRow(lightCone);
    } catch (error) {
      handlePrismaError(error, 'LightCone');
    }
  }

  private async findMany(
    query: CursorPaginationQueryDto,
    publishedOnly: boolean,
  ) {
    const limit = query.limit ?? 20;
    const rows = await this.prisma.lightCone.findMany({
      where: {
        ...(query.cursor ? { id: { gt: query.cursor } } : {}),
        ...(publishedOnly ? { status: CatalogStatus.PUBLISHED } : {}),
      },
      include: lightConeCatalogInclude,
      orderBy: { id: 'asc' },
      take: limit + 1,
    });

    return paginateByCursor(
      rows.map((row) => mapLightConeCatalogRow(row)),
      limit,
    );
  }

  private async resolveUniqueSlug(value: string) {
    return generateUniqueSlug(value, async (slug) => {
      const existing = await this.prisma.lightCone.findUnique({
        where: { slug },
        select: { id: true },
      });

      return Boolean(existing);
    });
  }
}
