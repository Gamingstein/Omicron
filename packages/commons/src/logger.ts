import pino from 'pino';
import { env } from './env';

const transport = pino.transport({
  target: 'pino-pretty',
  options: { colorize: true },
});

export const logger = pino(
  {
    level: env.LOG_LEVEL || 'info',
    base: {
      pid: false,
    },
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
  },
  transport,
);
