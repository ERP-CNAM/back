import { logger } from '../utils/logger';

/**
 * Middleware to handle Connect request format
 */

const API_KEY = process.env.CONNECT_API_KEY || 'changethis';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

interface ConnectRequest {
    apiKey?: string;
    debug?: boolean;
    userData?: any;
    payload?: any;
}

function isLocalRequest(req: any): boolean {
    const ip = req.ip || req.connection?.remoteAddress || '';
    const isLocalIp = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';

    const origin = req.get('Origin') || '';
    const isLocalOrigin = origin.includes('localhost') || origin.includes('127.0.0.1');

    return isLocalIp || isLocalOrigin;
}

export const connectMiddleware = (req: any, res: any, next: any) => {
    if (req.path.startsWith('/swagger')) {
        return next();
    }

    // Dev: bypass Connect
    // Production: bypass only backoffice (localhost)
    if (!IS_PRODUCTION || isLocalRequest(req)) {
        return next();
    }
    const connectRequest = req.body as ConnectRequest;

    if (!connectRequest || typeof connectRequest !== 'object') {
        return res.status(400).json({
            success: false,
            message: 'Invalid format, Connect request expected',
        });
    }

    if (connectRequest.apiKey !== API_KEY) {
        logger.error('[CONNECT] Invalid API key');
        return res.status(401).json({
            success: false,
            message: 'Invalid Connect API key',
        });
    }

    if (connectRequest.payload !== undefined && connectRequest.payload !== null) {
        req.body = connectRequest.payload;
    } else {
        req.body = {};
    }

    logger.debug('[CONNECT] Request unwrapped successfully');
    next();
};
