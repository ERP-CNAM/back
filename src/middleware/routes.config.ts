/**
 * Centralized Route Configuration
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type AccessLevel = 'public' | 'authenticated' | 'admin';

export interface RouteRule {
    path: string;
    method: HttpMethod | '*';
    access: AccessLevel;
}

/**
 * Route rules ordered by specificity (most specific first)
 */
export const ROUTE_RULES: RouteRule[] = [
    // ==================== PUBLIC ====================
    { path: '/auth/login', method: 'POST', access: 'public' },
    { path: '/auth/admin/login', method: 'POST', access: 'public' },
    { path: '/users', method: 'POST', access: 'public' }, // Registration

    // ==================== AUTHENTICATED ====================
    { path: '/subscriptions', method: '*', access: 'authenticated' },
    { path: '/subscriptions/:id', method: '*', access: 'authenticated' },

    // ==================== ADMIN ONLY ====================
    { path: '/users', method: 'GET', access: 'admin' },
    { path: '/users/:id', method: '*', access: 'admin' },
    { path: '/users/:id/status', method: 'PATCH', access: 'admin' },
    { path: '/billing/monthly', method: 'POST', access: 'admin' },
    { path: '/exports/accounting/monthly-invoices', method: 'GET', access: 'admin' },
    { path: '/exports/banking/direct-debits', method: 'GET', access: 'admin' },
    { path: '/reports/revenue/monthly', method: 'GET', access: 'admin' },
];

/**
 * Converts a route pattern to a regex
 * Supports :param placeholders (e.g., /users/:id -> /users/[^/]+)
 */
function patternToRegex(pattern: string): RegExp {
    const escaped = pattern
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
        .replace(/:[^/]+/g, '[^/]+'); // Replace :param with wildcard
    return new RegExp(`^${escaped}$`);
}

/**
 * Check if a path matches a pattern
 */
function matchPath(pattern: string, path: string): boolean {
    const regex = patternToRegex(pattern);
    return regex.test(path);
}

/**
 * Get the access level for a given path and method
 * Returns 'authenticated' as default if no matching rule found
 */
export function getAccessLevel(path: string, method: string): AccessLevel {
    const HTTP_METHOD = method.toUpperCase() as HttpMethod;

    for (const rule of ROUTE_RULES) {
        if (matchPath(rule.path, path)) {
            if (rule.method === '*' || rule.method === HTTP_METHOD) {
                return rule.access;
            }
        }
    }

    // Default: require authentication (safe default)
    return 'authenticated';
}
