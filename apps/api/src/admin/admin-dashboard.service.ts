import { Injectable } from '@nestjs/common';
import { CatalogStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [
      totalUsers,
      totalActiveAdmins,
      totalCharacters,
      draftCharacters,
      totalLightCones,
      draftLightCones,
      totalRelicSets,
      draftRelicSets,
      totalMediaAssets,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: { role: UserRole.ADMIN, isActive: true },
      }),
      this.prisma.character.count(),
      this.prisma.character.count({
        where: { status: CatalogStatus.DRAFT },
      }),
      this.prisma.lightCone.count(),
      this.prisma.lightCone.count({
        where: { status: CatalogStatus.DRAFT },
      }),
      this.prisma.relicSet.count(),
      this.prisma.relicSet.count({
        where: { status: CatalogStatus.DRAFT },
      }),
      this.prisma.mediaAsset.count(),
    ]);

    return {
      totalUsers,
      totalActiveAdmins,
      totalCharacters,
      draftCharacters,
      totalLightCones,
      draftLightCones,
      totalRelicSets,
      draftRelicSets,
      totalMediaAssets,
    };
  }
}
