import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const envSchema = z.object({
  OLLAMA_BASE_URL: z.string().url('OLLAMA_BASE_URL must be a valid URL'),
  MONGODB_URI: z.string().url('MONGODB_URI must be a valid MongoDB connection string'),
  MONGODB_DB_NAME: z.string().min(1, 'MONGODB_DB_NAME is required'),
  MASTRA_PLATFORM_ACCESS_TOKEN: z.string().min(1, 'MASTRA_PLATFORM_ACCESS_TOKEN is required'),
  MASTRA_PROJECT_ID: z.string().min(1, 'MASTRA_PROJECT_ID is required'),
});

type Env = z.infer<typeof envSchema>;

const validateEnv = (): Env => {
  const env = {
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL ?? '',
    MONGODB_URI: process.env.MONGODB_URI ?? '',
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME ?? '',
    MASTRA_PLATFORM_ACCESS_TOKEN: process.env.MASTRA_PLATFORM_ACCESS_TOKEN ?? '',
    MASTRA_PROJECT_ID: process.env.MASTRA_PROJECT_ID ?? '',
  };

  try {
    const validatedEnv = envSchema.parse(env);
    console.log('✅ Environment variables validated successfully');
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:');
      error.issues.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error('❌ Unexpected error during validation:', error);
    }
    process.exit(1);
  }
};

const env = validateEnv();

export default env;
export type { Env };
