import express from 'express';
import agentsRouter from './mastra/modules/agents/agents.routes';

const app = express();
app.use('/api/agents', agentsRouter);