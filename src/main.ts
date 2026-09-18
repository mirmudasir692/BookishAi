import express from 'express';
import cors from 'cors';
import agentsRouter from './mastra/modules/agents/agents.routes';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/agents', agentsRouter);

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});

export default app;
