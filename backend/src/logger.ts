import pino from 'pino';
import { config } from './config.js';

export const logger = pino({
  level: config.env === 'production' ? 'info' : 'debug',
  transport: config.env === 'production' ? undefined : {
    target: 'pino-pretty',
    options: { colorize: true, singleLine: false, translateTime: 'HH:MM:ss.l' },
  },
});
