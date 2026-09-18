import { z, ZodIssue } from 'zod';

export const ChatResponseSchema = z.object({
  message: z.string(),
  threadId: z.string(),
});

export const ThreadSchema = z.object({
  id: z.string(),
  resourceId: z.string(),
  title: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
});

export const GetConversationsResponseSchema = z.array(ThreadSchema);

export const MessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system', 'tool', 'signal']),
  content: z.unknown(),
  createdAt: z.union([z.string(), z.date()]).optional(),
});

export const GetConversationResponseSchema = z.object({
  threadId: z.string(),
  messages: z.array(MessageSchema),
});

export const DeleteConversationResponseSchema = z.object({
  success: z.boolean(),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.array(z.custom<ZodIssue>()).optional(),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;
export type Thread = z.infer<typeof ThreadSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type GetConversationsResponse = z.infer<typeof GetConversationsResponseSchema>;
export type GetConversationResponse = z.infer<typeof GetConversationResponseSchema>;
export type DeleteConversationResponse = z.infer<typeof DeleteConversationResponseSchema>;
export type ErrorResponse = {
  error: string;
  details?: ZodIssue[];
};
