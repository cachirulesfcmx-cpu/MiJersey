import { loadEnv, nodeEnvSchema } from '@mijersey/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:4000'),
});

export const env = loadEnv(envSchema, process.env);
