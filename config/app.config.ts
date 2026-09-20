import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { z } from 'zod';

const configSchema = z.object({
  server: z.object({
    port: z.number().default(3000),
    env: z.enum(['development', 'production', 'test']).default('development'),
    apiBaseUrl: z.url().default('http://localhost:3000/'),
  }),
  ollama: z.object({
    baseUrl: z.url().default('http://localhost:11434'),
    models: z
      .object({
        primaryChat: z.string().default('qwen3:1.7b-8k'),
        lightChat: z.string().default('qwen2.5:0.5b'),
        embedding: z.string().default('nomic-embed-text'),
      })
      .default({
        primaryChat: 'qwen3:1.7b-8k',
        lightChat: 'qwen2.5:0.5b',
        embedding: 'nomic-embed-text',
      }),
  }),
});

export type AppConfig = z.infer<typeof configSchema>;

const loadConfig = (): AppConfig => {
  const configPath = path.resolve(import.meta.dirname, './app.config.yaml');
  let rawConfig: unknown = {};

  if (fs.existsSync(configPath)) {
    try {
      const fileContents = fs.readFileSync(configPath, 'utf8');
      rawConfig = YAML.parse(fileContents);
    } catch (err) {
      console.warn('Failed to parse app.config.yaml, falling back to defaults:', err);
    }
  }

  const parsed = configSchema.safeParse(rawConfig);
  if (!parsed.success) {
    console.warn('Invalid configuration in app.config.yaml, using defaults:', parsed.error.message);
    return configSchema.parse({});
  }

  return parsed.data;
};

export const config = loadConfig();

export const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || config.ollama.baseUrl;
export const NODE_ENV = process.env.NODE_ENV || config.server.env;
export const VITE_API_BASE_URL = process.env.VITE_API_BASE_URL || config.server.apiBaseUrl;

export default {
  OLLAMA_BASE_URL,
  NODE_ENV,
  VITE_API_BASE_URL,
  ...config,
};
