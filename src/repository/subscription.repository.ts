import type {
    t_CreateSubscriptionRequestBodySchema,
    t_Subscription,
    t_SubscriptionDetailed,
    t_SubscriptionStatus,
    t_UpdateSubscriptionRequestBodySchema,
} from '../../api/models';

export interface SubscriptionQueryOptions {
    userId?: string;
    status?: t_SubscriptionStatus;
}

export interface SubscriptionRepository {
    /**
     * Finds all subscriptions
     * 
     * @param options The query options (userId, status)
     * @returns All subscriptions
     */
    findAll(options?: SubscriptionQueryOptions): Promise<t_SubscriptionDetailed[]>;

    /**
     * Finds a subscription by id
     * 
     * @param id The id of the subscription
     * @returns The subscription
     */
    findById(id: string): Promise<t_SubscriptionDetailed | null>;

    /**
     * Creates a subscription
     * 
     * @param data The subscription data
     * @returns The created subscription
     */
    create(data: t_CreateSubscriptionRequestBodySchema): Promise<t_Subscription>;

    /**
     * Updates a subscription
     * 
     * @param id The id of the subscription
     * @param data The subscription data
     * @returns The updated subscription
     */
    update(id: string, data: t_UpdateSubscriptionRequestBodySchema): Promise<t_Subscription | null>;

    /**
     * Cancels a subscription
     * 
     * @param id The id of the subscription
     * @returns The cancelled subscription
     */
    cancel(id: string): Promise<t_Subscription | null>;
}
