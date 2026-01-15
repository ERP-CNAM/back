import { describe, it, expect } from 'vitest';
import { PERMISSION, accessLevelToPermission, hasPermission } from '../../src/middleware/auth.middleware';

/**
 * Permission Bitmask Unit Tests
 *
 * Tests the bitmask logic used by both Connect Gateway and Backend.
 */

describe('Permission Bitmask Logic', () => {
    describe('hasPermission()', () => {
        describe('PUBLIC routes (permission: 0)', () => {
            const routePerm = PERMISSION.PUBLIC;

            it('should allow anonymous users (perm: 0)', () => {
                expect(hasPermission(0, routePerm)).toBe(true);
            });

            it('should allow authenticated users (perm: 1)', () => {
                expect(hasPermission(PERMISSION.AUTHENTICATED, routePerm)).toBe(true);
            });

            it('should allow admin users (perm: 3)', () => {
                expect(hasPermission(PERMISSION.ADMIN, routePerm)).toBe(true);
            });
        });

        describe('AUTHENTICATED routes (permission: 1)', () => {
            const routePerm = PERMISSION.AUTHENTICATED;

            it('should deny anonymous users (perm: 0)', () => {
                expect(hasPermission(0, routePerm)).toBe(false);
            });

            it('should allow authenticated users (perm: 1)', () => {
                expect(hasPermission(PERMISSION.AUTHENTICATED, routePerm)).toBe(true);
            });

            it('should allow admin users (perm: 3)', () => {
                expect(hasPermission(PERMISSION.ADMIN, routePerm)).toBe(true);
            });
        });

        describe('ADMIN routes (permission: 2)', () => {
            const routePerm = 2; // Route requires admin bit

            it('should deny anonymous users (perm: 0)', () => {
                expect(hasPermission(0, routePerm)).toBe(false);
            });

            it('should deny authenticated users (perm: 1)', () => {
                expect(hasPermission(PERMISSION.AUTHENTICATED, routePerm)).toBe(false);
            });

            it('should allow admin users (perm: 3)', () => {
                expect(hasPermission(PERMISSION.ADMIN, routePerm)).toBe(true);
            });
        });
    });

    describe('accessLevelToPermission()', () => {
        it('should convert "public" to 0', () => {
            expect(accessLevelToPermission('public')).toBe(PERMISSION.PUBLIC);
        });

        it('should convert "authenticated" to 1', () => {
            expect(accessLevelToPermission('authenticated')).toBe(PERMISSION.AUTHENTICATED);
        });

        it('should convert "admin" to 3', () => {
            expect(accessLevelToPermission('admin')).toBe(PERMISSION.ADMIN);
        });

        it('should default unknown levels to ADMIN (most restrictive)', () => {
            expect(accessLevelToPermission('unknown')).toBe(PERMISSION.ADMIN);
        });
    });

    describe('Admin access to all routes', () => {
        it('admin should access public routes', () => {
            expect(hasPermission(PERMISSION.ADMIN, accessLevelToPermission('public'))).toBe(true);
        });

        it('admin should access authenticated routes', () => {
            expect(hasPermission(PERMISSION.ADMIN, accessLevelToPermission('authenticated'))).toBe(true);
        });

        it('admin should access admin routes', () => {
            expect(hasPermission(PERMISSION.ADMIN, 2)).toBe(true);
        });
    });

    describe('User restrictions', () => {
        it('user should NOT access admin routes', () => {
            expect(hasPermission(PERMISSION.AUTHENTICATED, 2)).toBe(false);
        });

        it('user should access authenticated routes', () => {
            expect(hasPermission(PERMISSION.AUTHENTICATED, PERMISSION.AUTHENTICATED)).toBe(true);
        });

        it('anonymous should only access public routes', () => {
            expect(hasPermission(0, PERMISSION.PUBLIC)).toBe(true);
            expect(hasPermission(0, PERMISSION.AUTHENTICATED)).toBe(false);
            expect(hasPermission(0, 2)).toBe(false);
        });
    });
});
