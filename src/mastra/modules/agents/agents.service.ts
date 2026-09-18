import { Agent } from '@mastra/core/agent';
import { ZodIssue } from 'zod';
import { generateText } from 'ai';
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
  ChatResponse,
  GetConversationsResponse,
  GetConversationResponse,
  DeleteConversationResponse,
} from '../../dto/agents';

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

  async chat(rawInput: ChatInput | unknown): Promise<ChatResponse> {
    const validation = ChatInputSchema.safeParse(rawInput);
    if (!validation.success) {
      throw new ValidationError('Invalid input', validation.error.issues);
    }
    const { query: userQuery, threadId } = validation.data;
    const { text: query } = await generateText({
      model: chatModel,
      prompt: prompts('QueryRewrite', userQuery),
    });

    const finalThreadId = threadId || generateId();

    const response = await this.agent.generate(query, { memory: { thread: finalThreadId } });
    return {
      message: response.text,
      threadId: finalThreadId,
    };
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
    return {
      threadId,
      messages: (result?.messages as unknown as GetConversationResponse['messages']) || [],
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
    }
    return { success: true };
  }
}
