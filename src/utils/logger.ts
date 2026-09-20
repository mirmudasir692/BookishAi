import config from '../../config/app.config';
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'debug',
  transport: config.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
});

export default logger;
