import {
  CanActivate,
  ExecutionContext,
  INestApplication,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { SimulationsController } from '../src/simulations/simulations.controller';
import { SimulationsService } from '../src/simulations/simulations.service';

class TestJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    request.user = {
      sub: 42,
      email: 'test@omnigacha.dev',
    };
    return true;
  }
}

describe('Simulations detail routes (e2e)', () => {
  let app: INestApplication<App>;

  const simulationsServiceMock = {
    listRecommendations: jest.fn(),
    findRecommendationById: jest.fn(),
    listHistory: jest.fn(),
    findHistoryById: jest.fn(),
    recommend: jest.fn(),
    simulateDamage: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SimulationsController],
      providers: [
        {
          provide: SimulationsService,
          useValue: simulationsServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestJwtGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  it('GET /simulations/recommendations calls listRecommendations with current user', async () => {
    simulationsServiceMock.listRecommendations.mockResolvedValue({
      items: [
        {
          id: 100,
          userId: 42,
          targetCharacter: 'Kafka',
          score: 81,
          level: 'RECOMENDADO',
          explanation: 'Detalle de prueba',
          estimatedDeltaDmg: 25.5,
          compatibleTeams: 3,
          createdAt: new Date().toISOString(),
        },
      ],
      nextCursor: null,
    });

    await request(app.getHttpServer())
      .get('/simulations/recommendations?limit=5')
      .expect(200);

    expect(simulationsServiceMock.listRecommendations).toHaveBeenCalledWith(
      42,
      expect.any(Object),
    );
  });

  it('GET /simulations/recommendations/:id returns recommendation detail', async () => {
    simulationsServiceMock.findRecommendationById.mockResolvedValue({
      id: 101,
      userId: 42,
      targetCharacter: 'Acheron',
      score: 90,
      level: 'MUY_RECOMENDADO',
      explanation: 'Muy buena mejora',
      estimatedDeltaDmg: 32.1,
      compatibleTeams: 4,
      createdAt: new Date().toISOString(),
    });

    const response = await request(app.getHttpServer())
      .get('/simulations/recommendations/101')
      .expect(200);

    expect(response.body.id).toBe(101);
    expect(simulationsServiceMock.findRecommendationById).toHaveBeenCalledWith(
      42,
      101,
    );
  });

  it('GET /simulations/history/:id returns simulation detail', async () => {
    simulationsServiceMock.findHistoryById.mockResolvedValue({
      id: 77,
      userId: 42,
      label: 'damage-sim-Kafka',
      payload: {
        type: 'damage_scenario',
        characterName: 'Kafka',
        deltaPercent: 12.34,
      },
      createdAt: new Date().toISOString(),
    });

    const response = await request(app.getHttpServer())
      .get('/simulations/history/77')
      .expect(200);

    expect(response.body.id).toBe(77);
    expect(response.body.payload.type).toBe('damage_scenario');
    expect(simulationsServiceMock.findHistoryById).toHaveBeenCalledWith(42, 77);
  });
});
