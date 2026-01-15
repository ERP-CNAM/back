import { describe, it, expect } from 'vitest';
import { getAccessLevel } from '../../src/middleware/routes.config';
import { PERMISSION, hasPermission } from '../../src/middleware/auth.middleware';

/**
 * Auth Middleware Integration Tests
 *
 * Tests the full authentication and authorization flow including:
 * - Route access level configuration
 * - Permission matrix enforcement
 */

describe('Routes Configuration', () => {
    describe('getAccessLevel()', () => {
        it('should return "public" for login routes', () => {
            expect(getAccessLevel('/auth/login', 'POST')).toBe('public');
            expect(getAccessLevel('/auth/admin/login', 'POST')).toBe('public');
        });

        it('should return "public" for user registration', () => {
            expect(getAccessLevel('/users', 'POST')).toBe('public');
        });

        it('should return "authenticated" for subscription routes', () => {
            expect(getAccessLevel('/subscriptions', 'GET')).toBe('authenticated');
            expect(getAccessLevel('/subscriptions', 'POST')).toBe('authenticated');
        });

        it('should return "admin" for user management routes', () => {
            expect(getAccessLevel('/users', 'GET')).toBe('admin');
            expect(getAccessLevel('/users/123', 'GET')).toBe('admin');
            expect(getAccessLevel('/users/123', 'PUT')).toBe('admin');
            expect(getAccessLevel('/users/123', 'DELETE')).toBe('admin');
        });

        it('should return "admin" for billing routes', () => {
            expect(getAccessLevel('/billing/monthly', 'POST')).toBe('admin');
            expect(getAccessLevel('/invoices', 'GET')).toBe('admin');
        });

        it('should return "admin" for export routes', () => {
            expect(getAccessLevel('/exports/accounting/monthly-invoices', 'GET')).toBe('admin');
            expect(getAccessLevel('/exports/banking/direct-debits', 'GET')).toBe('admin');
        });

        it('should return "admin" for report routes', () => {
            expect(getAccessLevel('/reports/revenue/monthly', 'GET')).toBe('admin');
        });

        it('should default to "authenticated" for unknown routes', () => {
            expect(getAccessLevel('/unknown/route', 'GET')).toBe('authenticated');
        });
    });
});

describe('Permission Matrix', () => {
    const users = [
        { name: 'anonymous', permission: 0 },
        { name: 'user', permission: PERMISSION.AUTHENTICATED },
        { name: 'admin', permission: PERMISSION.ADMIN },
    ];

    const routes = [
        { path: '/auth/login', method: 'POST', routePerm: 0 },
        { path: '/subscriptions', method: 'GET', routePerm: PERMISSION.AUTHENTICATED },
        { path: '/users', method: 'GET', routePerm: 2 }, // Admin routes require perm 2
    ];

    describe('Access matrix validation', () => {
        routes.forEach((route) => {
            describe(`${route.method} ${route.path}`, () => {
                users.forEach((user) => {
                    const shouldHaveAccess = hasPermission(user.permission, route.routePerm);
                    const accessResult = shouldHaveAccess ? 'ALLOW' : 'DENY';

                    it(`should ${accessResult} ${user.name}`, () => {
                        expect(hasPermission(user.permission, route.routePerm)).toBe(
                            shouldHaveAccess,
                        );
                    });
                });
            });
        });
    });
});
