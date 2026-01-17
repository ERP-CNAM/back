import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '../../../src/service/user.service';
import type { UserRepository } from '../../../src/repository/user.repository';

describe('UserService', () => {
    let service: UserService;
    let repoMock: UserRepository;

    beforeEach(() => {
        repoMock = {
            findAll: vi.fn(),
            findById: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            updateStatus: vi.fn(),
        } as unknown as UserRepository;

        service = new UserService(repoMock);
    });

    describe('CRUD Operations', () => {
        it('should call repository.findAll for list', async () => {
            await service.list({ status: 'OK' });
            expect(repoMock.findAll).toHaveBeenCalledWith({ status: 'OK' });
        });

        it('should call repository.findById for getById', async () => {
            await service.getById('u1');
            expect(repoMock.findById).toHaveBeenCalledWith('u1');
        });

        it('should call repository.create for create', async () => {
            const data: any = { email: 't@t.com' };
            await service.create(data);
            expect(repoMock.create).toHaveBeenCalledWith(data);
        });

        it('should call repository.update for update', async () => {
            const data: any = { firstName: 'New' };
            await service.update('u1', data);
            expect(repoMock.update).toHaveBeenCalledWith('u1', data);
        });

        it('should call repository.delete for delete', async () => {
            await service.delete('u1');
            expect(repoMock.delete).toHaveBeenCalledWith('u1');
        });

        it('should call repository.updateStatus for updateStatus', async () => {
            await service.updateStatus('u1', 'BLOCKED');
            expect(repoMock.updateStatus).toHaveBeenCalledWith('u1', 'BLOCKED');
        });
    });
});
