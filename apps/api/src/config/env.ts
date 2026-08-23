import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('127.0.0.1'),
  DATABASE_URL: z.string().default('file:./dev.db'),
  CORS_ORIGIN: z.string().default('http://localhost:3010'),

  // Kintone Configuration (Read-Only)
  KINTONE_BASE_URL: z.string().default('https://ttmet.cybozu.com'),
  KINTONE_READ_API_TOKEN: z.string().optional().default(''),
  KINTONE_APP_EMPLOYEE: z.coerce.number().default(53),
  KINTONE_APP_ORGANIZATION: z.coerce.number().default(791),
  KINTONE_APP_ASSIGNMENTS: z.coerce.number().default(792),
  KINTONE_APP_CHANGE_REQUESTS: z.coerce.number().default(793),

  // STRICT WRITE SAFETY GATE: Always false in Phase 4 & 5
  KINTONE_WRITE_ENABLED: z.coerce.boolean().default(false)
});

export type EnvConfig = z.infer<typeof EnvSchema>;

export function loadEnvConfig(): EnvConfig {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.format());
    throw new Error('Invalid environment configuration');
  }
  if (parsed.data.KINTONE_WRITE_ENABLED) {
    console.warn('WARNING: KINTONE_WRITE_ENABLED is set to true but Phase 4/5 strictly enforces READ-ONLY!');
  }
  return parsed.data;
}

export const env = loadEnvConfig();