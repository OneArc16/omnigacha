import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

const DEFAULT_DEV_ORIGINS = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
]);

function parseAllowedOrigins() {
  return new Set(
    (process.env.CORS_ORIGIN ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
}

function isAllowedDevOrigin(origin: string) {
  if (DEFAULT_DEV_ORIGINS.has(origin)) {
    return true;
  }

  try {
    const url = new URL(origin);
    return (
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1') &&
      (url.port === '3000' || url.port === '3001')
    );
  } catch {
    return false;
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const allowedOrigins = parseAllowedOrigins();

  app.enableShutdownHooks();
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/media',
  });
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.has(origin) || process.env.NODE_ENV !== 'production') {
        if (allowedOrigins.has(origin) || isAllowedDevOrigin(origin)) {
          callback(null, true);
          return;
        }
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
    },
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
