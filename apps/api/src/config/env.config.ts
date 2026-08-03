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
    publicApiUrl: env.PUBLIC_API_URL,
    mediaUploadsDir: env.MEDIA_UPLOADS_DIR,
    storageDriver: env.STORAGE_DRIVER,
    r2Bucket: env.R2_BUCKET ?? null,
    r2Endpoint: env.R2_ENDPOINT ?? null,
    r2AccessKeyId: env.R2_ACCESS_KEY_ID ?? null,
    r2SecretAccessKey: env.R2_SECRET_ACCESS_KEY ?? null,
    r2PublicUrl: env.R2_PUBLIC_URL ?? null,
    paymentsManualWebhookSecret: env.PAYMENTS_MANUAL_WEBHOOK_SECRET,
    smtpHost: env.SMTP_HOST ?? null,
    smtpPort: env.SMTP_PORT,
    smtpUser: env.SMTP_USER ?? null,
    smtpPassword: env.SMTP_PASSWORD ?? null,
    smtpFrom: env.SMTP_FROM,
    mfaEncryptionKey: env.MFA_ENCRYPTION_KEY,
    isProduction: env.NODE_ENV === 'production',
  };
}
