import 'reflect-metadata';

import { resolve } from 'node:path';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { APP_CONFIG } from './config/env.config';
import type { AppConfig } from './config/env.schema';
import { MEDIA_STATIC_URL_PREFIX } from './modules/media/infrastructure/storage/local-disk-storage.adapter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });

  const config = app.get<AppConfig>(APP_CONFIG);

  app.useLogger(app.get(Logger));
  // crossOriginResourcePolicy en 'cross-origin': admin/web sirven desde otros orígenes
  // y necesitan cargar los archivos de /uploads (imágenes, miniaturas) vía <img>.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cookieParser());
  app.useStaticAssets(resolve(process.cwd(), config.mediaUploadsDir), {
    prefix: MEDIA_STATIC_URL_PREFIX,
  });
  app.enableCors({ origin: config.corsOrigins, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();

  await app.listen(config.port);
}

void bootstrap();
