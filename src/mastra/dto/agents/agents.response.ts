import { z, type ZodIssue } from 'zod';

export const StreamEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('metadata'), threadId: z.string() }),
  z.object({ type: z.literal('thinking'), content: z.string() }),
  z.object({ type: z.literal('answer'), content: z.string() }),
  z.object({
    type: z.literal('error'),
    error: z.string(),
    details: z.array(z.unknown()).optional(),
  }),
]);

export type StreamEvent = z.infer<typeof StreamEventSchema>;

export const ThreadSchema = z
  .object({
    id: z.string(),
    resourceId: z.string().nullish(),
    title: z.string().nullish(),
    metadata: z.record(z.string(), z.unknown()).nullish(),
    createdAt: z.union([z.string(), z.date()]).nullish(),
    updatedAt: z.union([z.string(), z.date()]).nullish(),
  })
  .passthrough();

export const GetConversationsResponseSchema = z.array(ThreadSchema);

export const MessageSchema = z
  .object({
    id: z.string(),
    role: z.string(),
    content: z.unknown(),
    thinking: z.string().nullish(),
    createdAt: z.union([z.string(), z.date()]).nullish(),
    threadId: z.string().nullish(),
    resourceId: z.string().nullish(),
  })
  .passthrough();

export const GetConversationResponseSchema = z.object({
  threadId: z.string(),
  messages: z.array(MessageSchema),
});

export const DeleteConversationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export const DeleteMessageResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.array(z.custom<ZodIssue>()).optional(),
});

export type Thread = z.infer<typeof ThreadSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type GetConversationsResponse = z.infer<typeof GetConversationsResponseSchema>;
export type GetConversationResponse = z.infer<typeof GetConversationResponseSchema>;
export type DeleteConversationResponse = z.infer<typeof DeleteConversationResponseSchema>;
export type DeleteMessageResponse = z.infer<typeof DeleteMessageResponseSchema>;
export interface ErrorResponse {
  error: string;
  details?: ZodIssue[];
}
