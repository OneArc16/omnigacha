import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { deleteTestUser, registerAdminAndLogin, TestSession } from './helpers/auth.helper';
import { NOT_AN_IMAGE, ONE_PIXEL_PNG } from './helpers/media-fixtures';

type CharacterRecord = {
  id: number;
  name: string;
  slug: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  splashArtAssetId: number | null;
  splashArtUrl: string | null;
  portraitAssetId: number | null;
  portraitUrl: string | null;
};

describe('Admin characters CRUD + media (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const httpApp = () => app.getHttpAdapter().getInstance() as App;

  let admin: TestSession;
  const runId = randomUUID().slice(0, 8);
  let characterId: number | null = null;

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
    admin = await registerAdminAndLogin(httpApp, prisma, 'characters-admin');
  });

  afterAll(async () => {
    if (characterId) {
      await prisma.character.delete({ where: { id: characterId } }).catch(() => undefined);
    }
    await deleteTestUser(prisma, admin?.userId);
    await app.close();
  });

  it('creates a character as DRAFT', async () => {
    const response = await request(httpApp())
      .post('/admin/characters')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        name: `E2E Admin Character ${runId}`,
        element: 'Fire',
        path: 'Destruction',
        role: 'DPS',
        baseHp: 1000,
        baseAtk: 600,
        baseDef: 400,
        baseCritRate: 0.05,
        baseCritDamage: 0.5,
        baseSpeed: 100,
        rarity: 5,
        status: 'DRAFT',
      })
      .expect(201);

    const character = response.body as CharacterRecord;
    characterId = character.id;
    expect(character.status).toBe('DRAFT');
    expect(character.splashArtAssetId).toBeNull();
  });

  it('rejects a duplicate character name (409)', async () => {
    await request(httpApp())
      .post('/admin/characters')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        name: `E2E Admin Character ${runId}`,
        element: 'Fire',
        path: 'Destruction',
        role: 'DPS',
        baseAtk: 600,
        baseCritRate: 0.05,
        baseCritDamage: 0.5,
        baseSpeed: 100,
        rarity: 5,
      })
      .expect(409);
  });

  it('publishes the character via PATCH', async () => {
    const response = await request(httpApp())
      .patch(`/admin/characters/${characterId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'PUBLISHED' })
      .expect(200);

    expect((response.body as CharacterRecord).status).toBe('PUBLISHED');
  });

  it('rejects a non-image splash-art upload (400)', async () => {
    await request(httpApp())
      .post(`/admin/characters/${characterId}/splash-art`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .attach('file', NOT_AN_IMAGE, 'not-an-image.txt')
      .expect(400);
  });

  it('uploads and removes splash art', async () => {
    const uploadResponse = await request(httpApp())
      .post(`/admin/characters/${characterId}/splash-art`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .attach('file', ONE_PIXEL_PNG, 'pixel.png')
      .expect(201);

    const uploaded = uploadResponse.body as CharacterRecord;
    expect(uploaded.splashArtAssetId).toEqual(expect.any(Number));
    expect(uploaded.splashArtUrl).toEqual(expect.any(String));

    const removeResponse = await request(httpApp())
      .delete(`/admin/characters/${characterId}/splash-art`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    expect((removeResponse.body as CharacterRecord).splashArtAssetId).toBeNull();
  });

  it('uploads and removes the portrait independently of splash art', async () => {
    const uploadResponse = await request(httpApp())
      .post(`/admin/characters/${characterId}/portrait`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .attach('file', ONE_PIXEL_PNG, 'portrait.png')
      .expect(201);

    const uploaded = uploadResponse.body as CharacterRecord;
    expect(uploaded.portraitAssetId).toEqual(expect.any(Number));
    expect(uploaded.splashArtAssetId).toBeNull();

    const removeResponse = await request(httpApp())
      .delete(`/admin/characters/${characterId}/portrait`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    expect((removeResponse.body as CharacterRecord).portraitAssetId).toBeNull();
  });

  it('archives the character via DELETE instead of hard-deleting it', async () => {
    const response = await request(httpApp())
      .delete(`/admin/characters/${characterId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    expect((response.body as CharacterRecord).status).toBe('ARCHIVED');

    const stillExists = await prisma.character.findUnique({
      where: { id: characterId! },
    });
    expect(stillExists).not.toBeNull();
  });
});
