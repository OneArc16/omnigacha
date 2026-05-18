import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  user: {
    id: number;
    name: string;
    email: string;
  };
};

type CursorPage<T> = {
  items: T[];
  nextCursor: number | null;
};

type UserCharacterResponse = {
  id: number;
  character: {
    id: number;
  };
  atk: number;
  speed: number;
};

type RecommendationResponse = {
  recommendation: {
    id: number;
    score: number;
  };
  context: {
    targetCharacter: {
      id: number;
    };
  };
};

type RecommendationDetailResponse = {
  id: number;
  userId: number;
};

type SimulationResponse = {
  id: number;
  type: 'damage_scenario';
  label?: string;
  character: {
    id: number;
  };
  payload?: {
    type?: 'damage_scenario' | 'recommendation';
  };
  teamContext: unknown;
  summary: string;
  userId?: number;
};

type DashboardSummaryResponse = {
  totalCharacters: number;
  totalRecommendations: number;
  totalSimulations: number;
  lastRecommendation: {
    characterName: string;
    recommendation: string;
    score: number;
  } | null;
};

describe('Phase 18 MVP flow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const httpApp = () => app.getHttpAdapter().getInstance() as App;

  const runId = randomUUID().slice(0, 8);
  const email = `phase18_${runId}@omnigacha.dev`;
  const password = 'Phase18Pass_1234';
  const name = 'Phase18 Tester';

  let userId: number | null = null;
  let accessToken = '';
  let refreshToken = '';

  let ownedCharacterAId = 0;
  let ownedCharacterBId = 0;
  let targetCharacterId = 0;
  let userCharacterAId = 0;
  let recommendationId = 0;
  let simulationId = 0;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    const characterA = await prisma.character.upsert({
      where: { name: `E2E Kafka Analog ${runId}` },
      update: {},
      create: {
        name: `E2E Kafka Analog ${runId}`,
        element: 'LIGHTNING',
        path: 'NIHILITY',
        role: 'DPS',
        baseAtk: 3000,
        baseCritRate: 0.45,
        baseCritDamage: 1.1,
        baseSpeed: 134,
      },
    });

    const characterB = await prisma.character.upsert({
      where: { name: `E2E Ruan Analog ${runId}` },
      update: {},
      create: {
        name: `E2E Ruan Analog ${runId}`,
        element: 'ICE',
        path: 'HARMONY',
        role: 'SUPPORT',
        baseAtk: 1700,
        baseCritRate: 0.15,
        baseCritDamage: 0.6,
        baseSpeed: 142,
      },
    });

    const characterTarget = await prisma.character.upsert({
      where: { name: `E2E Acheron Analog ${runId}` },
      update: {},
      create: {
        name: `E2E Acheron Analog ${runId}`,
        element: 'LIGHTNING',
        path: 'NIHILITY',
        role: 'DPS',
        baseAtk: 3200,
        baseCritRate: 0.5,
        baseCritDamage: 1.2,
        baseSpeed: 128,
      },
    });

    await prisma.characterSynergy.upsert({
      where: {
        sourceCharacterId_targetCharacterId: {
          sourceCharacterId: characterTarget.id,
          targetCharacterId: characterA.id,
        },
      },
      update: {
        weight: 86,
        note: 'E2E synergy target->ownedA',
      },
      create: {
        sourceCharacterId: characterTarget.id,
        targetCharacterId: characterA.id,
        weight: 86,
        note: 'E2E synergy target->ownedA',
      },
    });

    await prisma.characterSynergy.upsert({
      where: {
        sourceCharacterId_targetCharacterId: {
          sourceCharacterId: characterTarget.id,
          targetCharacterId: characterB.id,
        },
      },
      update: {
        weight: 82,
        note: 'E2E synergy target->ownedB',
      },
      create: {
        sourceCharacterId: characterTarget.id,
        targetCharacterId: characterB.id,
        weight: 82,
        note: 'E2E synergy target->ownedB',
      },
    });

    ownedCharacterAId = characterA.id;
    ownedCharacterBId = characterB.id;
    targetCharacterId = characterTarget.id;
  });

  afterAll(async () => {
    if (!prisma) {
      if (app) {
        await app.close();
      }
      return;
    }

    if (userId) {
      await prisma.user
        .delete({
          where: { id: userId },
        })
        .catch(() => undefined);
    }

    await prisma.characterSynergy.deleteMany({
      where: {
        OR: [
          { sourceCharacterId: targetCharacterId },
          { targetCharacterId: targetCharacterId },
          { sourceCharacterId: ownedCharacterAId },
          { targetCharacterId: ownedCharacterAId },
          { sourceCharacterId: ownedCharacterBId },
          { targetCharacterId: ownedCharacterBId },
        ],
      },
    });

    await prisma.character.deleteMany({
      where: {
        id: {
          in: [ownedCharacterAId, ownedCharacterBId, targetCharacterId],
        },
      },
    });

    if (app) {
      await app.close();
    }
  });

  it('covers register, login, character CRUD, recommend, simulate and history', async () => {
    const registerResponse = await request(httpApp())
      .post('/auth/register')
      .send({
        name,
        email,
        password,
      })
      .expect(201);

    const registerBody = registerResponse.body as AuthResponse;
    expect(registerBody.accessToken).toEqual(expect.any(String));
    expect(registerBody.refreshToken).toEqual(expect.any(String));
    expect(registerBody.user.email).toBe(email.toLowerCase());

    userId = registerBody.user.id;
    refreshToken = registerBody.refreshToken;

    const loginResponse = await request(httpApp())
      .post('/auth/login')
      .send({
        email,
        password,
      })
      .expect(201);

    const loginBody = loginResponse.body as AuthResponse;
    accessToken = loginBody.accessToken;
    expect(accessToken).toEqual(expect.any(String));
    expect(loginBody.user.id).toBe(userId);

    const meResponse = await request(httpApp())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect((meResponse.body as { email: string }).email).toBe(
      email.toLowerCase(),
    );

    const createOwnedAResponse = await request(httpApp())
      .post('/user-characters')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        characterId: ownedCharacterAId,
        level: 80,
        eidolon: 0,
        atk: 3120,
        critRate: 0.55,
        critDamage: 1.55,
        speed: 138,
      })
      .expect(201);

    const createdA = createOwnedAResponse.body as UserCharacterResponse;
    userCharacterAId = createdA.id;
    expect(createdA.character.id).toBe(ownedCharacterAId);

    const createOwnedBResponse = await request(httpApp())
      .post('/user-characters')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        characterId: ownedCharacterBId,
        level: 80,
        eidolon: 0,
        atk: 1800,
        critRate: 0.2,
        critDamage: 0.9,
        speed: 144,
      })
      .expect(201);

    const createdB = createOwnedBResponse.body as UserCharacterResponse;
    expect(createdB.id).toBeGreaterThan(0);
    expect(createdB.character.id).toBe(ownedCharacterBId);

    const updateOwnedAResponse = await request(httpApp())
      .patch(`/user-characters/${userCharacterAId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        atk: 3250,
        speed: 142,
      })
      .expect(200);

    const updatedA = updateOwnedAResponse.body as UserCharacterResponse;
    expect(updatedA.atk).toBe(3250);
    expect(updatedA.speed).toBe(142);

    const recommendResponse = await request(httpApp())
      .post('/simulations/recommend')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        targetCharacterId,
      })
      .expect(201);

    const recommendation = recommendResponse.body as RecommendationResponse;
    recommendationId = recommendation.recommendation.id;
    expect(recommendation.recommendation.score).toEqual(expect.any(Number));
    expect(recommendation.context.targetCharacter.id).toBe(targetCharacterId);

    const recommendationDetailResponse = await request(httpApp())
      .get(`/simulations/recommendations/${recommendationId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const recommendationDetail =
      recommendationDetailResponse.body as RecommendationDetailResponse;
    expect(recommendationDetail.id).toBe(recommendationId);
    expect(recommendationDetail.userId).toBe(userId);

    const simulateResponse = await request(httpApp())
      .post('/simulations/damage')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        characterId: ownedCharacterAId,
        atkDelta: 250,
        critRateDelta: 8,
        critDamageDelta: 20,
        speedDelta: 6,
        teammateCharacterIds: [ownedCharacterBId],
      })
      .expect(201);

    const simulation = simulateResponse.body as SimulationResponse;
    expect(simulation.type).toBe('damage_scenario');
    expect(simulation.character.id).toBe(ownedCharacterAId);
    expect(simulation.teamContext).toBeDefined();
    expect(simulation.summary).toEqual(expect.any(String));

    const historyListResponse = await request(httpApp())
      .get('/simulations/history?limit=10')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const historyPage =
      historyListResponse.body as CursorPage<SimulationResponse>;
    expect(historyPage.items).toEqual(expect.any(Array));
    expect(historyPage.items.length).toBeGreaterThan(0);

    const damageHistoryEntry = historyPage.items.find(
      (item) =>
        item.payload?.type === 'damage_scenario' ||
        item.label?.startsWith('damage-sim-'),
    );

    expect(damageHistoryEntry).toBeDefined();
    simulationId = damageHistoryEntry?.id ?? 0;

    const historyDetailResponse = await request(httpApp())
      .get(`/simulations/history/${simulationId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const historyDetail = historyDetailResponse.body as SimulationResponse;
    expect(historyDetail.id).toBe(simulationId);
    expect(historyDetail.userId).toBe(userId ?? 0);

    const recommendationsListResponse = await request(httpApp())
      .get('/simulations/recommendations?limit=10')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const recommendationsPage =
      recommendationsListResponse.body as CursorPage<RecommendationDetailResponse>;
    expect(recommendationsPage.items.length).toBeGreaterThan(0);

    const dashboardSummaryResponse = await request(httpApp())
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const dashboardSummary =
      dashboardSummaryResponse.body as DashboardSummaryResponse;
    expect(dashboardSummary.totalCharacters).toBe(2);
    expect(dashboardSummary.totalRecommendations).toBe(1);
    expect(dashboardSummary.totalSimulations).toBeGreaterThanOrEqual(2);
    expect(dashboardSummary.lastRecommendation).not.toBeNull();

    await request(httpApp())
      .post('/auth/logout')
      .send({ refreshToken })
      .expect(201);
  });
});
