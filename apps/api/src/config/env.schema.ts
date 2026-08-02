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
  /** Configuración SMTP para el envío real de correos (031) — todas opcionales: sin `SMTP_HOST`, `NodemailerEmailTransport` registra el correo en el log en vez de enviarlo (mismo comportamiento de desarrollo que `ConsoleMailer`, 003). */
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASSWORD: z.string().min(1).optional(),
  SMTP_FROM: z.string().min(1).default('MiJersey <no-reply@mijersey.com>'),
  /** Clave para cifrar en reposo el secreto TOTP de MFA (035) — cualquier string; se deriva a 32 bytes vía SHA-256 (ver AesGcmMfaSecretCipher), así que no requiere generar una clave base64 a mano. Cambiar en producción. */
  MFA_ENCRYPTION_KEY: z.string().min(1).default('dev-mfa-encryption-key-change-me'),
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
  smtpHost: string | null;
  smtpPort: number;
  smtpUser: string | null;
  smtpPassword: string | null;
  smtpFrom: string;
  mfaEncryptionKey: string;
  isProduction: boolean;
}
