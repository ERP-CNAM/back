import { logger } from '../utils/logger';

const DEBUG_ENABLED = process.env.DEBUG_ENABLED === 'true';
const PRODUCTION_ENABLED = process.env.NODE_ENV === 'production';

/**
 * Middleware to log raw request data before Zod parsing for validation
 * 
 * @param req - Express request object
 * @param _res - Express response object
 * @param next - Express next function
 */
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
