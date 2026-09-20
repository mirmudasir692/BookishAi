import { createOllama } from 'ai-sdk-ollama';
import config from '../../../config/app.config';

const ollama = createOllama({
  baseURL: config.OLLAMA_BASE_URL,
});

export const chatModel = ollama.chat(config.ollama.models.primaryChat, {});

export const lightChatModel = ollama.chat(config.ollama.models.lightChat);

export const embeddingModel = ollama.embedding(config.ollama.models.embedding);

export default chatModel;
