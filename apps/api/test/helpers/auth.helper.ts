import request from 'supertest';
import { App } from 'supertest/types';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../src/prisma/prisma.service';

export type TestSession = {
  userId: number;
  email: string;
  password: string;
  accessToken: string;
  refreshToken: string;
};

type AuthResponseBody = {
  accessToken: string;
  refreshToken: string;
  user: { id: number };
};

const DEFAULT_PASSWORD = 'E2eTestPassword_1234';

/**
 * Registers a throwaway USER account through the public flow and logs in,
 * matching the real register -> login flow a client would use (no manually
 * signed JWTs), consistent with the existing mvp-flow.e2e-spec.ts pattern.
 */
export async function registerAndLogin(
  httpApp: () => App,
  emailPrefix: string,
): Promise<TestSession> {
  const runId = randomUUID().slice(0, 8);
  const email = `${emailPrefix}_${runId}@omnigacha.dev`;
  const password = DEFAULT_PASSWORD;

  const registerResponse = await request(httpApp())
    .post('/auth/register')
    .send({ name: `E2E ${emailPrefix}`, email, password })
    .expect(201);

  const body = registerResponse.body as AuthResponseBody;

  return {
    userId: body.user.id,
    email,
    password,
    accessToken: body.accessToken,
    refreshToken: body.refreshToken,
  };
}

/**
 * Promotes an existing session's user to ADMIN directly through Prisma
 * (there is no public endpoint to self-register as ADMIN), then logs in
 * again: the JWT bakes in `role` at sign time, so the pre-promotion token
 * would still carry role USER.
 */
export async function promoteToAdmin(
  httpApp: () => App,
  prisma: PrismaService,
  session: TestSession,
): Promise<TestSession> {
  await prisma.user.update({
    where: { id: session.userId },
    data: { role: 'ADMIN' },
  });

  const loginResponse = await request(httpApp())
    .post('/auth/login')
    .send({ email: session.email, password: session.password })
    .expect(201);

  const body = loginResponse.body as AuthResponseBody;

  return {
    ...session,
    accessToken: body.accessToken,
    refreshToken: body.refreshToken,
  };
}

export async function registerAdminAndLogin(
  httpApp: () => App,
  prisma: PrismaService,
  emailPrefix = 'e2e-admin',
): Promise<TestSession> {
  const session = await registerAndLogin(httpApp, emailPrefix);
  return promoteToAdmin(httpApp, prisma, session);
}

export async function deleteTestUser(
  prisma: PrismaService,
  userId: number | null | undefined,
) {
  if (!userId) return;

  await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
}
