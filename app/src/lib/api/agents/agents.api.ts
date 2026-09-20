import {
  ChatInputSchema,
  DeleteConversationInputSchema,
  type DeleteConversationResponse,
  DeleteConversationResponseSchema,
  DeleteMessageInputSchema,
  type DeleteMessageResponse,
  DeleteMessageResponseSchema,
  GetConversationInputSchema,
  type GetConversationResponse,
  GetConversationResponseSchema,
  GetConversationsInputSchema,
  type GetConversationsResponse,
  GetConversationsResponseSchema,
  type StreamEvent,
} from '../../../../../src/mastra/dto';
import type { ChatStreamCallbacks } from '$lib/types/chat.types';
import { apiClient, baseURL } from '../client';

export type { ChatStreamCallbacks };

export const chatWithAgentStream = async (
  input: unknown,
  callbacks: ChatStreamCallbacks = {},
  signal?: AbortSignal
): Promise<{ threadId: string; thinking: string; answer: string }> => {
  const validatedData = ChatInputSchema.parse(input);

  const url = `${baseURL.replace(/\/$/, '')}/api/agents/chat`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(validatedData),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Network error');
    throw new Error(`Chat request failed with status ${response.status}: ${errorText}`);
  }

  if (!response.body) {
    throw new Error('ReadableStream not supported in this browser environment.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');

  let threadId = '';
  let thinking = '';
  let answer = '';
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || !line.startsWith('data:')) continue;

        const dataStr = line.slice(5).trim();
        if (dataStr === '[DONE]') {
          callbacks.onDone?.({ threadId, thinking, answer });
          return { threadId, thinking, answer };
        }

        try {
          const event = JSON.parse(dataStr) as StreamEvent;

          if (event.type === 'metadata') {
            threadId = event.threadId;
            callbacks.onMetadata?.({ threadId: event.threadId });
          } else if (event.type === 'thinking') {
            thinking += event.content;
            callbacks.onThinking?.(event.content, thinking);
          } else if (event.type === 'answer') {
            answer += event.content;
            callbacks.onAnswer?.(event.content, answer);
          } else if (event.type === 'error') {
            callbacks.onError?.(event.error, event.details);
            throw new Error(event.error || 'Unknown error occurred in agent stream');
          }
        } catch (parseError) {
          if (!(parseError instanceof SyntaxError)) {
            throw parseError;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  callbacks.onDone?.({ threadId, thinking, answer });
  return { threadId, thinking, answer };
};

export const chatWithAgent = async (
  input: unknown
): Promise<{ threadId: string; message: string; thinking?: string }> => {
  const result = await chatWithAgentStream(input);
  return {
    threadId: result.threadId,
    message: result.answer,
    thinking: result.thinking,
  };
};

export const getConversations = async (input: unknown = {}): Promise<GetConversationsResponse> => {
  const validatedData = GetConversationsInputSchema.parse(input);

  const { data } = await apiClient.get('/api/agents/conversations', {
    params: validatedData,
  });

  return GetConversationsResponseSchema.parse(data);
};

export const getConversation = async (threadId: string): Promise<GetConversationResponse> => {
  const validatedData = GetConversationInputSchema.parse({ threadId });

  const { data } = await apiClient.get(`/api/agents/conversations/${validatedData.threadId}`);

  return GetConversationResponseSchema.parse(data);
};

export const deleteConversation = async (threadId: string): Promise<DeleteConversationResponse> => {
  const validatedData = DeleteConversationInputSchema.parse({ threadId });

  const { data } = await apiClient.delete(`/api/agents/conversations/${validatedData.threadId}`);

  return DeleteConversationResponseSchema.parse(data);
};

export const deleteMessage = async (messageId: string): Promise<DeleteMessageResponse> => {
  const validatedData = DeleteMessageInputSchema.parse({ messageId });

  const { data } = await apiClient.delete(`/api/agents/messages/${validatedData.messageId}`);

  return DeleteMessageResponseSchema.parse(data);
};
