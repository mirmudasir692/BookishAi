import { Request, Response } from 'express';
import logger from '../../../utils/logger';
import { AgentsService } from './agents.service';
import {
  GetConversationsInput,
  GetConversationInput,
  DeleteConversationInput,
  DeleteMessageInput,
  GetConversationsResponse,
  GetConversationResponse,
  DeleteConversationResponse,
  DeleteMessageResponse,
  ErrorResponse,
} from '../../dto/agents';
import { ValidationError } from 'src/mastra/utils/error';

export class AgentsController {
  private agentsService: AgentsService;

  constructor() {
    this.agentsService = new AgentsService();
  }

  async chat(req: Request, res: Response): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let isAborted = false;
    res.on('close', () => {
      if (!res.writableEnded) {
        isAborted = true;
      }
    });

    try {
      const incomingFiles: Array<{ filename: string; contentType: string; buffer: Buffer }> = [];
      const multerFiles = req.files
        ? Array.isArray(req.files)
          ? req.files
          : Object.values(req.files).flat()
        : req.file
          ? [req.file]
          : [];

      for (const file of multerFiles) {
        if (file.buffer) {
          incomingFiles.push({
            filename: file.originalname || file.filename || 'file',
            contentType: file.mimetype || 'application/octet-stream',
            buffer: file.buffer,
          });
        }
      }

      const stream = this.agentsService.chatStream(req.body, incomingFiles);

      for await (const event of stream) {
        if (isAborted || res.destroyed || res.writableEnded) {
          break;
        }
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }

      if (!isAborted && !res.destroyed && !res.writableEnded) {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn({ error: error.issues }, 'Validation error in chat');
      } else {
        logger.error({ error }, 'Error in chat stream');
      }

      if (!isAborted && !res.destroyed && !res.writableEnded) {
        if (error instanceof ValidationError) {
          res.write(
            `data: ${JSON.stringify({ type: 'error', error: error.message, details: error.issues })}\n\n`
          );
        } else {
          res.write(
            `data: ${JSON.stringify({ type: 'error', error: 'Internal server error' })}\n\n`
          );
        }
        res.end();
      }
    }
  }

  async getConversations(
    req: Request<
      Record<string, string>,
      GetConversationsResponse | ErrorResponse,
      unknown,
      GetConversationsInput
    >,
    res: Response<GetConversationsResponse | ErrorResponse>
  ): Promise<void> {
    try {
      const result = await this.agentsService.getConversations(req.query);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn({ error: error.issues }, 'Validation error in getConversations');
        res.status(400).json({ error: error.message, details: error.issues });
        return;
      }
      logger.error({ error }, 'Error in getConversations');
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getConversation(
    req: Request<GetConversationInput, GetConversationResponse | ErrorResponse>,
    res: Response<GetConversationResponse | ErrorResponse>
  ): Promise<void> {
    try {
      const result = await this.agentsService.getConversation(req.params);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn({ error: error.issues }, 'Validation error in getConversation');
        res.status(400).json({ error: error.message, details: error.issues });
        return;
      }
      logger.error({ error }, 'Error in getConversation');
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteConversation(
    req: Request<DeleteConversationInput, DeleteConversationResponse | ErrorResponse>,
    res: Response<DeleteConversationResponse | ErrorResponse>
  ): Promise<void> {
    try {
      const result = await this.agentsService.deleteConversation(req.params);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn({ error: error.issues }, 'Validation error in deleteConversation');
        res.status(400).json({ error: error.message, details: error.issues });
        return;
      }
      logger.error({ error }, 'Error in deleteConversation');
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteMessage(
    req: Request<DeleteMessageInput, DeleteMessageResponse | ErrorResponse>,
    res: Response<DeleteMessageResponse | ErrorResponse>
  ): Promise<void> {
    try {
      const result = await this.agentsService.deleteMessage(req.params);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn({ error: error.issues }, 'Validation error in deleteMessage');
        res.status(400).json({ error: error.message, details: error.issues });
        return;
      }
      logger.error({ error }, 'Error in deleteMessage');
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
