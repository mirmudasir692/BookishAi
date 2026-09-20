import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(import.meta.dirname, '../.env') });

const envSchema = z.object({
  OLLAMA_BASE_URL: z.string().url('OLLAMA_BASE_URL must be a valid URL'),
  MONGODB_URI: z.string().url('MONGODB_URI must be a valid MongoDB connection string'),
  MONGODB_DB_NAME: z.string().min(1, 'MONGODB_DB_NAME is required'),
  MASTRA_PLATFORM_ACCESS_TOKEN: z.string().min(1, 'MASTRA_PLATFORM_ACCESS_TOKEN is required'),
  MASTRA_PROJECT_ID: z.string().min(1, 'MASTRA_PROJECT_ID is required'),
  VITE_API_BASE_URL: z.url('VITE_API_BASE_URL must be a valid URL'),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

type Env = z.infer<typeof envSchema>;

const validateEnv = (): Env => {
  const env = {
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL ?? '',
    MONGODB_URI: process.env.MONGODB_URI ?? '',
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME ?? '',
    MASTRA_PLATFORM_ACCESS_TOKEN: process.env.MASTRA_PLATFORM_ACCESS_TOKEN ?? '',
    MASTRA_PROJECT_ID: process.env.MASTRA_PROJECT_ID ?? '',
    VITE_API_BASE_URL: process.env.VITE_API_BASE_URL ?? '',
    NODE_ENV: process.env.NODE_ENV ?? 'development',
  };

  try {
    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Environment variable validation failed: ${error.issues.map((i) => i.message).join(', ')}`,
        { cause: error }
      );
    }
    throw error;
  }
};

const env = validateEnv();

export default env;
export type { Env };
