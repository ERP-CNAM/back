import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubscriptionService } from '../../../src/service/subscription.service';
import type { SubscriptionRepository } from '../../../src/repository/subscription.repository';
import type { UserPayload } from '../../../src/utils/security';

describe('SubscriptionService', () => {
    let service: SubscriptionService;
    let repoMock: SubscriptionRepository;

    beforeEach(() => {
        repoMock = {
            findAll: vi.fn(),
            findById: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            cancel: vi.fn(),
        } as unknown as SubscriptionRepository;

        service = new SubscriptionService(repoMock);
    });

    describe('list', () => {
        it('should allow admin to list all subscriptions', async () => {
            const adminUser: UserPayload = { userId: 'admin-id', userType: 'admin', permission: 2 };
            await service.list(adminUser, {});
            expect(repoMock.findAll).toHaveBeenCalledWith({});
        });

        it('should force userId filter for non-admin users', async () => {
            const normalUser: UserPayload = { userId: 'u1', userType: 'user', permission: 1 };
            await service.list(normalUser, { status: 'ACTIVE' });
            expect(repoMock.findAll).toHaveBeenCalledWith({ status: 'ACTIVE', userId: 'u1' });
        });
    });

    describe('create', () => {
        it('should force userId for non-admin users', async () => {
            const normalUser: UserPayload = { userId: 'u1', userType: 'user', permission: 1 };
            const body: any = { contractCode: 'C1', monthlyAmount: 10, startDate: '2023-01-01', userId: 'other-user' };

            await service.create(normalUser, body);

            expect(repoMock.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'u1', // Must override the body's userId
                }),
            );
        });

        it('should allow admin to specify userId', async () => {
            const adminUser: UserPayload = { userId: 'admin', userType: 'admin', permission: 2 };
            const body: any = { contractCode: 'C1', monthlyAmount: 10, startDate: '2023-01-01', userId: 'other-user' };

            await service.create(adminUser, body);

            expect(repoMock.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'other-user', // Admin can set this
                }),
            );
        });
    });

    describe('Access Control (getById/update/cancel)', () => {
        const subId = 'sub-1';
        const subData: any = { id: subId, userId: 'owner-id' };

        beforeEach(() => {
            vi.mocked(repoMock.findById).mockResolvedValue(subData);
            vi.mocked(repoMock.update).mockResolvedValue({ ...subData, updated: true });
            vi.mocked(repoMock.cancel).mockResolvedValue({ ...subData, status: 'CANCELLED' });
        });

        it('should deny access if user is undefined (Deny by Default)', async () => {
            const result = await service.getById(undefined, subId);
            expect(result).toBeNull(); // Should fail
        });

        it('should deny access if user is not owner and not admin', async () => {
            const otherUser: UserPayload = { userId: 'imposter', userType: 'user', permission: 1 };
            const result = await service.getById(otherUser, subId);
            expect(result).toBeNull();
        });

        it('should allow access if user is owner', async () => {
            const owner: UserPayload = { userId: 'owner-id', userType: 'user', permission: 1 };
            const result = await service.getById(owner, subId);
            expect(result).toEqual(subData);
        });

        it('should allow access if user is admin', async () => {
            const admin: UserPayload = { userId: 'admin', userType: 'admin', permission: 2 };
            const result = await service.getById(admin, subId);
            expect(result).toEqual(subData);
        });
    });
});
