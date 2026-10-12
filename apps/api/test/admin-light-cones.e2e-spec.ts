import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { deleteTestUser, registerAdminAndLogin, TestSession } from './helpers/auth.helper';
import { NOT_AN_IMAGE, ONE_PIXEL_PNG } from './helpers/media-fixtures';

type LightConeRecord = {
  id: number;
  name: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  splashArtAssetId: number | null;
  splashArtUrl: string | null;
};

describe('Admin light cones CRUD + media (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const httpApp = () => app.getHttpAdapter().getInstance() as App;

  let admin: TestSession;
  const runId = randomUUID().slice(0, 8);
  let lightConeId: number | null = null;

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
    admin = await registerAdminAndLogin(httpApp, prisma, 'light-cones-admin');
  });

  afterAll(async () => {
    if (lightConeId) {
      await prisma.lightCone.delete({ where: { id: lightConeId } }).catch(() => undefined);
    }
    await deleteTestUser(prisma, admin?.userId);
    await app.close();
  });

  it('creates a light cone as DRAFT', async () => {
    const response = await request(httpApp())
      .post('/admin/light-cones')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        name: `E2E Admin Light Cone ${runId}`,
        path: 'Destruction',
        rarity: 5,
        status: 'DRAFT',
      })
      .expect(201);

    const lightCone = response.body as LightConeRecord;
    lightConeId = lightCone.id;
    expect(lightCone.status).toBe('DRAFT');
    expect(lightCone.splashArtAssetId).toBeNull();
  });

  it('rejects a duplicate light cone name (409)', async () => {
    await request(httpApp())
      .post('/admin/light-cones')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        name: `E2E Admin Light Cone ${runId}`,
        path: 'Destruction',
        rarity: 5,
      })
      .expect(409);
  });

  it('publishes the light cone via PATCH', async () => {
    const response = await request(httpApp())
      .patch(`/admin/light-cones/${lightConeId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'PUBLISHED', effectDescription: 'Boosts ATK by 24%.' })
      .expect(200);

    const updated = response.body as LightConeRecord & { effectDescription?: string };
    expect(updated.status).toBe('PUBLISHED');
    expect(updated.effectDescription).toBe('Boosts ATK by 24%.');
  });

  it('rejects a non-image splash-art upload (400)', async () => {
    await request(httpApp())
      .post(`/admin/light-cones/${lightConeId}/splash-art`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .attach('file', NOT_AN_IMAGE, 'not-an-image.txt')
      .expect(400);
  });

  it('uploads and removes splash art', async () => {
    const uploadResponse = await request(httpApp())
      .post(`/admin/light-cones/${lightConeId}/splash-art`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .attach('file', ONE_PIXEL_PNG, 'pixel.png')
      .expect(201);

    expect((uploadResponse.body as LightConeRecord).splashArtAssetId).toEqual(
      expect.any(Number),
    );

    const removeResponse = await request(httpApp())
      .delete(`/admin/light-cones/${lightConeId}/splash-art`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    expect((removeResponse.body as LightConeRecord).splashArtAssetId).toBeNull();
  });

  it('archives the light cone via DELETE instead of hard-deleting it', async () => {
    const response = await request(httpApp())
      .delete(`/admin/light-cones/${lightConeId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    expect((response.body as LightConeRecord).status).toBe('ARCHIVED');

    const stillExists = await prisma.lightCone.findUnique({
      where: { id: lightConeId! },
    });
    expect(stillExists).not.toBeNull();
  });
});
