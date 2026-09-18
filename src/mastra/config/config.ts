import { createOllama } from 'ai-sdk-ollama';
import env from '../../../config/env.config';

const ollama = createOllama({
  baseURL: env.OLLAMA_BASE_URL,
});

export const chatModel = ollama.chat('qwen2.5:7b');
export const embeddingModel = ollama.embedding('nomic-embed-text');
export const rerankingModel = ollama.chat('qwen2.5:1.5b');
export default ollama.chat('qwen2.5:1.5b');
