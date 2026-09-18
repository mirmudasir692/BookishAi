import {
  ChatInputSchema,
  ChatResponse,
  ChatResponseSchema,
  DeleteConversationInputSchema,
  DeleteConversationResponse,
  DeleteConversationResponseSchema,
  GetConversationInputSchema,
  GetConversationResponse,
  GetConversationResponseSchema,
  GetConversationsInputSchema,
  GetConversationsResponse,
  GetConversationsResponseSchema,
} from '../../../../../src/mastra/dto';
import { apiClient } from '../client';

export const chatWithAgent = async (input: unknown): Promise<ChatResponse> => {
  const validatedData = ChatInputSchema.parse(input);

  const { data } = await apiClient.post('/api/agents/chat', validatedData);

  return ChatResponseSchema.parse(data);
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
