import { Request, Response } from 'express';
import { AgentsService, ValidationError } from './agents.service';
import {
  ChatInput,
  GetConversationsInput,
  GetConversationInput,
  DeleteConversationInput,
  GetConversationsResponse,
  GetConversationResponse,
  DeleteConversationResponse,
  ErrorResponse,
} from '../../dto/agents';

export class AgentsController {
  private agentsService: AgentsService;

  constructor() {
    this.agentsService = new AgentsService();
  }

  async chat(req: Request<Record<string, string>, void, ChatInput>, res: Response): Promise<void> {
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
      const stream = this.agentsService.chatStream(req.body);

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
        res.status(400).json({ error: error.message, details: error.issues });
        return;
      }
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
        res.status(400).json({ error: error.message, details: error.issues });
        return;
      }
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
        res.status(400).json({ error: error.message, details: error.issues });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
