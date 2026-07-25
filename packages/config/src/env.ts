import { z } from 'zod';

export class EnvValidationError extends Error {
  constructor(public readonly issues: readonly string[]) {
    super(`Environment validation failed:\n${issues.join('\n')}`);
    this.name = 'EnvValidationError';
  }
}

/**
 * Parses and validates a source of environment variables against a Zod schema.
 * Every app owns its schema; nothing outside this function reads `process.env` directly.
 */
export function loadEnv<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  source: NodeJS.ProcessEnv = process.env,
): z.infer<TSchema> {
  const result = schema.safeParse(source);

  if (!result.success) {
    const issues = result.error.issues.map(
      (issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`,
    );
    throw new EnvValidationError(issues);
  }

  return result.data;
}

export const nodeEnvSchema = z.enum(['development', 'test', 'production']).default('development');

export const portSchema = z.coerce.number().int().positive().max(65535);

export const urlSchema = z.string().url();

export const booleanFromStringSchema = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');
