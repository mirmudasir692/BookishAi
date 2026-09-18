import { Request, Response } from 'express';
import { AgentsService, ValidationError } from './agents.service';
import {
  ChatInput,
  GetConversationsInput,
  GetConversationInput,
  DeleteConversationInput,
  ChatResponse,
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

  async chat(
    req: Request<Record<string, string>, ChatResponse | ErrorResponse, ChatInput>,
    res: Response<ChatResponse | ErrorResponse>
  ): Promise<void> {
    try {
      const result = await this.agentsService.chat(req.body);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message, details: error.issues });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
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
