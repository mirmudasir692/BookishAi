import { Agent } from '@mastra/core/agent';
import { mastra } from '../..';
import { generateId } from '../../utils/helpers';
import { 
  ChatResponse, 
  GetConversationsResponse, 
  GetConversationResponse,
  DeleteConversationResponse
} from '../../dto/agents/agents.response';
import {
  ChatInputSchema,
  GetConversationInputSchema,
  DeleteConversationInputSchema
} from '../../dto/agents/agents.input';

export class ValidationError extends Error {
  public issues: any[];
  constructor(message: string, issues: any[]) {
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

  async chat(rawInput: unknown): Promise<ChatResponse> {
    const validation = ChatInputSchema.safeParse(rawInput);
    if (!validation.success) {
      throw new ValidationError('Invalid input', validation.error.issues);
    }
    
    const { query, threadId } = validation.data;
    const finalThreadId = threadId || generateId();
    
    const response = await this.agent.generate(query, { memory: { thread: finalThreadId } });
    return {
      message: response.text,
      threadId: finalThreadId
    };
  }

  async getConversations(): Promise<GetConversationsResponse> {
    const memory = await this.agent.getMemory();
    if (!memory) return [];
    
    const result = await memory.listThreads({});
    return result?.threads || [];
  }

  async getConversation(rawInput: unknown): Promise<GetConversationResponse> {
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
      messages: result?.messages || []
    };
  }

  async deleteConversation(rawInput: unknown): Promise<DeleteConversationResponse> {
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