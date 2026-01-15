import { logger } from '../utils/logger';
import { UserPayload } from '../utils/security';

const API_KEY = String(process.env.CONNECT_API_KEY);

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

/**
 * Middleware for processing requests from Connect Gateway or S2S services.
 *
 * Validates the API key, extracts user context from `userData`, and unwraps
 * the payload for downstream handlers. Requests without an `apiKey` are
 * bypassed and handled by `auth.middleware` for direct SPA access.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const connectMiddleware = (req: any, res: any, next: any) => {
    if (shouldBypassConnect(req)) {
        return next();
    }

    const connectRequest = req.body as ConnectRequest;

    if (!isValidRequestFormat(connectRequest)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid format, Connect request expected',
            payload: null,
        });
    }

    if (!isValidApiKey(connectRequest.apiKey)) {
        logger.error('[CONNECT] Invalid API key');
        return res.status(401).json({
            success: false,
            message: 'Invalid Connect API key',
            payload: null,
        });
    }

    // Request is from Connect API Gateway
    req.isConnectRequest = true;

    processConnectUser(req, connectRequest);
    unwrapPayload(req, connectRequest);

    logger.debug('[CONNECT] Request unwrapped successfully');
    next();
};

/**
 * Determines if the request should bypass Connect processing.
 *
 * Bypasses Swagger docs and requests without an `apiKey` (direct SPA access).
 *
 * @param req - Express request object
 * @returns `true` if Connect processing should be skipped
 */
function shouldBypassConnect(req: any): boolean {
    if (req.path.startsWith('/swagger')) {
        return true;
    }

    return !req.body?.apiKey;
}

/**
 * Validates that the request body is a valid object.
 *
 * @param body - Request body to validate
 * @returns `true` if the body is a non-null object
 */
function isValidRequestFormat(body: any): boolean {
    return body && typeof body === 'object';
}

/**
 * Validates the API key against the configured `CONNECT_API_KEY`.
 *
 * This establishes the trust boundary between Connect/S2S and the backend.
 *
 * @param apiKey - The API key from the request body
 * @returns `true` if the API key matches the configured secret
 */
function isValidApiKey(apiKey?: string): boolean {
    return apiKey === API_KEY;
}

/**
 * Extracts user information from Connect's `userData` and attaches it to `req.user`.
 *
 * If `userData` is empty (S2S call without user context), `req.user` remains undefined.
 *
 * @param req - Express request object
 * @param connectRequest - The parsed Connect request body containing `userData`
 */
function processConnectUser(req: any, connectRequest: ConnectRequest): void {
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
}

/**
 * Unwraps the original request body from Connect's `payload` field.
 *
 * Connect wraps the client's body as `{ apiKey, userData, payload }`.
 * This extracts `payload` and sets it as `req.body` for handlers.
 *
 * @param req - Express request object
 * @param connectRequest - The parsed Connect request body containing `payload`
 */
function unwrapPayload(req: any, connectRequest: ConnectRequest): void {
    if (connectRequest.payload !== undefined && connectRequest.payload !== null) {
        req.body = connectRequest.payload;
    } else {
        req.body = {};
    }
}
