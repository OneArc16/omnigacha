import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: number) {
    const [
      totalCharacters,
      totalRecommendations,
      totalSimulations,
      lastRecommendation,
    ] = await this.prisma.$transaction([
      this.prisma.userCharacter.count({ where: { userId } }),
      this.prisma.recommendation.count({ where: { userId } }),
      this.prisma.simulation.count({ where: { userId } }),
      this.prisma.recommendation.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          targetCharacter: true,
          level: true,
          score: true,
        },
      }),
    ]);

    return {
      totalCharacters,
      totalRecommendations,
      totalSimulations,
      lastRecommendation: lastRecommendation
        ? {
            characterName: lastRecommendation.targetCharacter,
            recommendation: lastRecommendation.level,
            score: lastRecommendation.score,
          }
        : null,
    };
  }
}
