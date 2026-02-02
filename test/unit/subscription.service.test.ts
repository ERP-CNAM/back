import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubscriptionService } from '../../src/service/subscription.service';
import type { SubscriptionRepository } from '../../src/repository/subscription.repository';
import type { UserRepository } from '../../src/repository/user.repository';
import type { UserPayload } from '../../src/utils/security';

describe('SubscriptionService', () => {
    let service: SubscriptionService;
    let repoMock: SubscriptionRepository;
    let userRepoMock: UserRepository;

    beforeEach(() => {
        repoMock = {
            findAll: vi.fn(),
            findById: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            cancel: vi.fn(),
            findLastContractCode: vi.fn().mockResolvedValue(null),
        } as unknown as SubscriptionRepository;

        userRepoMock = {
            findById: vi.fn(),
            updateStatus: vi.fn(),
        } as unknown as UserRepository;

        service = new SubscriptionService(repoMock, userRepoMock);
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
        it('should force userId for non-admin users and update status if BLOCKED', async () => {
            const normalUser: UserPayload = { userId: 'u1', userType: 'user', permission: 1 };
            const body: any = { contractCode: 'C1', monthlyAmount: 10, startDate: '2023-01-01', userId: 'other-user' };

            vi.mocked(repoMock.create).mockResolvedValue({ id: 's1', ...body, userId: 'u1' });
            vi.mocked(userRepoMock.findById).mockResolvedValue({ id: 'u1', status: 'BLOCKED' } as any);

            await service.create(normalUser, body);

            expect(repoMock.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'u1', // Must override the body's userId
                }),
            );
            expect(userRepoMock.updateStatus).toHaveBeenCalledWith('u1', 'OK');
        });

        it('should not update status if user is already OK', async () => {
            const normalUser: UserPayload = { userId: 'u1', userType: 'user', permission: 1 };
            const body: any = { contractCode: 'C1', monthlyAmount: 10, startDate: '2023-01-01' };

            vi.mocked(repoMock.create).mockResolvedValue({ id: 's1', ...body, userId: 'u1' });
            vi.mocked(userRepoMock.findById).mockResolvedValue({ id: 'u1', status: 'OK' } as any);

            await service.create(normalUser, body);

            expect(userRepoMock.updateStatus).not.toHaveBeenCalled();
        });

        it('should allow admin to specify userId', async () => {
            const adminUser: UserPayload = { userId: 'admin', userType: 'admin', permission: 2 };
            const body: any = { contractCode: 'C1', monthlyAmount: 10, startDate: '2023-01-01', userId: 'other-user' };

            vi.mocked(repoMock.create).mockResolvedValue({ id: 's1', ...body });
            vi.mocked(userRepoMock.findById).mockResolvedValue({ id: 'other-user', status: 'BLOCKED' } as any);

            await service.create(adminUser, body);

            expect(repoMock.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'other-user', // Admin can set this
                }),
            );
            expect(userRepoMock.updateStatus).toHaveBeenCalledWith('other-user', 'OK');
        });

        it('should generate contractCode automatically if missing', async () => {
            const adminUser: UserPayload = { userId: 'admin', userType: 'admin', permission: 2 };
            const body: any = { monthlyAmount: 10, startDate: '2023-01-01', userId: 'u1' };

            vi.mocked(repoMock.findLastContractCode).mockResolvedValue('C003');
            vi.mocked(repoMock.create).mockResolvedValue({ id: 's1', ...body, contractCode: 'C004' });

            await service.create(adminUser, body);

            expect(repoMock.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    contractCode: 'C004',
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
