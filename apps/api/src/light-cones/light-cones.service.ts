import { Injectable, NotFoundException } from '@nestjs/common';
import { paginateByCursor } from '../common/cursor-pagination';
import { CursorPaginationQueryDto } from '../common/dto/cursor-pagination-query.dto';
import { handlePrismaError } from '../common/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLightConeDto } from './dto/create-light-cone.dto';
import { UpdateLightConeDto } from './dto/update-light-cone.dto';

@Injectable()
export class LightConesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLightConeDto) {
    try {
      return await this.prisma.lightCone.create({ data: dto });
    } catch (error) {
      handlePrismaError(error, 'LightCone');
    }
  }

  async findAll(query: CursorPaginationQueryDto) {
    const limit = query.limit ?? 20;
    const rows = await this.prisma.lightCone.findMany({
      where: query.cursor ? { id: { gt: query.cursor } } : undefined,
      orderBy: { id: 'asc' },
      take: limit + 1,
    });

    return paginateByCursor(rows, limit);
  }

  async findOne(id: number) {
    const lightCone = await this.prisma.lightCone.findUnique({ where: { id } });

    if (!lightCone) {
      throw new NotFoundException('LightCone not found');
    }

    return lightCone;
  }

  async update(id: number, dto: UpdateLightConeDto) {
    try {
      return await this.prisma.lightCone.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      handlePrismaError(error, 'LightCone');
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.lightCone.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      handlePrismaError(error, 'LightCone');
    }
  }
}
