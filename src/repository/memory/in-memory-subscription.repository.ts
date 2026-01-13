import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { and, eq } from 'drizzle-orm';
import type { SubscriptionQueryOptions, SubscriptionRepository } from '../subscription.repository';
import type {
    t_CreateSubscriptionRequestBodySchema,
    t_Subscription,
    t_SubscriptionDetailed,
    t_SubscriptionStatus,
    t_UserStatus,
    t_UpdateSubscriptionRequestBodySchema,
} from '../../../api/models';
import { subscriptions, users } from '../../database/memory/schema';
import { generateUUID } from '../../utils/uuid';

const VALID_SUBSCRIPTION_STATUSES: t_SubscriptionStatus[] = ['ACTIVE', 'CANCELLED', 'PENDING_CANCEL'];

export class InMemorySubscriptionRepository implements SubscriptionRepository {
    constructor(private db: BetterSQLite3Database) { }

    private toSubscriptionDetailed(row: any): t_SubscriptionDetailed {
        return {
            id: row.subscriptions.id,
            userId: row.subscriptions.userId,
            contractCode: row.subscriptions.contractCode,
            startDate: row.subscriptions.startDate,
            endDate: row.subscriptions.endDate ?? null,
            monthlyAmount: row.subscriptions.monthlyAmount,
            promoCode: row.subscriptions.promoCode ?? null,
            status: row.subscriptions.status as t_SubscriptionStatus,
            user: {
                id: row.users.id,
                firstName: row.users.firstName,
                lastName: row.users.lastName,
                email: row.users.email,
                status: row.users.status as t_UserStatus,
            }
        };
    }

    async findAll(options?: SubscriptionQueryOptions): Promise<t_SubscriptionDetailed[]> {
        const conditions = [];

        if (options?.userId) {
            conditions.push(eq(subscriptions.userId, options.userId));
        }

        if (options?.status) {
            conditions.push(eq(subscriptions.status, options.status));
        }

        let query = this.db
            .select()
            .from(subscriptions)
            .innerJoin(users, eq(subscriptions.userId, users.id));

        if (conditions.length > 0) {
            query = query.where(and(...conditions)) as any;
        }

        return query.all().map((row) => this.toSubscriptionDetailed(row));
    }

    async findById(id: string): Promise<t_SubscriptionDetailed | null> {
        const rows = this.db
            .select()
            .from(subscriptions)
            .innerJoin(users, eq(subscriptions.userId, users.id))
            .where(eq(subscriptions.id, id))
            .limit(1)
            .all();
        return rows[0] ? this.toSubscriptionDetailed(rows[0]) : null;
    }

    async create(data: t_CreateSubscriptionRequestBodySchema): Promise<t_Subscription> {
        const subscription: t_Subscription = {
            id: generateUUID(),
            userId: data.userId,
            contractCode: data.contractCode,
            startDate: data.startDate,
            endDate: null,
            monthlyAmount: data.monthlyAmount,
            promoCode: data.promoCode ?? null,
            status: 'ACTIVE',
        };

        this.db
            .insert(subscriptions)
            .values({
                id: subscription.id!,
                userId: subscription.userId!,
                contractCode: subscription.contractCode!,
                startDate: subscription.startDate!,
                endDate: subscription.endDate,
                monthlyAmount: subscription.monthlyAmount!,
                promoCode: subscription.promoCode,
                status: subscription.status!,
            })
            .run();

        return subscription;
    }

    async update(id: string, data: t_UpdateSubscriptionRequestBodySchema): Promise<t_Subscription | null> {
        const existing = await this.findById(id);
        if (!existing) {
            return null;
        }

        if (data.status && !VALID_SUBSCRIPTION_STATUSES.includes(data.status)) {
            throw new Error(`Invalid subscription status: ${data.status}`);
        }

        const updated: t_Subscription = {
            ...existing,
            endDate: data.endDate !== undefined ? data.endDate : existing.endDate,
            monthlyAmount: data.monthlyAmount ?? existing.monthlyAmount,
            promoCode: data.promoCode !== undefined ? data.promoCode : existing.promoCode,
            status: data.status ?? existing.status,
        };

        this.db
            .update(subscriptions)
            .set({
                endDate: updated.endDate,
                monthlyAmount: updated.monthlyAmount,
                promoCode: updated.promoCode,
                status: updated.status,
            })
            .where(eq(subscriptions.id, id))
            .run();

        return updated;
    }

    async cancel(id: string): Promise<t_Subscription | null> {
        const existing = await this.findById(id);
        if (!existing) {
            return null;
        }

        const endDate = existing.endDate ?? new Date().toISOString().slice(0, 10);
        const updated: t_Subscription = {
            ...existing,
            endDate,
            status: 'CANCELLED',
        };

        this.db
            .update(subscriptions)
            .set({
                endDate: updated.endDate,
                status: updated.status,
            })
            .where(eq(subscriptions.id, id))
            .run();

        return updated;
    }
}
