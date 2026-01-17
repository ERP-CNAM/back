import type {
    ListSubscriptions,
    CreateSubscription,
    GetSubscription,
    UpdateSubscription,
    CancelSubscription,
} from '../../../api/generated';
import type { SubscriptionService } from '../../service/subscription.service';
import type { UserPayload } from '../../utils/security';

/**
 * Creates the subscription handlers
 *
 * @param subscriptionService
 * @returns The subscription handlers
 */
export const createSubscriptionHandlers = (subscriptionService: SubscriptionService) => {
    /**
     * Lists the subscriptions
     *
     * @route GET /subscriptions
     *
     * @param params The request parameters
     * @param respond The response handler
     * @param req The request object
     *
     * @returns The response object
     */
    const listSubscriptions: ListSubscriptions = async (params, respond, req) => {
        const user = getUserPayload(req);

        const subscriptions = await subscriptionService.list(user, params.query);

        return respond.with200().body({
            success: true,
            message: 'Subscriptions retrieved successfully',
            payload: subscriptions,
        });
    };

    /**
     * Creates a subscription
     *
     * @route POST /subscriptions
     *
     * @param params The request parameters
     * @param respond The response handler
     * @param req The request object
     *
     * @returns The response object
     */
    const createSubscription: CreateSubscription = async (params, respond, req) => {
        const user = getUserPayload(req);

        const subscription = await subscriptionService.create(user, params.body);

        return respond.with201().body({
            success: true,
            message: 'Subscription created successfully',
            payload: subscription,
        });
    };

    /**
     * Gets a subscription
     *
     * @route GET /subscriptions/{subscriptionId}
     *
     * @param params The request parameters
     * @param respond The response handler
     * @param req The request object
     *
     * @returns The response object
     */
    const getSubscription: GetSubscription = async (params, respond, req) => {
        const { subscriptionId } = params.params;
        const user = getUserPayload(req);

        const subscription = await subscriptionService.getById(user, subscriptionId);

        if (!subscription) {
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

    /**
     * Updates a subscription
     *
     * @route PUT /subscriptions/{subscriptionId}
     *
     * @param params The request parameters
     * @param respond The response handler
     * @param req The request object
     *
     * @returns The response object
     */
    const updateSubscription: UpdateSubscription = async (params, respond, req) => {
        const { subscriptionId } = params.params;
        const user = getUserPayload(req);

        const updatedSubscription = await subscriptionService.update(user, subscriptionId, params.body);

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

    /**
     * Cancels a subscription
     *
     * @route DELETE /subscriptions/{subscriptionId}
     *
     * @param params The request parameters
     * @param respond The response handler
     * @param req The request object
     *
     * @returns The response object
     */
    const cancelSubscription: CancelSubscription = async (params, respond, req) => {
        const { subscriptionId } = params.params;
        const user = getUserPayload(req);

        const cancelled = await subscriptionService.cancel(user, subscriptionId);

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

/**
 * Gets the user payload from the request
 *
 * @param req The request object
 * @returns The user payload
 */
function getUserPayload(req: any): UserPayload | undefined {
    return (req as any).user as UserPayload | undefined;
}
