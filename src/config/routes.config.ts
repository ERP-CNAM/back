/**
 * Centralized Route Configuration - GENERATED FROM OPENAPI.YAML
 * DO NOT EDIT MANUALLY
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type AccessLevel = 'public' | 'authenticated' | 'admin';

export interface Route {
    path: string;
    method: HttpMethod | '*';
    access: AccessLevel;
}

/**
 * Route rules ordered by specificity (most specific first)
 */
export const ROUTES: Route[] = [
    // ==================== PUBLIC ====================
    { path: '/auth/admin/login', method: 'POST', access: 'public' },
    { path: '/auth/login', method: 'POST', access: 'public' },
    { path: '/users', method: 'POST', access: 'public' },

    // ==================== AUTHENTICATED ====================
    { path: '/users/:userId', method: 'GET', access: 'authenticated' },
    { path: '/users/:userId', method: 'PUT', access: 'authenticated' },
    { path: '/subscriptions/:subscriptionId', method: 'GET', access: 'authenticated' },
    { path: '/subscriptions/:subscriptionId', method: 'PUT', access: 'authenticated' },
    { path: '/subscriptions/:subscriptionId', method: 'DELETE', access: 'authenticated' },
    { path: '/subscriptions', method: 'GET', access: 'authenticated' },
    { path: '/subscriptions', method: 'POST', access: 'authenticated' },

    // ==================== ADMIN ONLY ====================
    { path: '/exports/banking/direct-debits', method: 'GET', access: 'admin' },
    { path: '/reports/revenue/monthly', method: 'GET', access: 'admin' },
    { path: '/users/:userId/status', method: 'PATCH', access: 'admin' },
    { path: '/billing/monthly', method: 'POST', access: 'admin' },
    { path: '/bank/payment-updates', method: 'POST', access: 'admin' },
    { path: '/users/:userId', method: 'DELETE', access: 'admin' },
    { path: '/users', method: 'GET', access: 'admin' },
    { path: '/invoices', method: 'GET', access: 'admin' },
];

/**
 * Converts a route pattern to a regex

 * @param pattern The route pattern to convert
 * @returns The regex pattern
 */
function patternToRegex(pattern: string): RegExp {
    const escaped = pattern
        .replace(/[.*+?^${}()|[]\]/g, '\\$&') // Escape special regex chars
        .replace(/:[^/]+/g, '[^/]+'); // Replace :param with wildcard
    return new RegExp(`^${escaped}$`);
}

/**
 * Check if a path matches a pattern

 * @param pattern The route pattern to check
 * @param path The path to check
 * @returns True if the path matches the pattern, false otherwise
 */
function matchPath(pattern: string, path: string): boolean {
    const regex = patternToRegex(pattern);
    return regex.test(path);
}

/**
 * Get the access level for a given path and method

 * @param path The path to check
 * @param method The method to check
 * @returns The access level for the given path and method
 */
export function getAccessLevel(path: string, method: string): AccessLevel {
    const HTTP_METHOD = method.toUpperCase() as HttpMethod;

    for (const route of ROUTES) {
        if (matchPath(route.path, path)) {
            if (route.method === '*' || route.method === HTTP_METHOD) {
                return route.access;
            }
        }
    }

    // Default: require authentication (safe default)
    return 'authenticated';
}
