import { z } from 'zod';

export const ChatInputSchema = z.object({
  query: z.string().min(1),
  threadId: z.string().optional(),
});

export const GetConversationsInputSchema = z.object({
  resourceId: z.string().optional(),
  page: z.number().optional(),
  perPage: z.number().optional(),
});

export const GetConversationInputSchema = z.object({
  threadId: z.string().min(1),
});

export const DeleteConversationInputSchema = z.object({
  threadId: z.string().min(1),
});

export type ChatInput = z.infer<typeof ChatInputSchema>;
export type GetConversationsInput = z.infer<typeof GetConversationsInputSchema>;
export type GetConversationInput = z.infer<typeof GetConversationInputSchema>;
export type DeleteConversationInput = z.infer<typeof DeleteConversationInputSchema>;
