import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { deleteTestUser, registerAdminAndLogin, TestSession } from './helpers/auth.helper';

type AdminUserRecord = {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  mustChangePassword: boolean;
};

type CursorPage<T> = { items: T[]; nextCursor: number | null };

describe('Admin users CRUD (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const httpApp = () => app.getHttpAdapter().getInstance() as App;

  let admin: TestSession;
  let createdUserId: number | null = null;

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

    admin = await registerAdminAndLogin(httpApp, prisma, 'users-admin');
  });

  afterAll(async () => {
    await deleteTestUser(prisma, createdUserId);
    await deleteTestUser(prisma, admin?.userId);
    await app.close();
  });

  it('creates, lists, fetches, updates, (de)activates and changes role of a user', async () => {
    const email = `admin-managed_${randomUUID().slice(0, 8)}@omnigacha.dev`;

    const createResponse = await request(httpApp())
      .post('/admin/users')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Managed User', email, password: 'ManagedPass_1234' })
      .expect(201);

    const created = createResponse.body as AdminUserRecord;
    createdUserId = created.id;
    expect(created.email).toBe(email.toLowerCase());
    expect(created.role).toBe('USER');
    expect(created).not.toHaveProperty('passwordHash');

    const listResponse = await request(httpApp())
      .get('/admin/users?limit=100')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    const page = listResponse.body as CursorPage<AdminUserRecord>;
    expect(page.items.some((user) => user.id === created.id)).toBe(true);

    const getOneResponse = await request(httpApp())
      .get(`/admin/users/${created.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    expect((getOneResponse.body as AdminUserRecord).email).toBe(email.toLowerCase());

    const patchResponse = await request(httpApp())
      .patch(`/admin/users/${created.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Managed User Renamed' })
      .expect(200);
    expect((patchResponse.body as AdminUserRecord).name).toBe('Managed User Renamed');

    const deactivateResponse = await request(httpApp())
      .patch(`/admin/users/${created.id}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ isActive: false })
      .expect(200);
    expect((deactivateResponse.body as AdminUserRecord).isActive).toBe(false);

    const reactivateResponse = await request(httpApp())
      .patch(`/admin/users/${created.id}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ isActive: true })
      .expect(200);
    expect((reactivateResponse.body as AdminUserRecord).isActive).toBe(true);

    const promoteResponse = await request(httpApp())
      .patch(`/admin/users/${created.id}/role`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ role: 'ADMIN' })
      .expect(200);
    expect((promoteResponse.body as AdminUserRecord).role).toBe('ADMIN');

    const demoteResponse = await request(httpApp())
      .patch(`/admin/users/${created.id}/role`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ role: 'USER' })
      .expect(200);
    expect((demoteResponse.body as AdminUserRecord).role).toBe('USER');
  });

  it('rejects creating a user with a duplicate email (409)', async () => {
    await request(httpApp())
      .post('/admin/users')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Duplicate', email: admin.email, password: 'SomePass_1234' })
      .expect(409);
  });

  it('rejects a password shorter than the minimum length (400)', async () => {
    await request(httpApp())
      .post('/admin/users')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        name: 'Weak Password',
        email: `weak-password_${randomUUID().slice(0, 8)}@omnigacha.dev`,
        password: 'short',
      })
      .expect(400);
  });

  describe('last active admin guard', () => {
    let otherActiveAdminIds: number[] = [];

    beforeEach(async () => {
      // The guard counts ALL active admins globally, not just the ones this
      // suite created. To deterministically reproduce "zero admins left"
      // without permanently disabling whatever admin accounts already exist
      // in this (shared, non-isolated) dev database, every other active
      // admin is temporarily deactivated for the duration of a single test
      // and restored in `afterEach`, mirroring the manual verification done
      // for this same guard during the admin-module code review.
      const others = await prisma.user.findMany({
        where: { role: 'ADMIN', isActive: true, NOT: { id: admin.userId } },
        select: { id: true },
      });
      otherActiveAdminIds = others.map((user) => user.id);

      if (otherActiveAdminIds.length > 0) {
        await prisma.user.updateMany({
          where: { id: { in: otherActiveAdminIds } },
          data: { isActive: false },
        });
      }
    });

    afterEach(async () => {
      if (otherActiveAdminIds.length > 0) {
        await prisma.user.updateMany({
          where: { id: { in: otherActiveAdminIds } },
          data: { isActive: true },
        });
      }
    });

    it('blocks deactivating the only remaining active admin (400)', async () => {
      const response = await request(httpApp())
        .patch(`/admin/users/${admin.userId}/status`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ isActive: false })
        .expect(400);

      expect((response.body as { message: string }).message).toMatch(
        /at least one active admin must remain/i,
      );

      const stillAdmin = await prisma.user.findUniqueOrThrow({
        where: { id: admin.userId },
      });
      expect(stillAdmin.isActive).toBe(true);
    });

    it('blocks demoting the only remaining active admin to USER (400)', async () => {
      await request(httpApp())
        .patch(`/admin/users/${admin.userId}/role`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ role: 'USER' })
        .expect(400);

      const stillAdmin = await prisma.user.findUniqueOrThrow({
        where: { id: admin.userId },
      });
      expect(stillAdmin.role).toBe('ADMIN');
    });
  });
});
