import type { UserRole } from '@prisma/client';

export type JwtPayload = {
  sub: number;
  email: string;
  role: UserRole;
};
