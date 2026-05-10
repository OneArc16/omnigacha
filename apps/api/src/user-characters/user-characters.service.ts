import { Injectable, NotFoundException } from '@nestjs/common';
import { paginateByCursor } from '../common/cursor-pagination';
import { CursorPaginationQueryDto } from '../common/dto/cursor-pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { handlePrismaError } from '../common/prisma-errors';
import { CreateUserCharacterDto } from './dto/create-user-character.dto';
import { UpdateUserCharacterDto } from './dto/update-user-character.dto';

@Injectable()
export class UserCharactersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateUserCharacterDto) {
    try {
      return await this.prisma.userCharacter.create({
        data: { ...dto, userId },
      });
    } catch (error) {
      handlePrismaError(error, 'UserCharacter');
    }
  }

  async findAll(userId: number, query: CursorPaginationQueryDto) {
    const limit = query.limit ?? 20;
    const rows = await this.prisma.userCharacter.findMany({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        character: { select: { id: true, name: true, element: true, path: true, role: true } },
      },
      orderBy: { id: 'asc' },
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      take: limit + 1,
    });

    return paginateByCursor(rows, limit);
  }

  async findOne(userId: number, id: number) {
    const record = await this.prisma.userCharacter.findFirst({
      where: { id, userId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        character: { select: { id: true, name: true, element: true, path: true, role: true } },
      },
    });

    if (!record) {
      throw new NotFoundException('UserCharacter not found');
    }

    return record;
  }

  async update(userId: number, id: number, dto: UpdateUserCharacterDto) {
    try {
      await this.findOne(userId, id);
      return await this.prisma.userCharacter.update({
        where: { id },
        data: dto,
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
}
