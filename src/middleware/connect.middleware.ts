import { logger } from '../utils/logger';
import { UserPayload } from '../utils/security';

/**
 * Middleware to handle Connect request format
 *
 * Connect validates JWT and sends decoded userData in the request body.
 * This middleware extracts userData and attaches it to req.user for
 * the auth middleware to use.
 */

const API_KEY = String(process.env.CONNECT_API_KEY);
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

interface ConnectUserData {
    userId: string;
    permission: number;
    exp: number;
}

interface ConnectRequest {
    apiKey?: string;
    debug?: boolean;
    userData?: ConnectUserData;
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

    // Extract userData from Connect and attach to req.user
    if (connectRequest.userData && connectRequest.userData.userId) {
        const userPayload: UserPayload = {
            userId: connectRequest.userData.userId,
            userType: connectRequest.userData.permission >= 2 ? 'admin' : 'user',
            permission: connectRequest.userData.permission,
        };
        req.user = userPayload;

        if (req.log) {
            req.log = req.log.child({
                userId: userPayload.userId,
                userType: userPayload.userType,
            });
        }

        logger.debug({ userId: userPayload.userId }, '[CONNECT] User authenticated via Connect');
    }

    if (connectRequest.payload !== undefined && connectRequest.payload !== null) {
        req.body = connectRequest.payload;
    } else {
        req.body = {};
    }

    logger.debug('[CONNECT] Request unwrapped successfully');
    next();
};
