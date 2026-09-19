import { Router } from 'express';
import { AgentsController } from './agents.contoller';

const router = Router();
const agentsController = new AgentsController();

/**
 * @swagger
 * tags:
 *   name: Agents
 *   description: AI Agent conversation management
 */

/**
 * @swagger
 * /api/agents/chat:
 *   post:
 *     summary: Send a message to the AI agent
 *     tags: [Agents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: The user's message or question
 *                 example: "Hello, how are you?"
 *               threadId:
 *                 type: string
 *                 description: Optional thread ID to continue an existing conversation
 *                 example: "thread_12345"
 *     responses:
 *       200:
 *         description: Successful response from the agent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: The agent's response
 *                   example: "I'm doing well, thank you!"
 *                 threadId:
 *                   type: string
 *                   description: The thread ID for this conversation
 *                   example: "thread_12345"
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Internal server error
 */
router.post('/chat', (req, res) => agentsController.chat(req, res));

/**
 * @swagger
 * /api/agents/conversations:
 *   get:
 *     summary: Get all conversation threads
 *     tags: [Agents]
 *     responses:
 *       200:
 *         description: List of conversation threads
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "thread_12345"
 *                   resourceId:
 *                     type: string
 *                     example: "default"
 *                   title:
 *                     type: string
 *                     example: "New Conversation"
 *                   metadata:
 *                     type: object
 *                     additionalProperties: true
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Internal server error
 */
router.get('/conversations', (req, res) => agentsController.getConversations(req, res));

/**
 * @swagger
 * /api/agents/conversations/{threadId}:
 *   get:
 *     summary: Get a specific conversation by thread ID with its messages
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the conversation thread
 *         example: "thread_12345"
 *     responses:
 *       200:
 *         description: Conversation details with messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 threadId:
 *                   type: string
 *                   example: "thread_12345"
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       role:
 *                         type: string
 *                         enum: [user, assistant, system, tool, signal]
 *                       content:
 *                         type: object
 *                         additionalProperties: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Invalid thread ID
 *       500:
 *         description: Internal server error
 */
router.get('/conversations/:threadId', (req, res) => agentsController.getConversation(req, res));

/**
 * @swagger
 * /api/agents/conversations/{threadId}:
 *   delete:
 *     summary: Delete a conversation thread
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the conversation thread to delete
 *         example: "thread_12345"
 *     responses:
 *       200:
 *         description: Thread successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid thread ID
 *       500:
 *         description: Internal server error
 */
router.delete('/conversations/:threadId', (req, res) =>
  agentsController.deleteConversation(req, res)
);

/**
 * @swagger
 * /api/agents/messages/{messageId}:
 *   delete:
 *     summary: Delete a specific message
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the message to delete
 *         example: "msg_12345"
 *     responses:
 *       200:
 *         description: Message successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid message ID
 *       500:
 *         description: Internal server error
 */
router.delete('/messages/:messageId', (req, res) => agentsController.deleteMessage(req, res));

export default router;
