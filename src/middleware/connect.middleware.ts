/**
 * Middleware to handle Connect request format
 */

const API_KEY = process.env.CONNECT_API_KEY || 'your-api-key-change-it';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const BYPASS_CONNECT = !IS_PRODUCTION && process.env.BYPASS_CONNECT === 'true';

interface ConnectRequest {
    apiKey?: string;
    debug?: boolean;
    userData?: any;
    payload?: any;
}

export const connectMiddleware = (req: any, res: any, next: any) => {
    if (BYPASS_CONNECT) {
        return next();
    }

    if (req.path.startsWith('/swagger')) {
        return next();
    }

    const connectRequest = req.body as ConnectRequest;

    if (!connectRequest || typeof connectRequest !== 'object') {
        return res.status(400).json({
            success: false,
            message: 'Invalid format, Connect request',
        });
    }

    if (connectRequest.apiKey !== API_KEY) {
        console.error('[ERROR] Invalid Connect API key');
        return res.status(401).json({
            success: false,
            message: 'Invalid Connect key',
        });
    }

    if (connectRequest.payload !== undefined && connectRequest.payload !== null) {
        req.body = connectRequest.payload;
    } else {
        req.body = {};
    }

    console.log('[INFO] Connect request unwrapped successfully');
    next();
};
