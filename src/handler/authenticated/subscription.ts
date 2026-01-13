import type {
    ListSubscriptions,
    CreateSubscription,
    GetSubscription,
    UpdateSubscription,
    CancelSubscription,
} from '../../../api/generated';
import type { SubscriptionRepository } from '../../repository/subscription.repository';
import type { UserPayload } from '../../utils/security';

function getUserPayload(req: any): UserPayload | undefined {
    return (req as any).user as UserPayload | undefined;
}

function hasAccessToSubscription(user: UserPayload | undefined, subscriptionUserId?: string) {
    if (!user || !subscriptionUserId) {
        return true;
    }

    if (user.userType === 'admin') {
        return true;
    }

    return user.userId === subscriptionUserId;
}

export const createSubscriptionHandlers = (repository: SubscriptionRepository) => {
    // GET /subscriptions
    const listSubscriptions: ListSubscriptions = async (params, respond, req) => {
        const user = getUserPayload(req);
        const queryOptions = params.query ? { ...params.query } : {};

        // Non-admin users can only see their own subscriptions
        if (user?.userType !== 'admin' && user?.userId) {
            queryOptions.userId = user.userId;
        }

        const subscriptions = await repository.findAll(queryOptions);

        return respond.with200().body({
            success: true,
            message: 'Subscriptions retrieved successfully',
            payload: subscriptions,
        });
    };

    // POST /subscriptions
    const createSubscription: CreateSubscription = async (params, respond, req) => {
        const user = getUserPayload(req);
        const body = params.body;

        // Non-admin users can only create subscriptions for themselves
        const payload = {
            ...body,
            userId: user?.userType !== 'admin' && user?.userId ? user.userId : body.userId,
        };

        const subscription = await repository.create(payload);

        return respond.with201().body({
            success: true,
            message: 'Subscription created successfully',
            payload: subscription,
        });
    };

    // GET /subscriptions/{subscriptionId}
    const getSubscription: GetSubscription = async (params, respond, req) => {
        const { subscriptionId } = params.params;
        const user = getUserPayload(req);

        const subscription = await repository.findById(subscriptionId);

        if (!subscription || !hasAccessToSubscription(user, subscription.userId)) {
            return respond.with404().body({
                success: false,
                message: 'Subscription not found',
                payload: null,
            });
        }

        return respond.with200().body({
            success: true,
            message: 'Subscription retrieved successfully',
            payload: subscription,
        });
    };

    // PUT /subscriptions/{subscriptionId}
    const updateSubscription: UpdateSubscription = async (params, respond, req) => {
        const { subscriptionId } = params.params;
        const user = getUserPayload(req);

        const existing = await repository.findById(subscriptionId);
        if (!existing || !hasAccessToSubscription(user, existing.userId)) {
            return respond.with404().body({
                success: false,
                message: 'Subscription not found',
                payload: null,
            });
        }

        const updatedSubscription = await repository.update(subscriptionId, params.body);

        if (!updatedSubscription) {
            return respond.with404().body({
                success: false,
                message: 'Subscription not found',
                payload: null,
            });
        }

        return respond.with200().body({
            success: true,
            message: 'Subscription updated successfully',
            payload: updatedSubscription,
        });
    };

    // DELETE /subscriptions/{subscriptionId}
    const cancelSubscription: CancelSubscription = async (params, respond, req) => {
        const { subscriptionId } = params.params;
        const user = getUserPayload(req);

        const existing = await repository.findById(subscriptionId);
        if (!existing || !hasAccessToSubscription(user, existing.userId)) {
            return respond.with404().body({
                success: false,
                message: 'Subscription not found',
                payload: null,
            });
        }

        const cancelled = await repository.cancel(subscriptionId);

        if (!cancelled) {
            return respond.with404().body({
                success: false,
                message: 'Subscription not found',
                payload: null,
            });
        }

        return respond.with200().body({
            success: true,
            message: 'Subscription cancelled successfully',
            payload: cancelled,
        });
    };

    return {
        listSubscriptions,
        createSubscription,
        getSubscription,
        updateSubscription,
        cancelSubscription,
    };
};
