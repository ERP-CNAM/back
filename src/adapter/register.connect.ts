import axios from 'axios';
import { ROUTES, AccessLevel, HttpMethod } from '../config/routes.config';
import { logger } from '../utils/logger';

const CONNECT_URL = String(process.env.CONNECT_URL);
const CONNECT_API_KEY = String(process.env.CONNECT_API_KEY);
const SERVICE_NAME = 'back';
const SERVICE_DESCRIPTION = 'Gamers ERP - Gestion des joueurs et des abonnements en backoffice';
const SERVICE_VERSION = '1.0.0';
const PORT = Number(process.env.PORT) || 3000;

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Converts an AccessLevel to a bitmask for Connect
 *
 * @param access The access level to convert
 * @returns The bitmask for the given access level
 */
function accessToBitmask(access: AccessLevel): number {
    switch (access) {
        case 'public':
            return 0;
        case 'authenticated':
            return 1;
        case 'admin':
            return 2;
        default:
            return 1;
    }
}

/**
 * Registers the service with Connect
 *
 * @returns Promise<void>
 */
export async function registerConnect() {
    logger.info(`[CONNECT] Attempting to register service '${SERVICE_NAME}'...`);

    const routes: any[] = [];

    for (const route of ROUTES) {
        const methodsToRegister = route.method === '*' ? HTTP_METHODS : [route.method as HttpMethod];
        const path = route.path.replace(/:([^/]+)/g, '{$1}'); // Convert :param to {param} for Connect

        for (const method of methodsToRegister) {
            routes.push({
                path,
                method,
                permission: accessToBitmask(route.access),
            });
        }
    }

    const registrationData = {
        name: SERVICE_NAME,
        description: SERVICE_DESCRIPTION,
        version: SERVICE_VERSION,
        apiKey: CONNECT_API_KEY,
        listeningPort: PORT,
        routes: routes,
    };

    if (!process.env.CONNECT_URL || process.env.CONNECT_URL === 'undefined') {
        logger.warn('[CONNECT] Skipping registration: CONNECT_URL is not set');
        return;
    }

    try {
        const response = await axios.post(`${CONNECT_URL}/register`, registrationData);
        logger.info(`[CONNECT] Registration successful: ${response.data.detail}`);
    } catch (error: any) {
        if (error.code === 'ERR_INVALID_URL') {
            logger.error(`[CONNECT] Registration failed: Invalid URL "${CONNECT_URL}"`);
        } else {
            logger.error(`[CONNECT] Registration failed: ${error.message}`);
        }

        if (error.response) {
            logger.error({ responseData: error.response.data }, `[CONNECT] Response data error`);
        }
    }
}
