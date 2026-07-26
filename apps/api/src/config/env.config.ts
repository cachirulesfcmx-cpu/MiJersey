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
    corsOrigins: env.CORS_ORIGIN.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    logLevel: env.LOG_LEVEL,
    enableSwagger: env.ENABLE_SWAGGER,
    jwtAccessSecret: env.JWT_ACCESS_SECRET,
    publicWebUrl: env.PUBLIC_WEB_URL,
    publicAdminUrl: env.PUBLIC_ADMIN_URL,
    isProduction: env.NODE_ENV === 'production',
  };
}
