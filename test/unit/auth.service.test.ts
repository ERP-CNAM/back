import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../src/service/auth.service';
import type { UserRepository } from '../../src/repository/user.repository';
import type { AdminRepository } from '../../src/repository/admin.repository';
import type { SubscriptionRepository } from '../../src/repository/subscription.repository';
import { security } from '../../src/utils/security';

// Mock the security utility
vi.mock('../../src/utils/security', () => ({
    security: {
        verifyPassword: vi.fn(),
        generateToken: vi.fn(),
        generateAdminToken: vi.fn(),
    },
}));

describe('AuthService', () => {
    let service: AuthService;
    let userRepoMock: UserRepository;
    let adminRepoMock: AdminRepository;
    let subscriptionRepoMock: SubscriptionRepository;

    beforeEach(() => {
        userRepoMock = {
            findWithPasswordByEmail: vi.fn(),
        } as unknown as UserRepository;

        adminRepoMock = {
            findWithPasswordByEmail: vi.fn(),
            updateLastLogin: vi.fn(),
        } as unknown as AdminRepository;

        subscriptionRepoMock = {
            hasActiveSubscription: vi.fn(),
        } as unknown as SubscriptionRepository;

        service = new AuthService(userRepoMock, adminRepoMock, subscriptionRepoMock);
    });

    describe('login', () => {
        it('should return success with token and user on valid credentials', async () => {
            const user = { id: 'u1', password: 'hashed-password', email: 'test@test.com' };
            vi.mocked(userRepoMock.findWithPasswordByEmail).mockResolvedValue(user as any);
            vi.mocked(security.verifyPassword).mockResolvedValue(true);
            vi.mocked(security.generateToken).mockReturnValue('fake-token');

            const result = await service.login({ email: 'test@test.com', password: 'password' });

            expect(result.success).toBe(true);
            expect(result.token).toBe('fake-token');
            expect(result.user).toEqual(expect.objectContaining({ email: 'test@test.com' }));
            expect(result.user).not.toHaveProperty('password');
        });

        it('should fail if user not found', async () => {
            vi.mocked(userRepoMock.findWithPasswordByEmail).mockResolvedValue(null);

            const result = await service.login({ email: 'test@test.com', password: 'password' });

            expect(result.success).toBe(false);
            expect(result.reason).toContain('not found');
        });

        it('should fail if password invalid', async () => {
            const user = { id: 'u1', password: 'hashed-password' };
            vi.mocked(userRepoMock.findWithPasswordByEmail).mockResolvedValue(user as any);
            vi.mocked(security.verifyPassword).mockResolvedValue(false);

            const result = await service.login({ email: 'test@test.com', password: 'wrong' });

            expect(result.success).toBe(false);
            expect(result.reason).toContain('Invalid password');
        });
    });

    describe('adminLogin', () => {
        it('should succeed for active admin with valid password', async () => {
            const admin = { id: 'a1', password: 'hash', isActive: 'true', email: 'admin@test.com' };
            vi.mocked(adminRepoMock.findWithPasswordByEmail).mockResolvedValue(admin as any);
            vi.mocked(security.verifyPassword).mockResolvedValue(true);
            vi.mocked(security.generateAdminToken).mockReturnValue('admin-token');

            const result = await service.adminLogin({ email: 'admin@test.com', password: 'pass' });

            expect(result.success).toBe(true);
            expect(result.token).toBe('admin-token');
            expect(adminRepoMock.updateLastLogin).toHaveBeenCalledWith('a1');
        });

        it('should fail if account is inactive', async () => {
            const admin = { id: 'a1', password: 'hash', isActive: 'false' };
            vi.mocked(adminRepoMock.findWithPasswordByEmail).mockResolvedValue(admin as any);

            const result = await service.adminLogin({ email: 'admin@test.com', password: 'pass' });

            expect(result.success).toBe(false);
            expect(result.reason).toBe('Account inactive');
        });
    });
});
