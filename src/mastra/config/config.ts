import { createOllama } from 'ai-sdk-ollama';
import env from '../../../config/env.config';

const ollama = createOllama({
  baseURL: env.OLLAMA_BASE_URL,
});

export const chatModel = ollama.chat('qwen3:1.7b-8k', {});

export const lightChatModel = ollama.chat('qwen2.5:0.5b');

export const embeddingModel = ollama.embedding('nomic-embed-text');

export const rerankingModel = ollama.chat('dengcao/Qwen3-Reranker-0.6B:Q8_0', {
  options: {
    num_ctx: 8192,
  },
});

export default chatModel;
