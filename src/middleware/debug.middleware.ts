import { logger } from '../utils/logger';

/**
 * Debug middleware to log raw request data BEFORE Zod parsing
 */

const DEBUG_ENABLED = process.env.DEBUG_ENABLED === 'true';
const PRODUCTION_ENABLED = process.env.NODE_ENV === 'production';

export const debugRequestMiddleware = (req: any, _res: any, next: any) => {
    if (!DEBUG_ENABLED && PRODUCTION_ENABLED) {
        return next();
    }

    if (req.body && Object.keys(req.body).length > 0) {
        const sanitizedBody = { ...req.body };
        if (sanitizedBody.password) {
            sanitizedBody.password = '***MASKED***';
        }
        logger.debug({ body: sanitizedBody }, 'Request Body (raw)');
    } else {
        logger.debug('Request Body: (empty)');
    }

    next();
};
