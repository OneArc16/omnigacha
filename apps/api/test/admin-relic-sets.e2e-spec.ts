import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { deleteTestUser, registerAdminAndLogin, TestSession } from './helpers/auth.helper';
import { ONE_PIXEL_PNG } from './helpers/media-fixtures';

type RelicSetType = 'ARTIFACT' | 'ORNAMENT';

type RelicSetRecord = {
  id: number;
  name: string;
  type: RelicSetType;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  splashArtAssetId: number | null;
};

type CursorPage<T> = { items: T[]; nextCursor: number | null };

describe('Admin relic sets CRUD + media (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const httpApp = () => app.getHttpAdapter().getInstance() as App;

  let admin: TestSession;
  const runId = randomUUID().slice(0, 8);
  const createdIds: number[] = [];

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
    admin = await registerAdminAndLogin(httpApp, prisma, 'relic-sets-admin');
  });

  afterAll(async () => {
    if (createdIds.length > 0) {
      await prisma.relicSet.deleteMany({ where: { id: { in: createdIds } } });
    }
    await deleteTestUser(prisma, admin?.userId);
    await app.close();
  });

  describe.each<RelicSetType>(['ARTIFACT', 'ORNAMENT'])('type=%s', (type) => {
    let relicSetId: number;

    it('creates a relic set of this type as DRAFT', async () => {
      const response = await request(httpApp())
        .post('/admin/relic-sets')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          name: `E2E ${type} Set ${runId}`,
          type,
          rarity: 5,
          twoPieceBonus: 'ATK +12%',
          status: 'DRAFT',
        })
        .expect(201);

      const relicSet = response.body as RelicSetRecord;
      relicSetId = relicSet.id;
      createdIds.push(relicSetId);
      expect(relicSet.type).toBe(type);
      expect(relicSet.status).toBe('DRAFT');
    });

    it('rejects a duplicate name for this type (409)', async () => {
      await request(httpApp())
        .post('/admin/relic-sets')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          name: `E2E ${type} Set ${runId}`,
          type,
          rarity: 5,
          twoPieceBonus: 'ATK +12%',
        })
        .expect(409);
    });

    it('publishes it via PATCH', async () => {
      const response = await request(httpApp())
        .patch(`/admin/relic-sets/${relicSetId}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ status: 'PUBLISHED' })
        .expect(200);

      expect((response.body as RelicSetRecord).status).toBe('PUBLISHED');
    });

    it('uploads and removes splash art', async () => {
      const uploadResponse = await request(httpApp())
        .post(`/admin/relic-sets/${relicSetId}/splash-art`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .attach('file', ONE_PIXEL_PNG, 'pixel.png')
        .expect(201);

      expect((uploadResponse.body as RelicSetRecord).splashArtAssetId).toEqual(
        expect.any(Number),
      );

      const removeResponse = await request(httpApp())
        .delete(`/admin/relic-sets/${relicSetId}/splash-art`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(200);

      expect((removeResponse.body as RelicSetRecord).splashArtAssetId).toBeNull();
    });

    it('archives it via DELETE instead of hard-deleting it', async () => {
      const response = await request(httpApp())
        .delete(`/admin/relic-sets/${relicSetId}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(200);

      expect((response.body as RelicSetRecord).status).toBe('ARCHIVED');

      const stillExists = await prisma.relicSet.findUnique({
        where: { id: relicSetId },
      });
      expect(stillExists).not.toBeNull();
    });
  });

  it('filters the list by ?type= so artifacts and ornaments stay separate', async () => {
    const artifactResponse = await request(httpApp())
      .post('/admin/relic-sets')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        name: `E2E Filter Artifact ${runId}`,
        type: 'ARTIFACT',
        rarity: 5,
        twoPieceBonus: 'DEF +12%',
      })
      .expect(201);

    const ornamentResponse = await request(httpApp())
      .post('/admin/relic-sets')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        name: `E2E Filter Ornament ${runId}`,
        type: 'ORNAMENT',
        rarity: 5,
        twoPieceBonus: 'SPD +6%',
      })
      .expect(201);

    const artifactId = (artifactResponse.body as RelicSetRecord).id;
    const ornamentId = (ornamentResponse.body as RelicSetRecord).id;
    createdIds.push(artifactId, ornamentId);

    const artifactPage = await request(httpApp())
      .get('/admin/relic-sets?type=ARTIFACT&limit=100')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    const artifactIds = (artifactPage.body as CursorPage<RelicSetRecord>).items.map(
      (item) => item.id,
    );
    expect(artifactIds).toContain(artifactId);
    expect(artifactIds).not.toContain(ornamentId);

    const ornamentPage = await request(httpApp())
      .get('/admin/relic-sets?type=ORNAMENT&limit=100')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    const ornamentIds = (ornamentPage.body as CursorPage<RelicSetRecord>).items.map(
      (item) => item.id,
    );
    expect(ornamentIds).toContain(ornamentId);
    expect(ornamentIds).not.toContain(artifactId);
  });

  it('rejects an invalid ?type= value (400)', async () => {
    await request(httpApp())
      .get('/admin/relic-sets?type=NOT_A_TYPE')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(400);
  });
});
