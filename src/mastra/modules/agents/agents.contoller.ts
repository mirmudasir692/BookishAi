import { Request, Response } from 'express';
import { AgentsService, ValidationError } from './agents.service';

export class AgentsController {
  private agentsService: AgentsService;

  constructor() {
    this.agentsService = new AgentsService();
  }

  async chat(req: Request, res: Response): Promise<void> {
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

  async getConversations(_req: Request, res: Response): Promise<void> {
    try {
      const result = await this.agentsService.getConversations();
      res.status(200).json(result);
    } catch (_error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getConversation(req: Request, res: Response): Promise<void> {
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

  async deleteConversation(req: Request, res: Response): Promise<void> {
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
