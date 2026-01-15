import { pinoHttp } from 'pino-http';
import { logger } from '../utils/logger';

/**
 * Middleware for logging HTTP requests and responses using Pino
 */
export const loggerMiddleware = pinoHttp({
    logger,
});
