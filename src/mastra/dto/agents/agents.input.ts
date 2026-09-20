import { z } from 'zod';

export const FileInputSchema = z.object({
  filename: z.string(),
  contentType: z.string(),
  base64: z.string().optional(),
  key: z.string().optional(),
});

export const ChatInputSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  threadId: z.string().optional(),
  files: z.array(FileInputSchema).optional(),
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

export const DeleteMessageInputSchema = z.object({
  messageId: z.string().min(1, 'messageId is required'),
});

export type FileInput = z.infer<typeof FileInputSchema>;
export type ChatInput = z.infer<typeof ChatInputSchema>;
export type GetConversationsInput = z.infer<typeof GetConversationsInputSchema>;
export type GetConversationInput = z.infer<typeof GetConversationInputSchema>;
export type DeleteConversationInput = z.infer<typeof DeleteConversationInputSchema>;
export type DeleteMessageInput = z.infer<typeof DeleteMessageInputSchema>;
