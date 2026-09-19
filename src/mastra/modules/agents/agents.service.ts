import { Agent } from '@mastra/core/agent';
import logger from '../../../utils/logger';
import { mastra } from '../..';
import { generateId } from '../../utils/helpers';
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
import { IncomingFile } from 'src/mastra/types/utils.types';
import { ValidationError } from 'src/mastra/utils/error';
import { buildFileSummary, storeChatFiles } from 'src/mastra/utils/file-utils';
import { extractPdfText } from '../../utils/document-ingestion';
import { handleStreamEvents } from '../../utils/stream-utils';

export class AgentsService {
  private agent: Agent;

  constructor() {
    this.agent = mastra.getAgent('agent');
  }

  async *chatStream(
    rawInput: ChatInput | unknown,
    files: IncomingFile[] = []
  ): AsyncGenerator<StreamEvent> {
    const validation = ChatInputSchema.safeParse(rawInput);
    if (!validation.success) {
      throw new ValidationError('Invalid input', validation.error.issues);
    }

    const { query: userQuery, threadId, files: jsonFiles } = validation.data;
    const finalThreadId = threadId || generateId();

    const storedFiles = await storeChatFiles({
      threadId: finalThreadId,
      files,
      jsonFiles: jsonFiles ?? [],
    });

    const extractedPdfTexts: string[] = [];

    for (const sf of storedFiles) {
      logger.info(
        {
          threadId: finalThreadId,
          filename: sf.filename,
          url: sf.url,
          contentType: sf.contentType,
          key: sf.key,
        },
        `File received: ${sf.filename}, URL: ${sf.url}`
      );

      if (sf.contentType === 'application/pdf' && sf.localPath) {
        try {
          const pdfText = await extractPdfText(sf.localPath);
          extractedPdfTexts.push(`[Attached PDF Document (${sf.filename})]:\n${pdfText}`);
          logger.info(
            { filename: sf.filename, textLength: pdfText.length },
            'Extracted PDF text for query context'
          );
        } catch (err) {
          logger.warn({ filename: sf.filename, err }, 'Failed to extract text from PDF');
        }
      }
    }

    yield { type: 'metadata', threadId: finalThreadId };

    const contextParts: string[] = [];

    if (extractedPdfTexts.length > 0) {
      contextParts.push(...extractedPdfTexts);
    }

    const nonPdfFiles = storedFiles.filter((sf) => sf.contentType !== 'application/pdf');
    if (nonPdfFiles.length > 0) {
      contextParts.push(buildFileSummary(nonPdfFiles));
    }

    const isPlaceholderQuery = userQuery && /^\[Attached File: .*\]$/.test(userQuery.trim());
    const validUserQuery = isPlaceholderQuery ? '' : (userQuery ?? '').trim();

    let query = validUserQuery;

    if (contextParts.length > 0) {
      query =
        validUserQuery !== ''
          ? `${validUserQuery}\n\n${contextParts.join('\n\n')}`
          : contextParts.join('\n\n');
    }

    logger.debug({ threadId: finalThreadId, query }, 'Streaming response from agent');

    const response = await this.agent.stream(query, {
      memory: { thread: finalThreadId, resource: 'anonymous' },
    });

    yield* handleStreamEvents(response.fullStream);
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
