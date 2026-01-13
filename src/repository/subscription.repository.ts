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
    findAll(options?: SubscriptionQueryOptions): Promise<t_SubscriptionDetailed[]>;

    findById(id: string): Promise<t_SubscriptionDetailed | null>;

    create(data: t_CreateSubscriptionRequestBodySchema): Promise<t_Subscription>;

    update(id: string, data: t_UpdateSubscriptionRequestBodySchema): Promise<t_Subscription | null>;

    cancel(id: string): Promise<t_Subscription | null>;
}
