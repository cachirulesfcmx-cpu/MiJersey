import { loadEnv, nodeEnvSchema } from '@mijersey/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:4000'),
  NEXT_PUBLIC_WEB_URL: z.string().url().default('http://localhost:3000'),
});

// Ver el comentario equivalente en apps/web/src/config/env.ts -- Next.js solo hornea
// `process.env.NEXT_PUBLIC_*` en el bundle del navegador si ve el acceso literal y directo, no
// si se reenvia `process.env` completo a una funcion generica.
export const env = loadEnv(envSchema, {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
});
