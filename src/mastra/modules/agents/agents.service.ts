import { Agent } from '@mastra/core/agent';
import { ZodIssue } from 'zod';
import { generateText } from 'ai';
import logger from '../../../utils/logger';
import { mastra } from '../..';
import { generateId } from '../../utils/helpers';
import { chatModel } from '../../config/config';
import { prompts } from '../../utils/prompts';
import {
  ChatInput,
  ChatInputSchema,
  GetConversationsInput,
  GetConversationsInputSchema,
  GetConversationInput,
  GetConversationInputSchema,
  DeleteConversationInput,
  DeleteConversationInputSchema,
  DeleteMessageInput,
  DeleteMessageInputSchema,
  GetConversationsResponse,
  GetConversationResponse,
  DeleteConversationResponse,
  DeleteMessageResponse,
  StreamEvent,
  Message,
} from '../../dto/agents';
import { parseMessageContent } from '../../utils/message-parser';

export class ValidationError extends Error {
  public issues: ZodIssue[];
  constructor(message: string, issues: ZodIssue[]) {
    super(message);
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

export class AgentsService {
  private agent: Agent;

  constructor() {
    this.agent = mastra.getAgent('agent');
  }

  async *chatStream(rawInput: ChatInput | unknown): AsyncGenerator<StreamEvent> {
    const validation = ChatInputSchema.safeParse(rawInput);
    if (!validation.success) {
      throw new ValidationError('Invalid input', validation.error.issues);
    }

    const { query: userQuery, threadId } = validation.data;
    const finalThreadId = threadId || generateId();
    yield { type: 'metadata', threadId: finalThreadId };

    logger.debug({ threadId: finalThreadId, userQuery }, 'Rewriting query for agent');
    const { text: query } = await generateText({
      model: chatModel,
      prompt: prompts('QueryRewrite', userQuery),
    });

    logger.debug(
      { threadId: finalThreadId, rewrittenQuery: query },
      'Streaming response from agent'
    );
    const response = await this.agent.stream(query, {
      memory: { thread: finalThreadId, resource: 'anonymous' },
    });

    for await (const chunk of response.fullStream) {
      if (chunk.type === 'text-delta') {
        yield { type: 'answer', content: chunk.payload.text };
      } else if (chunk.type === 'reasoning-delta') {
        yield { type: 'thinking', content: chunk.payload.text };
      } else if (chunk.type === 'tool-call') {
        const payload = chunk.payload as { args?: { query?: string }; toolName?: string };
        const queryArg = payload?.args?.query;
        const msg = queryArg
          ? `🔍 Searching knowledge base for "${queryArg}"...\n`
          : `🔍 Calling tool ${payload?.toolName || 'search'}...\n`;
        yield { type: 'thinking', content: msg };
      } else if (chunk.type === 'tool-result') {
        const payload = chunk.payload as { result?: { results?: unknown[] } };
        const results = payload?.result?.results;
        const count = Array.isArray(results) ? results.length : null;
        const msg =
          count !== null
            ? `✅ Found ${count} relevant documents from library.\n\n`
            : `✅ Search completed.\n\n`;
        yield { type: 'thinking', content: msg };
      }
    }
  }

  async getConversations(
    rawInput?: GetConversationsInput | unknown
  ): Promise<GetConversationsResponse> {
    const validation = GetConversationsInputSchema.safeParse(rawInput ?? {});
    if (!validation.success) {
      throw new ValidationError('Invalid input', validation.error.issues);
    }

    const memory = await this.agent.getMemory();
    if (!memory) return [];

    const result = await memory.listThreads(validation.data);
    return (result?.threads as unknown as GetConversationsResponse) || [];
  }

  async getConversation(
    rawInput: GetConversationInput | unknown
  ): Promise<GetConversationResponse> {
    const validation = GetConversationInputSchema.safeParse(rawInput);
    if (!validation.success) {
      throw new ValidationError('Invalid input', validation.error.issues);
    }

    const { threadId } = validation.data;
    const memory = await this.agent.getMemory();
    if (!memory) return { threadId, messages: [] };

    const result = await memory.recall({ threadId });
    const rawMessages = (result?.messages as unknown as Message[]) || [];
    const normalizedMessages = rawMessages.map((msg) => {
      const parsed = parseMessageContent(msg.content ?? msg);
      return {
        ...msg,
        content: parsed.text,
        thinking: parsed.thinking || msg.thinking || undefined,
      };
    });

    return {
      threadId,
      messages: normalizedMessages,
    };
  }

  async deleteConversation(
    rawInput: DeleteConversationInput | unknown
  ): Promise<DeleteConversationResponse> {
    const validation = DeleteConversationInputSchema.safeParse(rawInput);
    if (!validation.success) {
      throw new ValidationError('Invalid input', validation.error.issues);
    }

    const { threadId } = validation.data;
    const memory = await this.agent.getMemory();
    if (memory) {
      await memory.deleteThread(threadId);
      logger.info({ threadId }, 'Conversation thread deleted');
    }
    return { success: true, message: 'Conversation deleted successfully' };
  }

  async deleteMessage(rawInput: DeleteMessageInput | unknown): Promise<DeleteMessageResponse> {
    const validation = DeleteMessageInputSchema.safeParse(rawInput);
    if (!validation.success) {
      throw new ValidationError('Invalid input', validation.error.issues);
    }

    const { messageId } = validation.data;
    const memory = await this.agent.getMemory();
    if (memory) {
      await memory.deleteMessages([messageId]);
      logger.info({ messageId }, 'Message deleted');
    }
    return { success: true, message: 'Message deleted successfully' };
  }
}
