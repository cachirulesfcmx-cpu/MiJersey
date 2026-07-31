import { booleanFromStringSchema, nodeEnvSchema, portSchema, urlSchema } from '@mijersey/config';
import { z } from 'zod';

export const appEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  PORT: portSchema.default(4000),
  DATABASE_URL: urlSchema,
  REDIS_URL: urlSchema,
  CORS_ORIGIN: z.string().min(1).default('http://localhost:3000,http://localhost:3001'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  ENABLE_SWAGGER: booleanFromStringSchema,
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET debe tener al menos 32 caracteres'),
  PUBLIC_WEB_URL: z.string().url().default('http://localhost:3000'),
  PUBLIC_ADMIN_URL: z.string().url().default('http://localhost:3001'),
  /** Origen público de esta misma API — usado para construir URLs absolutas de archivos servidos (Media Library, 010). */
  PUBLIC_API_URL: z.string().url().default('http://localhost:4000'),
  /** Carpeta (relativa al cwd del proceso, o absoluta) donde `LocalDiskStorageAdapter` guarda los archivos subidos. */
  MEDIA_UPLOADS_DIR: z.string().min(1).default('uploads'),
  /** Secreto compartido para verificar la firma HMAC de los webhooks del proveedor de pago "manual" (022) — mismo mecanismo que usaría un proveedor real (Stripe/MercadoPago firman así sus webhooks). Cambiar en producción. */
  PAYMENTS_MANUAL_WEBHOOK_SECRET: z.string().min(16).default('dev-manual-webhook-secret-change-me'),
});

export type AppEnv = z.infer<typeof appEnvSchema>;

export interface AppConfig {
  nodeEnv: AppEnv['NODE_ENV'];
  port: number;
  databaseUrl: string;
  redisUrl: string;
  /** Lista de orígenes permitidos por CORS (web + admin, separados por coma en la variable). */
  corsOrigins: string[];
  logLevel: AppEnv['LOG_LEVEL'];
  enableSwagger: boolean;
  jwtAccessSecret: string;
  publicWebUrl: string;
  publicAdminUrl: string;
  publicApiUrl: string;
  mediaUploadsDir: string;
  paymentsManualWebhookSecret: string;
  isProduction: boolean;
}
