import { loadEnv, nodeEnvSchema } from '@mijersey/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:4000'),
  NEXT_PUBLIC_WEB_URL: z.string().url().default('http://localhost:3000'),
});

// OJO: Next.js solo reemplaza `process.env.NEXT_PUBLIC_*` por su valor real en el bundle del
// navegador cuando ve el acceso literal y directo en el codigo (webpack DefinePlugin hace un
// reemplazo de texto estatico, no evalua `process.env` como objeto en runtime). Pasar el objeto
// `process.env` completo a una funcion generica (como hacia esta linea antes) rompe eso: en el
// servidor funciona porque ahi `process.env` es real, pero en el navegador queda vacio y todo
// cae al `.default(...)` del schema -- por eso el sitio en el navegador llamaba a
// http://localhost:4000 aunque la variable estuviera bien configurada en Vercel. Por eso aqui se
// listan los `NEXT_PUBLIC_*` de forma literal en vez de reenviar `process.env` tal cual.
export const env = loadEnv(envSchema, {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
});
