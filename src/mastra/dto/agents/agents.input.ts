import { z } from 'zod';

export const ChatInputSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  threadId: z.string().optional(),
});

export const GetConversationsInputSchema = z.object({
  resourceId: z.string().optional(),
  page: z.coerce.number().optional(),
  perPage: z.coerce.number().optional(),
});

export const GetConversationInputSchema = z.object({
  threadId: z.string().min(1, 'threadId is required'),
});

export const DeleteConversationInputSchema = z.object({
  threadId: z.string().min(1, 'threadId is required'),
});

export type ChatInput = z.infer<typeof ChatInputSchema>;
export type GetConversationsInput = z.infer<typeof GetConversationsInputSchema>;
export type GetConversationInput = z.infer<typeof GetConversationInputSchema>;
export type DeleteConversationInput = z.infer<typeof DeleteConversationInputSchema>;
