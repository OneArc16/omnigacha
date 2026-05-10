import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export function handlePrismaError(error: unknown, resource: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new ConflictException(`${resource} already exists`);
    }

    if (error.code === 'P2025') {
      throw new NotFoundException(`${resource} not found`);
    }
  }

  throw error;
}
