import { z } from 'zod';
import { booleanFromStringSchema, nodeEnvSchema, portSchema, urlSchema } from '@mijersey/config';

export const appEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  PORT: portSchema.default(4000),
  DATABASE_URL: urlSchema,
  REDIS_URL: urlSchema,
  CORS_ORIGIN: z.string().min(1).default('http://localhost:3000'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  ENABLE_SWAGGER: booleanFromStringSchema,
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
  isProduction: boolean;
}
