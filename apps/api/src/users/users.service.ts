import { Injectable, NotFoundException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { paginateByCursor } from '../common/cursor-pagination';
import { CursorPaginationQueryDto } from '../common/dto/cursor-pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { handlePrismaError } from '../common/prisma-errors';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    try {
      return await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          passwordHash: await this.hashPasswordAsync(dto.password),
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      handlePrismaError(error, 'User');
    }
  }

  async findAll(query: CursorPaginationQueryDto) {
    const limit = query.limit ?? 20;
    const rows = await this.prisma.user.findMany({
      where: query.cursor ? { id: { gt: query.cursor } } : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { id: 'asc' },
      take: limit + 1,
    });

    return paginateByCursor(rows, limit);
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          ...(dto.name ? { name: dto.name } : {}),
          ...(dto.email ? { email: dto.email } : {}),
          ...(dto.password
            ? { passwordHash: await this.hashPasswordAsync(dto.password) }
            : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      handlePrismaError(error, 'User');
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.user.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      handlePrismaError(error, 'User');
    }
  }

  private async hashPasswordAsync(password: string): Promise<string> {
    return hash(password, 12);
  }
}
