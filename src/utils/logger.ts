import env from 'config/env.config';
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
});

export default logger;
