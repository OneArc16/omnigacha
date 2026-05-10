import { Injectable, NotFoundException } from '@nestjs/common';
import { paginateByCursor } from '../common/cursor-pagination';
import { CursorPaginationQueryDto } from '../common/dto/cursor-pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { handlePrismaError } from '../common/prisma-errors';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';

@Injectable()
export class CharactersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCharacterDto) {
    try {
      return await this.prisma.character.create({ data: dto });
    } catch (error) {
      handlePrismaError(error, 'Character');
    }
  }

  async findAll(query: CursorPaginationQueryDto) {
    const limit = query.limit ?? 20;
    const rows = await this.prisma.character.findMany({
      where: query.cursor ? { id: { gt: query.cursor } } : undefined,
      orderBy: { id: 'asc' },
      take: limit + 1,
    });

    return paginateByCursor(rows, limit);
  }

  async findOne(id: number) {
    const character = await this.prisma.character.findUnique({ where: { id } });
    if (!character) {
      throw new NotFoundException('Character not found');
    }
    return character;
  }

  async update(id: number, dto: UpdateCharacterDto) {
    try {
      return await this.prisma.character.update({ where: { id }, data: dto });
    } catch (error) {
      handlePrismaError(error, 'Character');
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.character.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      handlePrismaError(error, 'Character');
    }
  }
}
