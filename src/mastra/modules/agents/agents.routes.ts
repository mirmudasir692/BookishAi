import { Router } from 'express';
import { AgentsController } from './agents.contoller';

const router = Router();
const agentsController = new AgentsController();

router.post('/chat', (req, res) => agentsController.chat(req, res));
router.get('/conversations', (req, res) => agentsController.getConversations(req, res));
router.get('/conversations/:threadId', (req, res) => agentsController.getConversation(req, res));
router.delete('/conversations/:threadId', (req, res) =>
  agentsController.deleteConversation(req, res)
);

export default router;
