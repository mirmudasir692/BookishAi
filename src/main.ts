import express from 'express';
import cors from 'cors';
import logger from './utils/logger';
import agentsRouter from './mastra/modules/agents/agents.routes';

const app = express();
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/api/agents', agentsRouter);

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  logger.info(`API server running on http://localhost:${PORT}`);
});

export default app;
