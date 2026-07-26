import { booleanFromStringSchema, nodeEnvSchema, portSchema, urlSchema } from '@mijersey/config';
import { z } from 'zod';

export const appEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  PORT: portSchema.default(4000),
  DATABASE_URL: urlSchema,
  REDIS_URL: urlSchema,
  CORS_ORIGIN: z.string().min(1).default('http://localhost:3000'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  ENABLE_SWAGGER: booleanFromStringSchema,
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET debe tener al menos 32 caracteres'),
  PUBLIC_WEB_URL: z.string().url().default('http://localhost:3000'),
});

export type AppEnv = z.infer<typeof appEnvSchema>;

export interface AppConfig {
  nodeEnv: AppEnv['NODE_ENV'];
  port: number;
  databaseUrl: string;
  redisUrl: string;
  corsOrigin: string;
  logLevel: AppEnv['LOG_LEVEL'];
  enableSwagger: boolean;
  jwtAccessSecret: string;
  publicWebUrl: string;
  isProduction: boolean;
}
