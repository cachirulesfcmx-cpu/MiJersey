import { loadEnv } from '@mijersey/config';

import type { AppConfig } from './env.schema';
import { appEnvSchema } from './env.schema';

export const APP_CONFIG = Symbol('APP_CONFIG');

export function createAppConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const env = loadEnv(appEnvSchema, source);

  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    databaseUrl: env.DATABASE_URL,
    redisUrl: env.REDIS_URL,
    corsOrigin: env.CORS_ORIGIN,
    logLevel: env.LOG_LEVEL,
    enableSwagger: env.ENABLE_SWAGGER,
    isProduction: env.NODE_ENV === 'production',
  };
}
