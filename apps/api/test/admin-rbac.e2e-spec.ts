import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  deleteTestUser,
  registerAdminAndLogin,
  registerAndLogin,
  TestSession,
} from './helpers/auth.helper';

const PROTECTED_GET_ROUTES = [
  '/admin/dashboard/summary',
  '/admin/users',
  '/admin/characters',
  '/admin/light-cones',
  '/admin/relic-sets',
];

describe('Admin RBAC (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const httpApp = () => app.getHttpAdapter().getInstance() as App;

  let admin: TestSession;
  let standardUser: TestSession;

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

    admin = await registerAdminAndLogin(httpApp, prisma, 'rbac-admin');
    standardUser = await registerAndLogin(httpApp, 'rbac-user');
  });

  afterAll(async () => {
    await deleteTestUser(prisma, admin?.userId);
    await deleteTestUser(prisma, standardUser?.userId);
    await app.close();
  });

  it.each(PROTECTED_GET_ROUTES)(
    'blocks %s for a USER with 403',
    async (route) => {
      await request(httpApp())
        .get(route)
        .set('Authorization', `Bearer ${standardUser.accessToken}`)
        .expect(403);
    },
  );

  it.each(PROTECTED_GET_ROUTES)('blocks %s with no token (401)', async (route) => {
    await request(httpApp()).get(route).expect(401);
  });

  it.each(PROTECTED_GET_ROUTES)('allows %s for an ADMIN', async (route) => {
    await request(httpApp())
      .get(route)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
  });

  it('keeps public catalog reads open without auth', async () => {
    await request(httpApp()).get('/characters').expect(200);
    await request(httpApp()).get('/light-cones').expect(200);
  });

  it('does not expose write access to public catalog routes', async () => {
    // The public catalog controllers only ever map GET routes; POST/PATCH/DELETE
    // simply don't exist outside /admin/*, so they 404 instead of 405 — this
    // pins that catalog writes stay admin-only.
    await request(httpApp())
      .post('/characters')
      .send({ name: 'Should not be creatable here' })
      .expect(404);
  });

  it('rejects a USER changing another user role/status via /admin/users', async () => {
    await request(httpApp())
      .patch(`/admin/users/${admin.userId}/role`)
      .set('Authorization', `Bearer ${standardUser.accessToken}`)
      .send({ role: 'USER' })
      .expect(403);
  });
});
