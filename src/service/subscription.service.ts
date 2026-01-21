import type { SubscriptionRepository } from '../repository/subscription.repository';
import type { UserRepository } from '../repository/user.repository';
import type { UserPayload } from '../utils/security';
import type { t_Subscription, t_CreateSubscriptionRequestBodySchema } from '../../api/models';

export class SubscriptionService {
    constructor(
        private readonly repository: SubscriptionRepository,
        private readonly userRepository: UserRepository,
    ) {}

    async list(user: UserPayload | undefined, query: any): Promise<t_Subscription[]> {
        const queryOptions = query ? { ...query } : {};

        // Non-admin users can only see their own subscriptions
        if (user?.userType !== 'admin' && user?.userId) {
            queryOptions.userId = user.userId;
        }

        return this.repository.findAll(queryOptions);
    }

    async create(user: UserPayload | undefined, body: t_CreateSubscriptionRequestBodySchema): Promise<t_Subscription> {
        // Non-admin users can only create subscriptions for themselves
        const userId = user?.userType !== 'admin' && user?.userId ? user.userId : body.userId;

        const payload = {
            ...body,
            userId,
        };

        const subscription = await this.repository.create(payload);

        // If the user was BLOCKED, we transition them to OK upon subscription
        if (userId) {
            const userData = await this.userRepository.findById(userId);
            if (userData && userData.status === 'BLOCKED') {
                await this.userRepository.updateStatus(userId, 'OK');
            }
        }

        return subscription;
    }

    async getById(user: UserPayload | undefined, subscriptionId: string): Promise<t_Subscription | null> {
        const subscription = await this.repository.findById(subscriptionId);

        if (!subscription || !this.hasAccess(user, subscription.userId)) {
            return null;
        }

        return subscription;
    }

    async update(
        user: UserPayload | undefined,
        subscriptionId: string,
        updates: Partial<t_Subscription>,
    ): Promise<t_Subscription | null> {
        const existing = await this.repository.findById(subscriptionId);
        if (!existing || !this.hasAccess(user, existing.userId)) {
            return null;
        }

        return this.repository.update(subscriptionId, updates);
    }

    async cancel(user: UserPayload | undefined, subscriptionId: string): Promise<t_Subscription | null> {
        const existing = await this.repository.findById(subscriptionId);
        if (!existing || !this.hasAccess(user, existing.userId)) {
            return null;
        }

        return this.repository.cancel(subscriptionId);
    }

    private hasAccess(user: UserPayload | undefined, subscriptionUserId?: string): boolean {
        // Enforce strict access control: request must have an authenticated user context
        if (!user) {
            return false;
        }

        // If subscription has no owner, access is denied (data integrity issue)
        if (!subscriptionUserId) {
            return false;
        }

        if (user.userType === 'admin') {
            return true;
        }

        return user.userId === subscriptionUserId;
    }
}
