import type {
    ListSubscriptions,
    CreateSubscription,
    GetSubscription,
    UpdateSubscription,
    CancelSubscription,
} from '../../../api/generated';

// GET /subscriptions
export const listSubscriptions: ListSubscriptions = async (params, respond) => {
    // TODO: Implement with database - filter by authenticated user
    const notImplemented = { params, respond };
    throw new Error(`Not implemented : ${notImplemented}`);
};

// POST /subscriptions
export const createSubscription: CreateSubscription = async (params, respond) => {
    // TODO: Implement with database
    const notImplemented = { params, respond };
    throw new Error(`Not implemented : ${notImplemented}`);
};

// GET /subscriptions/{subscriptionId}
export const getSubscription: GetSubscription = async (params, respond) => {
    // TODO: Implement with database
    const notImplemented = { params, respond };
    throw new Error(`Not implemented : ${notImplemented}`);
};

// PUT /subscriptions/{subscriptionId}
export const updateSubscription: UpdateSubscription = async (params, respond) => {
    // TODO: Implement with database
    const notImplemented = { params, respond };
    throw new Error(`Not implemented : ${notImplemented}`);
};

// DELETE /subscriptions/{subscriptionId}
export const cancelSubscription: CancelSubscription = async (params, respond) => {
    // TODO: Implement with database
    const notImplemented = { params, respond };
    throw new Error(`Not implemented : ${notImplemented}`);
};
