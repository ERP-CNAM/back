import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq } from 'drizzle-orm';
import type { SubscriptionQueryOptions, SubscriptionRepository } from '../subscription.repository';
import type {
    t_CreateSubscriptionRequestBodySchema,
    t_Subscription,
    t_SubscriptionStatus,
    t_UpdateSubscriptionRequestBodySchema,
} from '../../../api/models';
import { subscriptions } from '../../database/postgres/schema';
import { generateUUID } from '../../utils/uuid';

const VALID_SUBSCRIPTION_STATUSES: t_SubscriptionStatus[] = ['ACTIVE', 'CANCELLED', 'PENDING_CANCEL'];

export class PostgresSubscriptionRepository implements SubscriptionRepository {
    constructor(private db: NodePgDatabase) {}

    private toSubscription(row: typeof subscriptions.$inferSelect): t_Subscription {
        const startDate = row.startDate ? row.startDate.toISOString().slice(0, 10) : undefined;
        const endDate = row.endDate ? row.endDate.toISOString().slice(0, 10) : null;
        return {
            id: row.id,
            userId: row.userId,
            contractCode: row.contractCode,
            startDate,
            endDate,
            monthlyAmount: row.monthlyAmount !== null ? Number(row.monthlyAmount) : undefined,
            promoCode: row.promoCode ?? null,
            status: row.status as t_SubscriptionStatus,
        };
    }

    async findAll(options?: SubscriptionQueryOptions): Promise<t_Subscription[]> {
        let query = this.db.select().from(subscriptions);
        const conditions = [];

        if (options?.userId) {
            conditions.push(eq(subscriptions.userId, options.userId));
        }

        if (options?.status) {
            conditions.push(eq(subscriptions.status, options.status));
        }

        if (conditions.length > 0) {
            query = query.where(and(...conditions)) as any;
        }

        const rows = await query.execute();
        return rows.map((row) => this.toSubscription(row));
    }

    async findById(id: string): Promise<t_Subscription | null> {
        const rows = await this.db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1).execute();
        return rows[0] ? this.toSubscription(rows[0]) : null;
    }

    async create(data: t_CreateSubscriptionRequestBodySchema): Promise<t_Subscription> {
        const id = generateUUID();
        const values: typeof subscriptions.$inferInsert = {
            id,
            userId: data.userId,
            contractCode: data.contractCode,
            startDate: new Date(data.startDate),
            endDate: null,
            monthlyAmount: String(data.monthlyAmount),
            promoCode: data.promoCode ?? null,
            status: 'ACTIVE',
        };

        const [inserted] = await this.db
            .insert(subscriptions)
            .values(values)
            .returning();

        if (!inserted) {
            throw new Error('Failed to create subscription');
        }

        return this.toSubscription(inserted);
    }

    async update(id: string, data: t_UpdateSubscriptionRequestBodySchema): Promise<t_Subscription | null> {
        const existing = await this.findById(id);
        if (!existing) {
            return null;
        }

        if (data.status && !VALID_SUBSCRIPTION_STATUSES.includes(data.status)) {
            throw new Error(`Invalid subscription status: ${data.status}`);
        }

        const updateData: Partial<typeof subscriptions.$inferInsert> = {};

        if (data.endDate !== undefined) {
            updateData.endDate = data.endDate ? new Date(data.endDate) : null;
        }

        if (data.monthlyAmount !== undefined) {
            updateData.monthlyAmount = String(data.monthlyAmount);
        }

        if (data.promoCode !== undefined) {
            updateData.promoCode = data.promoCode;
        }

        if (data.status !== undefined) {
            updateData.status = data.status;
        }

        if (Object.keys(updateData).length === 0) {
            return existing;
        }

        const [updated] = await this.db
            .update(subscriptions)
            .set(updateData)
            .where(eq(subscriptions.id, id))
            .returning();

        return updated ? this.toSubscription(updated) : null;
    }

    async cancel(id: string): Promise<t_Subscription | null> {
        const existing = await this.findById(id);
        if (!existing) {
            return null;
        }

        const endDate = existing.endDate ?? new Date().toISOString().slice(0, 10);

        const [updated] = await this.db
            .update(subscriptions)
            .set({
                endDate: new Date(endDate),
                status: 'CANCELLED',
            })
            .where(eq(subscriptions.id, id))
            .returning();

        return updated ? this.toSubscription(updated) : null;
    }
}
