import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';
import { paginateByCursor } from '../common/cursor-pagination';
import { CursorPaginationQueryDto } from '../common/dto/cursor-pagination-query.dto';
import { handlePrismaError } from '../common/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const USER_SUMMARY_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  mustChangePassword: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    try {
      return await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email.toLowerCase(),
          passwordHash: await this.hashPasswordAsync(dto.password),
          role: dto.role ?? UserRole.USER,
          isActive: dto.isActive ?? true,
          mustChangePassword: dto.mustChangePassword ?? false,
        },
        select: USER_SUMMARY_SELECT,
      });
    } catch (error) {
      handlePrismaError(error, 'User');
    }
  }

  async findAll(query: CursorPaginationQueryDto) {
    const limit = query.limit ?? 20;
    const rows = await this.prisma.user.findMany({
      where: query.cursor ? { id: { gt: query.cursor } } : undefined,
      select: USER_SUMMARY_SELECT,
      orderBy: { id: 'asc' },
      take: limit + 1,
    });

    return paginateByCursor(rows, limit);
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SUMMARY_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    const current = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!current) {
      throw new NotFoundException('User not found');
    }

    await this.preventLockingLastAdmin(id, current.role, current.isActive, dto);

    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          ...(dto.name ? { name: dto.name } : {}),
          ...(dto.email ? { email: dto.email.toLowerCase() } : {}),
          ...(dto.password
            ? { passwordHash: await this.hashPasswordAsync(dto.password) }
            : {}),
          ...(dto.role ? { role: dto.role } : {}),
          ...(typeof dto.isActive === 'boolean'
            ? { isActive: dto.isActive }
            : {}),
          ...(typeof dto.mustChangePassword === 'boolean'
            ? { mustChangePassword: dto.mustChangePassword }
            : {}),
        },
        select: USER_SUMMARY_SELECT,
      });
    } catch (error) {
      handlePrismaError(error, 'User');
    }
  }

  async setRole(id: number, role: UserRole) {
    return this.update(id, { role });
  }

  async setStatus(id: number, isActive: boolean) {
    return this.update(id, { isActive });
  }

  private async preventLockingLastAdmin(
    userId: number,
    currentRole: UserRole,
    currentIsActive: boolean,
    dto: UpdateUserDto,
  ) {
    const nextRole = dto.role ?? currentRole;
    const nextIsActive =
      typeof dto.isActive === 'boolean' ? dto.isActive : currentIsActive;

    const isDemotingAdmin =
      currentRole === UserRole.ADMIN &&
      currentIsActive &&
      (nextRole !== UserRole.ADMIN || !nextIsActive);

    if (!isDemotingAdmin) {
      return;
    }

    const activeAdminCount = await this.prisma.user.count({
      where: {
        role: UserRole.ADMIN,
        isActive: true,
        NOT: { id: userId },
      },
    });

    if (activeAdminCount === 0) {
      throw new BadRequestException('At least one active admin must remain');
    }
  }

  private async hashPasswordAsync(password: string): Promise<string> {
    return hash(password, 12);
  }
}
